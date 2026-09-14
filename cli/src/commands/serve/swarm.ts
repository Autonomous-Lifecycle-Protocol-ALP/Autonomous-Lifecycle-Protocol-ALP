import * as http from 'http';
import { sendJson, readBody } from './handlers';
import { SwarmNodeState } from './types';

export function reapSwarms(
  swarms: Map<string, Map<string, SwarmNodeState>>,
  swarmClaims: Map<string, Map<string, { task_id: string; node_id: string; agent: string }>>,
) {
  const now = Date.now();
  for (const [sid, nodes] of swarms) {
    for (const [nid, n] of nodes) {
      if (now - Date.parse(n.last_seen) > 15000) {
        nodes.delete(nid);
        if (swarmClaims.has(sid)) {
          for (const [tid, c] of swarmClaims.get(sid)!) {
            if (c.node_id === nid) swarmClaims.get(sid)!.delete(tid);
          }
        }
      }
    }
  }
}

export function broadcast(rawJson: string, clients: Set<http.ServerResponse>) {
  for (const res of clients) {
    res.write(`data: ${rawJson}\n\n`);
  }
}

export function ensureSwarm(
  swarms: Map<string, Map<string, SwarmNodeState>>,
  sid: string,
): Map<string, SwarmNodeState> {
  let s = swarms.get(sid);
  if (!s) { s = new Map(); swarms.set(sid, s); }
  return s;
}

export function handleSwarm(
  req: http.IncomingMessage,
  res: http.ServerResponse,
  url: string,
  swarms: Map<string, Map<string, SwarmNodeState>>,
  swarmClaims: Map<string, Map<string, { task_id: string; node_id: string; agent: string }>>,
  broadcastFn: (raw: string) => void,
): Promise<void> | void {
  if (url.startsWith('/api/swarm/join') && req.method === 'POST') {
    return readBody(req).then((b) => {
      const sid = String(b.swarm_id ?? '');
      const nid = String(b.node_id ?? '');
      if (!sid || !nid) return sendJson(res, { error: 'swarm_id and node_id required' }, 400);
      const nodes = ensureSwarm(swarms, sid);
      const now = new Date().toISOString();
      nodes.set(nid, { node_id: nid, last_seen: now, claim: nodes.get(nid)?.claim ?? null });
      broadcastFn(JSON.stringify({ timestamp: now, type: 'swarm_join', swarm_id: sid, node_id: nid, source: 'coordinator' }));
      sendJson(res, { node_id: nid, last_seen: now, claim: nodes.get(nid)!.claim });
    });
  }

  if (url.startsWith('/api/swarm/heartbeat') && req.method === 'POST') {
    return readBody(req).then((b) => {
      const sid = String(b.swarm_id ?? '');
      const nid = String(b.node_id ?? '');
      const nodes = swarms.get(sid);
      if (!nodes || !nodes.has(nid)) return sendJson(res, { error: 'unknown node' }, 404);
      const now = new Date().toISOString();
      const node = nodes.get(nid)!;
      node.last_seen = now;
      if (b.claim !== undefined) node.claim = b.claim;
      sendJson(res, { ok: true, last_seen: now });
    });
  }

  if (url.startsWith('/api/swarm/leave') && req.method === 'POST') {
    return readBody(req).then((b) => {
      const sid = String(b.swarm_id ?? '');
      const nid = String(b.node_id ?? '');
      swarms.get(sid)?.delete(nid);
      if (swarmClaims.has(sid)) {
        for (const [tid, c] of swarmClaims.get(sid)!) if (c.node_id === nid) swarmClaims.get(sid)!.delete(tid);
      }
      sendJson(res, { ok: true });
    });
  }

  if (url.startsWith('/api/swarm/claim') && req.method === 'POST') {
    return readBody(req).then((b) => {
      const sid = String(b.swarm_id ?? '');
      const nid = String(b.node_id ?? '');
      const tid = String(b.task_id ?? '');
      const agent = String(b.agent ?? nid);
      const claims = swarmClaims.get(sid);
      if (claims && claims.has(tid)) {
        const holder = claims.get(tid)!;
        const holderNode = swarms.get(sid)?.get(holder.node_id);
        const holderAlive = holderNode && (Date.now() - Date.parse(holderNode.last_seen) <= 15000);
        if (holderAlive) return sendJson(res, { error: 'already claimed', by: holder.node_id }, 409);
        claims.delete(tid);
      }
      ensureSwarm(swarms, sid);
      if (!swarmClaims.has(sid)) swarmClaims.set(sid, new Map());
      const claim = { task_id: tid, node_id: nid, agent };
      swarmClaims.get(sid)!.set(tid, claim);
      const node = swarms.get(sid)?.get(nid);
      if (node) node.claim = tid;
      sendJson(res, claim);
    });
  }

  if (url.startsWith('/api/swarm/release') && req.method === 'POST') {
    return readBody(req).then((b) => {
      const sid = String(b.swarm_id ?? '');
      const tid = String(b.task_id ?? '');
      swarmClaims.get(sid)?.delete(tid);
      sendJson(res, { ok: true });
    });
  }

  if (url.startsWith('/api/swarm/roster')) {
    const sid = new URL('http://x' + url).searchParams.get('swarm_id') ?? '';
    const nodes = [...(swarms.get(sid)?.values() ?? [])].map((n) => ({
      node_id: n.node_id,
      last_seen: n.last_seen,
      claim: n.claim,
    }));
    sendJson(res, nodes);
    return;
  }

  sendJson(res, { error: 'unknown swarm endpoint' }, 404);
}

