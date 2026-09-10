import * as fs from 'fs';
import * as path from 'path';
import * as http from 'http';
import { StateStore } from '@autonomous-lifecycle-protocol-alp/parser';
import { readEvents, runtimeLogPath } from '../../runtime';
import { RegistryStore } from '../../registry-store';
import { loadAlprc } from '../../registry';
import { ServeOptions, SwarmNodeState } from './types';
import { createServer } from './server';
import { reapSwarms, broadcast } from './swarm';
import { parseRegistryTokens } from './registry';

export function serveCommand(options?: ServeOptions) {
  const cwd = process.cwd();
  const alpDir = path.resolve(cwd, '.alp');
  if (!fs.existsSync(alpDir)) {
    console.error('Error: .alp directory not found. Run `alp init` first.');
    process.exit(1);
    return;
  }

  const port = options?.port || 4000;
  const host = options?.host || '127.0.0.1';

  const store = options?.db ? new StateStore(alpDir) : null;
  if (store) {
    const added = store.ingest(readEvents(alpDir) as any);
    store.save();
    console.log(`[SAVE] State store enabled (${store.size} events, +${added} new).`);
  }

  const registryTrust = loadAlprc(cwd).trustedKeys;
  const registryStore = options?.registry ? new RegistryStore(cwd, registryTrust) : null;
  const registryTokens = parseRegistryTokens(
    options?.registryToken || process.env.ALP_REGISTRY_TOKENS || '',
    process.env.ALP_REGISTRY_TOKEN || '',
  );
  let registrySigner: string | undefined;
  const signKeyPath = options?.registrySignKey || process.env.ALP_REGISTRY_SIGN_KEY;
  if (signKeyPath && fs.existsSync(signKeyPath)) {
    try { registrySigner = fs.readFileSync(signKeyPath, 'utf-8'); } catch { /* ignore */ }
  } else if (signKeyPath && signKeyPath.includes('-----BEGIN')) {
    registrySigner = signKeyPath;
  }
  if (registryStore) {
    const protectedNs = Object.keys(registryTokens).filter((k) => k !== '*').length;
    const note = protectedNs ? ` (${protectedNs} private namespace(s))` : (registryTokens['*'] ? ' (token-protected)' : '');
    console.log(`[PKG] Registry enabled at /.alp/registry${note}`);
  }

  const swarms = new Map<string, Map<string, SwarmNodeState>>();
  const swarmClaims = new Map<string, Map<string, { task_id: string; node_id: string; agent: string }>>();
  const SWARM_TIMEOUT_MS = 15000;

  const swarmTimer = setInterval(() => reapSwarms(swarms, swarmClaims), 5000);

  const clients = new Set<http.ServerResponse>();

  let lastSize = 0;
  const logPath = runtimeLogPath(alpDir);

  function pumpNewEvents() {
    try {
      if (!fs.existsSync(logPath)) return;
      const { size } = fs.statSync(logPath);
      if (size <= lastSize) {
        lastSize = size;
        return;
      }
      const fd = fs.openSync(logPath, 'r');
      const buf = Buffer.alloc(size - lastSize);
      fs.readSync(fd, buf, 0, buf.length, lastSize);
      fs.closeSync(fd);
      lastSize = size;
      const chunk = buf.toString('utf-8');
      const ingested: any[] = [];
      for (const line of chunk.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        broadcast(trimmed, clients);
        if (store) {
          try {
            ingested.push(JSON.parse(trimmed));
          } catch {
            /* skip malformed */
          }
        }
      }
      if (store && ingested.length) {
        store.ingest(ingested);
        store.save();
      }
    } catch {
      /* best-effort tail */
    }
  }

  if (fs.existsSync(logPath)) {
    lastSize = fs.statSync(logPath).size;
  }
  const pollTimer = setInterval(pumpNewEvents, 500);

  const server = createServer({
    alpDir,
    cwd,
    store,
    registryStore,
    registryTokens,
    registrySigner,
    swarms,
    swarmClaims,
    broadcast: (raw: string) => broadcast(raw, clients),
    clients,
  });

  server.listen(port, host, () => {
    console.log(`\n🛰️  ALP State Server running at http://${host}:${port}`);
    console.log(`   Dashboard:   http://${host}:${port}/`);
    console.log(`   Live stream: http://${host}:${port}/api/stream`);
    console.log(`   Analytics:   http://${host}:${port}/api/analytics${store ? '  (persistent)' : ''}`);
    console.log(`   Tailing:     ${path.relative(cwd, logPath)}`);
    console.log(`\nPress Ctrl+C to stop.\n`);
  });

  const shutdown = () => {
    clearInterval(pollTimer);
    clearInterval(swarmTimer);
    for (const res of clients) res.end();
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(0), 500);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}
