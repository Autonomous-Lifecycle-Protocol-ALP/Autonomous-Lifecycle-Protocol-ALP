import { spawn } from 'node:child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

export const SERVER = path.resolve(process.cwd(), 'mcp-server/dist/index.js');

export interface JsonRpc {
  id?: number;
  result?: any;
  error?: any;
}

export function startServer(cwd: string) {
  const proc = spawn('node', [SERVER], { cwd, stdio: ['pipe', 'pipe', 'pipe'] });
  const pending = new Map<number, (r: JsonRpc) => void>();
  let buf = '';
  const onData = (chunk: Buffer) => {
    buf += chunk.toString('utf8');
    let idx: number;
    while ((idx = buf.indexOf('\n')) >= 0) {
      const line = buf.slice(0, idx).trim();
      buf = buf.slice(idx + 1);
      if (!line) continue;
      try {
        const msg = JSON.parse(line) as JsonRpc;
        if (msg.id !== undefined && pending.has(msg.id)) {
          pending.get(msg.id)!(msg);
          pending.delete(msg.id);
        }
      } catch {
        // ignore non-JSON stdout lines
      }
    }
  };
  proc.stdout.on('data', onData);
  proc.stderr.on('data', (chunk: Buffer) => {
    console.error('[MCP STDERR]', chunk.toString('utf8'));
  });
  proc.on('error', (err) => {
    console.error('[MCP SPAWN ERROR]', err);
  });

  const send = (obj: unknown) => proc.stdin.write(JSON.stringify(obj) + '\n');

  return {
    proc,
    send,
    pending,
    onData,
  };
}

export function callTool(
  proc: any,
  pending: Map<number, (r: JsonRpc) => void>,
  name: string,
  args: Record<string, unknown>,
): Promise<JsonRpc> {
  const id = Math.floor(Math.random() * 1e9);
  return new Promise((resolve, reject) => {
    pending.set(id, resolve);
    const timeout = setTimeout(() => {
      pending.delete(id);
      reject(new Error(`Tool ${name} timed out waiting for response`));
    }, 15000);

    const onMsg = (msg: JsonRpc) => {
      if (msg.id === id) {
        clearTimeout(timeout);
        resolve(msg);
      }
    };
    const originalResolve = pending.get(id)!;
    pending.set(id, ((msg: JsonRpc) => {
      originalResolve(msg);
      onMsg(msg);
    }) as any);

    proc.stdin.write(
      JSON.stringify({ jsonrpc: '2.0', id, method: 'tools/call', params: { name, arguments: args } }) + '\n',
    );
  });
}
