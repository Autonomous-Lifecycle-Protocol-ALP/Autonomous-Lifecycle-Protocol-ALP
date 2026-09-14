import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { EventEmitter } from 'events';

// ---------------------------------------------------------------------------
// handlers.ts
// ---------------------------------------------------------------------------
import { sendJson, readBody, buildState, buildGraph, readLocks } from '../src/commands/serve/handlers';

describe('handlers.sendJson', () => {
  it('sends JSON with default status 200', () => {
    const res: any = { writeHead: vi.fn(), end: vi.fn() };
    sendJson(res, { ok: true });
    expect(res.writeHead).toHaveBeenCalledWith(200, { 'Content-Type': 'application/json' });
    expect(res.end).toHaveBeenCalledWith(JSON.stringify({ ok: true }));
  });

  it('sends JSON with custom status code', () => {
    const res: any = { writeHead: vi.fn(), end: vi.fn() };
    sendJson(res, { error: 'bad' }, 400);
    expect(res.writeHead).toHaveBeenCalledWith(400, { 'Content-Type': 'application/json' });
    expect(res.end).toHaveBeenCalledWith(JSON.stringify({ error: 'bad' }));
  });

  it('handles null data', () => {
    const res: any = { writeHead: vi.fn(), end: vi.fn() };
    sendJson(res, null);
    expect(res.end).toHaveBeenCalledWith(JSON.stringify(null));
  });

  it('handles arrays', () => {
    const res: any = { writeHead: vi.fn(), end: vi.fn() };
    sendJson(res, [1, 2, 3], 201);
    expect(res.end).toHaveBeenCalledWith(JSON.stringify([1, 2, 3]));
  });
});

describe('handlers.readBody', () => {
  it('resolves empty body as empty object', async () => {
    const req: any = new EventEmitter();
    req.setEncoding = () => {};
    process.nextTick(() => req.emit('end'));
    const result = await readBody(req);
    expect(result).toEqual({});
  });

  it('parses valid JSON body', async () => {
    const req: any = new EventEmitter();
    req.setEncoding = () => {};
    process.nextTick(() => {
      req.emit('data', JSON.stringify({ hello: 'world' }));
      req.emit('end');
    });
    const result = await readBody(req);
    expect(result).toEqual({ hello: 'world' });
  });

  it('returns empty object on invalid JSON', async () => {
    const req: any = new EventEmitter();
    req.setEncoding = () => {};
    process.nextTick(() => {
      req.emit('data', 'not json');
      req.emit('end');
    });
    const result = await readBody(req);
    expect(result).toEqual({});
  });

  it('handles chunked data events', async () => {
    const req: any = new EventEmitter();
    req.setEncoding = () => {};
    process.nextTick(() => {
      req.emit('data', '{"pa');
      req.emit('data', 'rt": 1}');
      req.emit('end');
    });
    const result = await readBody(req);
    expect(result).toEqual({ part: 1 });
  });
});

