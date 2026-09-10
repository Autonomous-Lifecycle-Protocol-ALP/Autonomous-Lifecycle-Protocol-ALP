import * as http from 'http';
import { readEvents } from '../../runtime';
import { computeAnalytics } from '@autonomous-lifecycle-protocol-alp/parser';
import { buildState, buildGraph, sendJson } from './handlers';
import { handleSwarm } from './swarm';
import { handleRegistry } from './registry';
import { DASHBOARD_HTML } from './dashboard';
import { SwarmNodeState } from './types';

export interface ServerContext {
  alpDir: string;
  cwd: string;
  store: any;
  registryStore: any;
  registryTokens: Record<string, string>;
  registrySigner?: string;
  swarms: Map<string, Map<string, SwarmNodeState>>;
  swarmClaims: Map<string, Map<string, { task_id: string; node_id: string; agent: string }>>;
  broadcast: (raw: string) => void;
  clients: Set<http.ServerResponse>;
}

export function createServer(ctx: ServerContext): http.Server {
  const server = http.createServer((req, res) => {
    const url = req.url || '/';

    if (url === '/' || url === '/index.html') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(DASHBOARD_HTML);
      return;
    }

    if (url === '/api/state') {
      sendJson(res, buildState(ctx.alpDir, ctx.cwd));
      return;
    }

    if (url === '/api/graph') {
      sendJson(res, buildGraph(ctx.alpDir));
      return;
    }

    if (url === '/api/events') {
      sendJson(res, readEvents(ctx.alpDir));
      return;
    }

    if (url === '/api/analytics') {
      const events = ctx.store ? ctx.store.analytics() : computeAnalytics(readEvents(ctx.alpDir) as any);
      sendJson(res, events);
      return;
    }

    if (url.startsWith('/api/swarm')) {
      handleSwarm(req, res, url, ctx.swarms, ctx.swarmClaims, ctx.broadcast);
      return;
    }

    if (url.startsWith('/api/registry')) {
      handleRegistry(req, res, url, ctx.registryStore, ctx.registryTokens, req.method || 'GET', ctx.registrySigner);
      return;
    }

    if (url === '/api/stream') {
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      });
      res.write(': connected\n\n');
      ctx.clients.add(res);
      req.on('close', () => ctx.clients.delete(res));
      return;
    }

    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  });

  return server;
}
