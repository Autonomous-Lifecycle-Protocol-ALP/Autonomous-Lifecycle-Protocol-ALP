import { describe, it, expect } from 'vitest';
import { spawn } from 'node:child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

const SERVER = path.resolve(process.cwd(), 'mcp-server/dist/index.js');
const EXAMPLE = path.resolve(process.cwd(), 'examples/todo-app');

interface JsonRpc {
  id?: number;
  result?: any;
  error?: any;
}

function sendRequest(
  proc: any,
  pending: Map<number, (r: JsonRpc) => void>,
  method: string,
  params: Record<string, unknown> = {},
): Promise<JsonRpc> {
  const id = Math.floor(Math.random() * 1e9);
  return new Promise((resolve) => {
    pending.set(id, resolve);
    proc.stdin.write(
      JSON.stringify({ jsonrpc: '2.0', id, method, params }) + '\n',
    );
  });
}

describe('mcp-server prompts and resources', () => {
  it('supports listing and getting prompts and reading virtual resources', async () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'alp-mcp-prompts-'));
    try {
      fs.cpSync(EXAMPLE, tmp, { recursive: true });

      const proc = spawn('node', [SERVER], {
        cwd: tmp,
        stdio: ['pipe', 'pipe', 'ignore'],
      });
      const pending = new Map<number, (r: JsonRpc) => void>();
      let buf = '';
      const onData = (chunk: Buffer) => {
        buf += chunk.toString();
        let idx: number;
        while ((idx = buf.indexOf('\n')) >= 0) {
          const line = buf.slice(0, idx).trim();
          buf = buf.slice(idx + 1);
          if (!line) continue;
          const msg = JSON.parse(line) as JsonRpc;
          if (msg.id !== undefined && pending.has(msg.id)) {
            pending.get(msg.id)!(msg);
            pending.delete(msg.id);
          }
        }
      };
      proc.stdout.on('data', onData);

      const send = (obj: unknown) => proc.stdin.write(JSON.stringify(obj) + '\n');
      send({ jsonrpc: '2.0', id: 0, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 't', version: '0' } } });

      // Test ListPrompts
      const promptList = await sendRequest(proc, pending, 'prompts/list');
      const promptNames = promptList.result.prompts.map((p: any) => p.name);
      expect(promptNames).toContain('alp_delegate_task');
      expect(promptNames).toContain('alp_review_workspace');
      expect(promptNames).toContain('alp_diagnose_failure');

      // Test GetPrompt
      const promptGet = await sendRequest(proc, pending, 'prompts/get', {
        name: 'alp_delegate_task',
        arguments: { title: 'Implement Auth Endpoint', agent: 'agent-dev', context: 'Sprint 2' },
      });
      expect(promptGet.result.messages[0].content.text).toContain('Implement Auth Endpoint');
      expect(promptGet.result.messages[0].content.text).toContain('agent-dev');

      // Test ListResources
      const resList = await sendRequest(proc, pending, 'resources/list');
      const uris = resList.result.resources.map((r: any) => r.uri);
      expect(uris).toContain('alp://workspace');
      expect(uris).toContain('alp://graph');
      expect(uris).toContain('alp://policies');
      expect(uris).toContain('alp://events');

      // Test ReadResource for alp://workspace
      const resRead = await sendRequest(proc, pending, 'resources/read', {
        uri: 'alp://workspace',
      });
      expect(resRead.result.contents[0].text).toContain('todo-app');

      // Test ReadResource for alp://policies
      const policyRead = await sendRequest(proc, pending, 'resources/read', {
        uri: 'alp://policies',
      });
      expect(policyRead.result.contents[0].text).toContain('compliant');

      proc.kill();
    } finally {
      for (let i = 0; i < 5; i++) {
        try {
          fs.rmSync(tmp, { recursive: true, force: true });
          break;
        } catch {
          await new Promise((r) => setTimeout(r, 200));
        }
      }
    }
  }, 20000);
});