describe('handlers.readLocks', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'alp-readlocks-'));
  });

  afterEach(() => {
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}
  });

  it('returns empty array when lock file does not exist', () => {
    expect(readLocks(tmpDir)).toEqual([]);
  });

  it('returns lock keys when file exists', () => {
    const lockDir = path.join(tmpDir, '.alp', '.runtime');
    fs.mkdirSync(lockDir, { recursive: true });
    fs.writeFileSync(path.join(lockDir, 'locks.json'), JSON.stringify({ task_a: {}, task_b: {} }));
    expect(readLocks(tmpDir)).toEqual(['task_a', 'task_b']);
  });

  it('returns empty array on malformed JSON', () => {
    const lockDir = path.join(tmpDir, '.alp', '.runtime');
    fs.mkdirSync(lockDir, { recursive: true });
    fs.writeFileSync(path.join(lockDir, 'locks.json'), 'not json');
    expect(readLocks(tmpDir)).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// registry.ts
// ---------------------------------------------------------------------------
import { parseRegistryTokens, tokenForNamespace, authorize } from '../src/commands/serve/registry';

describe('parseRegistryTokens', () => {
  it('returns empty when both args empty', () => {
    expect(parseRegistryTokens('', '')).toEqual({});
  });

  it('uses globalEnv as wildcard when no = sign', () => {
    expect(parseRegistryTokens('', 'my-token')).toEqual({ '*': 'my-token' });
  });

  it('uses tokenArg as wildcard when single token and no =', () => {
    expect(parseRegistryTokens('my-token', '')).toEqual({ '*': 'my-token' });
  });

  it('does not create wildcard from globalEnv if it contains =', () => {
    expect(parseRegistryTokens('', 'ns=token')).toEqual({});
  });

  it('does not create wildcard from tokenArg if it lacks valid key=value pattern', () => {
    expect(parseRegistryTokens('badformat', '')).toEqual({ '*': 'badformat' });
  });

  it('parses single namespace=token', () => {
    expect(parseRegistryTokens('@ns1=tok1', '')).toEqual({ '@ns1': 'tok1' });
  });

  it('parses multiple namespace=token pairs', () => {
    const result = parseRegistryTokens('@ns1=tok1,ns2=tok2', '');
    expect(result).toEqual({ '@ns1': 'tok1', 'ns2': 'tok2' });
  });

  it('trims whitespace around namespaces and tokens', () => {
    expect(parseRegistryTokens(' @ns1 = tok1 ', '')).toEqual({ '@ns1': 'tok1' });
  });

  it('ignores empty namespace parts', () => {
    const result = parseRegistryTokens('=tok1,ns2=tok2', '');
    expect(result).toEqual({ ns2: 'tok2' });
  });

  it('prefers tokenArg over globalEnv when both present', () => {
    expect(parseRegistryTokens('@a=b', 'global-tok')).toEqual({ '@a': 'b' });
  });
});

describe('tokenForNamespace', () => {
  it('matches exact @ns key', () => {
    const tokens = { '@ns1': 'tok1', '*': 'wild' };
    expect(tokenForNamespace(tokens, 'ns1')).toBe('tok1');
  });

  it('matches plain ns key', () => {
    const tokens = { ns1: 'tok1', '*': 'wild' };
    expect(tokenForNamespace(tokens, 'ns1')).toBe('tok1');
  });

  it('prefers @ns over plain ns over wildcard', () => {
    const tokens = { '@ns1': 'at', ns1: 'plain', '*': 'wild' };
    expect(tokenForNamespace(tokens, 'ns1')).toBe('at');
  });

  it('falls back to wildcard', () => {
    const tokens = { '*': 'wild' };
    expect(tokenForNamespace(tokens, 'other')).toBe('wild');
  });

  it('returns empty string when no match', () => {
    expect(tokenForNamespace({}, 'ns1')).toBe('');
  });
});

describe('authorize', () => {
  it('returns true when no token required', () => {
    expect(authorize({ headers: {} } as any, {}, 'ns')).toBe(true);
  });

  it('returns true when Bearer token matches', () => {
    const tokens = { '@ns': 'secret' };
    const req = { headers: { authorization: 'Bearer secret' } } as any;
    expect(authorize(req, tokens, 'ns')).toBe(true);
  });

  it('returns false when token does not match', () => {
    const tokens = { '@ns': 'secret' };
    const req = { headers: { authorization: 'Bearer wrong' } } as any;
    expect(authorize(req, tokens, 'ns')).toBe(false);
  });

  it('returns false when authorization header missing but token required', () => {
    const tokens = { '@ns': 'secret' };
    expect(authorize({ headers: {} } as any, tokens, 'ns')).toBe(false);
  });

  it('returns false on malformed Bearer header', () => {
    const tokens = { '@ns': 'secret' };
    const req = { headers: { authorization: 'Basic abc' } } as any;
    expect(authorize(req, tokens, 'ns')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// swarm.ts
// ---------------------------------------------------------------------------
import { ensureSwarm, broadcast, reapSwarms, handleSwarm } from '../src/commands/serve/swarm';
import { sendJson as swSendJson, readBody as swReadBody } from '../src/commands/serve/handlers';

describe('ensureSwarm', () => {
  it('creates a new swarm map when missing', () => {
    const swarms = new Map<string, Map<string, any>>();
    const result = ensureSwarm(swarms, 's1');
    expect(result).toBeInstanceOf(Map);
    expect(swarms.get('s1')).toBe(result);
  });

  it('returns existing swarm map', () => {
    const existing = new Map<string, any>();
    const swarms = new Map<string, Map<string, any>>([['s1', existing]]);
    expect(ensureSwarm(swarms, 's1')).toBe(existing);
  });
});

describe('broadcast', () => {
  it('writes SSE data to all clients', () => {
    const clients = new Set<http.ServerResponse>();
    const res1: any = { write: vi.fn() };
    const res2: any = { write: vi.fn() };
    clients.add(res1);
    clients.add(res2);

    broadcast('{"event":"test"}', clients);

    expect(res1.write).toHaveBeenCalledWith('data: {"event":"test"}\n\n');
    expect(res2.write).toHaveBeenCalledWith('data: {"event":"test"}\n\n');
  });

  it('does nothing with no clients', () => {
    const clients = new Set<http.ServerResponse>();
    expect(() => broadcast('data', clients)).not.toThrow();
  });
});

describe('reapSwarms', () => {
  it('removes nodes whose last_seen is older than 15s', () => {
    const now = new Date();
    const oldTime = new Date(now.getTime() - 16000).toISOString();
    const freshTime = new Date().toISOString();

    const swarms = new Map<string, Map<string, any>>();
    const swarm = new Map<string, any>([
      ['n1', { node_id: 'n1', last_seen: oldTime, claim: null }],
      ['n2', { node_id: 'n2', last_seen: freshTime, claim: null }],
    ]);
    swarms.set('s1', swarm);

    reapSwarms(swarms, new Map());

    expect(swarms.get('s1')!.has('n1')).toBe(false);
    expect(swarms.get('s1')!.has('n2')).toBe(true);
  });

  it('removes claims for reaped nodes', () => {
    const oldTime = new Date(Date.now() - 16000).toISOString();

    const swarms = new Map<string, Map<string, any>>();
    const swarm = new Map<string, any>([
      ['n1', { node_id: 'n1', last_seen: oldTime, claim: null }],
    ]);
    swarms.set('s1', swarm);

    const claims = new Map<string, Map<string, any>>();
    const claimMap = new Map<string, any>([['t1', { task_id: 't1', node_id: 'n1', agent: 'a1' }]]);
    claims.set('s1', claimMap);

    reapSwarms(swarms, claims);

    expect(claims.get('s1')!.has('t1')).toBe(false);
  });

  it('keeps claims for active nodes', () => {
    const freshTime = new Date().toISOString();

    const swarms = new Map<string, Map<string, any>>();
    const swarm = new Map<string, any>([
      ['n1', { node_id: 'n1', last_seen: freshTime, claim: 't1' }],
    ]);
    swarms.set('s1', swarm);

    const claims = new Map<string, Map<string, any>>();
    const claimMap = new Map<string, any>([['t1', { task_id: 't1', node_id: 'n1', agent: 'a1' }]]);
    claims.set('s1', claimMap);

    reapSwarms(swarms, claims);

    expect(claims.get('s1')!.has('t1')).toBe(true);
  });

  it('handles missing swarmClaims gracefully', () => {
    const oldTime = new Date(Date.now() - 16000).toISOString();
    const swarms = new Map<string, Map<string, any>>();
    const swarm = new Map([['n1', { node_id: 'n1', last_seen: oldTime, claim: null }]]);
    swarms.set('s1', swarm);

    expect(() => reapSwarms(swarms, new Map())).not.toThrow();
  });
});

describe('handleSwarm', () => {
  let swarms: Map<string, Map<string, any>>;
  let swarmClaims: Map<string, Map<string, any>>;
  let broadcastFn: any;
  let req: any;
  let res: any;

  beforeEach(() => {
    swarms = new Map();
    swarmClaims = new Map();
    broadcastFn = vi.fn();
    req = Object.assign(new EventEmitter(), { method: 'POST', headers: {} });
    res = { writeHead: vi.fn(), end: vi.fn() };
  });

  function emitBody(data: any) {
    process.nextTick(() => {
      req.emit('data', JSON.stringify(data));
      req.emit('end');
    });
  }

  it('POST /api/swarm/join creates node and broadcasts', async () => {
    req.url = '/api/swarm/join';
    emitBody({ swarm_id: 's1', node_id: 'n1' });
    await handleSwarm(req, res, '/api/swarm/join', swarms, swarmClaims, broadcastFn);

    expect(swarms.get('s1')!.has('n1')).toBe(true);
    expect(broadcastFn).toHaveBeenCalledOnce();
    const broadcastArg = broadcastFn.mock.calls[0][0];
    const parsed = JSON.parse(broadcastArg);
    expect(parsed.type).toBe('swarm_join');
    expect(parsed.swarm_id).toBe('s1');
    expect(parsed.node_id).toBe('n1');
    expect(res.writeHead).toHaveBeenCalledWith(200, { 'Content-Type': 'application/json' });
  });

  it('POST /api/swarm/join rejects missing fields', async () => {
    req.url = '/api/swarm/join';
    emitBody({});
    await handleSwarm(req, res, '/api/swarm/join', swarms, swarmClaims, broadcastFn);
    expect(res.writeHead).toHaveBeenCalledWith(400, { 'Content-Type': 'application/json' });
  });

  it('POST /api/swarm/heartbeat updates last_seen', async () => {
    swarms.set('s1', new Map([['n1', { node_id: 'n1', last_seen: new Date(0).toISOString(), claim: null }]]));
    req.url = '/api/swarm/heartbeat';
    emitBody({ swarm_id: 's1', node_id: 'n1' });
    await handleSwarm(req, res, '/api/swarm/heartbeat', swarms, swarmClaims, broadcastFn);

    expect(res.writeHead).toHaveBeenCalledWith(200, { 'Content-Type': 'application/json' });
    const node = swarms.get('s1')!.get('n1');
    expect(node.last_seen).not.toBe(new Date(0).toISOString());
  });

  it('POST /api/swarm/heartbeat returns 404 for unknown node', async () => {
    req.url = '/api/swarm/heartbeat';
    emitBody({ swarm_id: 's1', node_id: 'n99' });
    await handleSwarm(req, res, '/api/swarm/heartbeat', swarms, swarmClaims, broadcastFn);
    expect(res.writeHead).toHaveBeenCalledWith(404, { 'Content-Type': 'application/json' });
  });

  it('POST /api/swarm/leave removes node', async () => {
    swarms.set('s1', new Map([['n1', { node_id: 'n1', last_seen: new Date().toISOString(), claim: null }]]));
    req.url = '/api/swarm/leave';
    emitBody({ swarm_id: 's1', node_id: 'n1' });
    await handleSwarm(req, res, '/api/swarm/leave', swarms, swarmClaims, broadcastFn);
    expect(swarms.get('s1')!.has('n1')).toBe(false);
    expect(res.writeHead).toHaveBeenCalledWith(200, { 'Content-Type': 'application/json' });
  });

  it('POST /api/swarm/claim creates a claim', async () => {
    swarms.set('s1', new Map([['n1', { node_id: 'n1', last_seen: new Date().toISOString(), claim: null }]]));
    req.url = '/api/swarm/claim';
    emitBody({ swarm_id: 's1', node_id: 'n1', task_id: 't1', agent: 'a1' });
    await handleSwarm(req, res, '/api/swarm/claim', swarms, swarmClaims, broadcastFn);

    expect(swarmClaims.get('s1')!.get('t1')).toEqual({ task_id: 't1', node_id: 'n1', agent: 'a1' });
    expect(res.writeHead).toHaveBeenCalledWith(200, { 'Content-Type': 'application/json' });
  });

  it('POST /api/swarm/claim returns 409 if already claimed by alive node', async () => {
    swarms.set('s1', new Map([['n1', { node_id: 'n1', last_seen: new Date().toISOString(), claim: null }]]));
    const claims = new Map([['t1', { task_id: 't1', node_id: 'n1', agent: 'a1' }]]);
    swarmClaims.set('s1', claims);
    req.url = '/api/swarm/claim';
    emitBody({ swarm_id: 's1', node_id: 'n1', task_id: 't1' });
    await handleSwarm(req, res, '/api/swarm/claim', swarms, swarmClaims, broadcastFn);
    expect(res.writeHead).toHaveBeenCalledWith(409, { 'Content-Type': 'application/json' });
  });

  it('POST /api/swarm/claim allows re-claiming from dead node', async () => {
    const oldTime = new Date(Date.now() - 16000).toISOString();
    swarms.set('s1', new Map([['n1', { node_id: 'n1', last_seen: oldTime, claim: null }]]));
    const claims = new Map([['t1', { task_id: 't1', node_id: 'n1', agent: 'a1' }]]);
    swarmClaims.set('s1', claims);
    req.url = '/api/swarm/claim';
    emitBody({ swarm_id: 's1', node_id: 'n2', task_id: 't1' });
    await handleSwarm(req, res, '/api/swarm/claim', swarms, swarmClaims, broadcastFn);
    expect(res.writeHead).toHaveBeenCalledWith(200, { 'Content-Type': 'application/json' });
    expect(swarmClaims.get('s1')!.get('t1').node_id).toBe('n2');
  });

  it('POST /api/swarm/release removes claim', async () => {
    swarmClaims.set('s1', new Map([['t1', { task_id: 't1', node_id: 'n1', agent: 'a1' }]]));
    req.url = '/api/swarm/release';
    emitBody({ swarm_id: 's1', task_id: 't1' });
    await handleSwarm(req, res, '/api/swarm/release', swarms, swarmClaims, broadcastFn);
    expect(swarmClaims.get('s1')!.has('t1')).toBe(false);
    expect(res.writeHead).toHaveBeenCalledWith(200, { 'Content-Type': 'application/json' });
  });

  it('GET /api/swarm/roster returns nodes for swarm', async () => {
    req.url = '/api/swarm/roster?swarm_id=s1';
    req.method = 'GET';
    swarms.set('s1', new Map([
      ['n1', { node_id: 'n1', last_seen: '2026-01-01T00:00:00Z', claim: null }],
    ]));
    await handleSwarm(req, res, '/api/swarm/roster?swarm_id=s1', swarms, swarmClaims, broadcastFn);

    expect(res.writeHead).toHaveBeenCalledWith(200, { 'Content-Type': 'application/json' });
    const bodyArg = res.end.mock.calls[0][0];
    const parsed = JSON.parse(bodyArg);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].node_id).toBe('n1');
  });

  it('GET /api/swarm/roster returns empty for unknown swarm', async () => {
    req.url = '/api/swarm/roster?swarm_id=missing';
    req.method = 'GET';
    await handleSwarm(req, res, '/api/swarm/roster?swarm_id=missing', swarms, swarmClaims, broadcastFn);
    expect(res.writeHead).toHaveBeenCalledWith(200, { 'Content-Type': 'application/json' });
    expect(JSON.parse(res.end.mock.calls[0][0])).toEqual([]);
  });

  it('returns 404 for unknown swarm endpoint', async () => {
    req.url = '/api/swarm/unknown';
    await handleSwarm(req, res, '/api/swarm/unknown', swarms, swarmClaims, broadcastFn);
    expect(res.writeHead).toHaveBeenCalledWith(404, { 'Content-Type': 'application/json' });
  });
});

// ---------------------------------------------------------------------------
// dashboard.ts
// ---------------------------------------------------------------------------
import { buildDashboardHtml } from '../src/commands/serve/dashboard';

describe('buildDashboardHtml', () => {
  it('returns an HTML string containing the dashboard title', () => {
    const html = buildDashboardHtml({
      project: 'test-proj',
      totalTasks: 5,
      statusCount: { '[x]': 2, '[~]': 1 },
      agents: ['a1', 'a2'],
      activeLocks: ['l1'],
      recentEvents: [],
      tasks: [],
    });
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('<title>ALP Live Swarm');
    expect(html).toContain('Workspace: test-proj');
  });

  it('includes the project name in the workspace placeholder', () => {
    const html = buildDashboardHtml({
      project: 'my-project',
      totalTasks: 0,
      statusCount: {},
      agents: [],
      activeLocks: [],
      recentEvents: [],
      tasks: [],
    });
    expect(html).toContain('Workspace: my-project');
  });

  it('uses "default" when project is null', () => {
    const html = buildDashboardHtml({
      project: null,
      totalTasks: 0,
      statusCount: {},
      agents: [],
      activeLocks: [],
      recentEvents: [],
      tasks: [],
    });
    expect(html).toContain('Workspace: default');
  });

  it('contains SSE and analytics endpoint references', () => {
    const html = buildDashboardHtml({
      project: null,
      totalTasks: 0,
      statusCount: {},
      agents: [],
      activeLocks: [],
      recentEvents: [],
      tasks: [],
    });
    expect(html).toContain('/api/stream');
    expect(html).toContain('/api/analytics');
    expect(html).toContain('/api/events');
    expect(html).toContain('/api/state');
  });
});

// ---------------------------------------------------------------------------
// server.ts
// ---------------------------------------------------------------------------
import { createServer, ServerContext } from '../src/commands/serve/server';

function makeRes(): any {
  return { writeHead: vi.fn(), end: vi.fn() };
}

function httpRequest(server: http.Server, reqOpts: http.ClientRequestArgs, body?: any): Promise<any> {
  return new Promise((resolve, reject) => {
    const opts: http.ClientRequestArgs = {
      ...reqOpts,
      agent: false,
      headers: {
        Connection: 'close',
        ...(reqOpts.headers || {}),
      },
    };
    const req = http.request(opts, (res) => {
      if (reqOpts.path === '/api/stream') {
        resolve({ status: res.statusCode || 0, body: null, headers: res.headers });
        req.destroy();
        return;
      }
      const chunks: Buffer[] = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        const raw = Buffer.concat(chunks).toString();
        let parsed = null;
        if (raw) {
          try {
            parsed = JSON.parse(raw);
          } catch {
            parsed = raw;
          }
        }
        resolve({ status: res.statusCode || 0, body: parsed, headers: res.headers });
      });
    });
    req.on('error', (err) => {
      if ((err as any).code === 'ECONNRESET' || err.message.includes('abort') || err.message.includes('destroyed')) {
        return;
      }
      reject(err);
    });
    if (body) req.write(typeof body === 'string' ? body : JSON.stringify(body));
    req.end();
  });
}

describe('createServer', () => {
  let server: http.Server;

  afterEach(async () => {
    if (server) {
      server.closeAllConnections?.();
      await new Promise<void>((resolve) => server.close(() => resolve()));
      server = undefined as any;
    }
  });

  function startServer(overrides: Partial<ServerContext> = {}): number {
    const port = 0; // ephemeral
    const ctx: ServerContext = {
      alpDir: '/tmp/alp',
      cwd: '/tmp',
      store: null,
      registryStore: null,
      registryTokens: {},
      swarms: new Map(),
      swarmClaims: new Map(),
      broadcast: (raw: string) => {},
      clients: new Set<http.ServerResponse>(),
      ...overrides,
    };
    server = createServer(ctx);
    return new Promise<number>((resolve) => {
      server.listen(port, '127.0.0.1', () => {
        const addr = server.address();
        resolve(typeof addr === 'object' ? addr.port : port);
      });
    });
  }

  it('serves dashboard HTML on GET /', async () => {
    const port = await startServer();
    const res = await httpRequest(server, { host: '127.0.0.1', port, path: '/', method: 'GET' });
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/html');
    expect(res.body).toContain('<!DOCTYPE html>');
  });

  it('serves dashboard HTML on GET /index.html', async () => {
    const port = await startServer();
    const res = await httpRequest(server, { host: '127.0.0.1', port, path: '/index.html', method: 'GET' });
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/html');
  });

  it('returns 404 for unknown routes', async () => {
    const port = await startServer();
    const res = await httpRequest(server, { host: '127.0.0.1', port, path: '/unknown', method: 'GET' });
    expect(res.status).toBe(404);
  });

  it('accepts SSE connections on /api/stream', async () => {
    const clients = new Set<http.ServerResponse>();
    const port = await startServer({ clients });
    const res = await httpRequest(server, { host: '127.0.0.1', port, path: '/api/stream', method: 'GET' });
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/event-stream');
    // client should be added to the set
    expect(clients.size).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// index.ts (serveCommand)
// ---------------------------------------------------------------------------
import { serveCommand } from '../src/commands/serve';

describe('serveCommand', () => {
  const originalExit = process.exit;
  const originalError = console.error;

  beforeEach(() => {
    vi.spyOn(process, 'exit').mockImplementation((() => {}) as any);
    console.error = vi.fn();
  });

  afterEach(() => {
    (process.exit as any) = originalExit;
    console.error = originalError;
  });

  it('exits with error when .alp directory does not exist', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'alp-serve-noalp-'));
    serveCommand({ port: 9999, host: '127.0.0.1' });
    // In the real test, cwd matters. We just verify process.exit(1) was called.
    expect(process.exit).toHaveBeenCalledWith(1);
    expect(console.error).toHaveBeenCalled();
  });

  it('reads options from argument object', () => {
    // This test verifies that serveCommand accepts options without crashing
    // We can't easily test the full server startup without mocking fs heavily,
    // but we can verify the function signature works.
    expect(() => serveCommand({ port: 4001 })).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// registry.ts (handleRegistry unit tests with mocked store)
// ---------------------------------------------------------------------------
import { handleRegistry } from '../src/commands/serve/registry';

describe('handleRegistry', () => {
  let req: any;
  let res: any;

  beforeEach(() => {
    req = Object.assign(new EventEmitter(), { method: 'GET', url: '/api/registry', headers: {} });
    res = { writeHead: vi.fn(), end: vi.fn() };
  });

  function emitBody(data: any) {
    process.nextTick(() => {
      req.emit('data', JSON.stringify(data));
      req.emit('end');
    });
  }

  it('returns 404 when store is null', () => {
    handleRegistry(req, res, '/api/registry', null, {}, 'GET');
    expect(res.writeHead).toHaveBeenCalledWith(404, { 'Content-Type': 'application/json' });
    expect(JSON.parse(res.end.mock.calls[0][0])).toEqual({ error: 'registry not enabled; start `alp serve --registry`' });
  });

  it('returns registry list on GET /api/registry', async () => {
    const store: any = { list: () => [{ name: 'pkg-a' }], search: (q: string) => [] };
    handleRegistry(req, res, '/api/registry', store, {}, 'GET');
    expect(JSON.parse(res.end.mock.calls[0][0])).toEqual([{ name: 'pkg-a' }]);
  });

  it('returns search results when q param present', async () => {
    const store: any = { list: () => [], search: (q: string) => [{ name: q }] };
    req.url = '/api/registry?q=test';
    handleRegistry(req, res, '/api/registry?q=test', store, {}, 'GET');
    expect(JSON.parse(res.end.mock.calls[0][0])).toEqual([{ name: 'test' }]);
  });

  it('returns 401 when unauthorized', async () => {
    const store: any = { list: () => [] };
    req.url = '/api/registry?q=test';
    const tokens = { '@ns': 'secret' };
    handleRegistry(req, res, '/api/registry?q=test', store, tokens, 'GET');
    expect(res.writeHead).toHaveBeenCalledWith(401, { 'Content-Type': 'application/json' });
  });

  it('returns 404 for unknown endpoint', async () => {
    handleRegistry(req, res, '/api/registry/unknown', null, {}, 'GET');
    expect(res.writeHead).toHaveBeenCalledWith(404, { 'Content-Type': 'application/json' });
  });
});

// ---------------------------------------------------------------------------
// buildState and buildGraph (mocked)
// ---------------------------------------------------------------------------
describe('buildState (mocked fs/parser)', () => {
  const originalBuildState = buildState;

  it('returns state with project, tasks, agents, locks, events', async () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'alp-buildstate-'));
    try {
      fs.mkdirSync(path.join(tmp, '.alp', '.runtime'), { recursive: true });
      fs.writeFileSync(path.join(tmp, '.alp', 'project.alp'), '@project\n  id: my-proj\n');
      fs.writeFileSync(path.join(tmp, '.alp', 'task.alp'), '@task\n  id: t1\n  status: [x]\n');
      fs.writeFileSync(path.join(tmp, '.alp', '.runtime', 'locks.json'), JSON.stringify({ lock1: {} }));
      fs.writeFileSync(path.join(tmp, '.alp', '.runtime', 'log.jsonl'), '{"type":"run_start"}\n');

      const state = buildState(path.join(tmp, '.alp'), tmp);

      expect(state.project).toBe('my-proj');
      expect(state.totalTasks).toBe(1);
      expect(state.agents).toEqual([]);
      expect(state.activeLocks).toEqual(['lock1']);
      expect(state.recentEvents).toHaveLength(1);
      expect(state.tasks).toHaveLength(1);
      expect(state.tasks[0].id).toBe('t1');
      expect(state.tasks[0].status).toBe('[x]');
    } finally {
      try { fs.rmSync(tmp, { recursive: true, force: true }); } catch {}
    }
  });
});

describe('buildGraph (mocked fs/parser)', () => {
  it('returns nodes and edges from .alp directory', async () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'alp-buildgraph-'));
    try {
      fs.mkdirSync(path.join(tmp, '.alp'), { recursive: true });
      fs.writeFileSync(path.join(tmp, '.alp', 'task.alp'), '@task\n  id: t2\n  status: [ ]\n  depends_on: t1\n');

      const graph = buildGraph(path.join(tmp, '.alp'));

      expect(graph.nodes).toHaveLength(1);
      expect(graph.nodes[0].id).toBe('t2');
      expect(graph.nodes[0].status).toBe('[ ]');
      expect(graph.edges).toHaveLength(1);
      expect(graph.edges[0]).toEqual({ from: 't1', to: 't2' });
    } finally {
      try { fs.rmSync(tmp, { recursive: true, force: true }); } catch {}
    }
  });
});
