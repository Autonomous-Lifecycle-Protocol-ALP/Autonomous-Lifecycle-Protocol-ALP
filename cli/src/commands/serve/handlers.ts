import * as fs from 'fs';
import * as path from 'path';
import * as http from 'http';
import { AlpParser, AlpObject, StateStore, computeAnalytics } from '@autonomous-lifecycle-protocol-alp/parser';
import { readEvents } from '../../runtime';
import { loadAlpDir, extractDeps } from '../../utils';

export function sendJson(res: http.ServerResponse, data: unknown, status = 200) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

export function readBody(req: http.IncomingMessage): Promise<any> {
  return new Promise((resolve) => {
    let raw = '';
    req.on('data', (c) => (raw += c));
    req.on('end', () => {
      if (!raw) return resolve({});
      try { resolve(JSON.parse(raw)); } catch { resolve({}); }
    });
  });
}

export function buildState(alpDir: string, cwd: string) {
  const parser = new AlpParser();
  const objects: AlpObject[] = [];
  loadAlpDir(alpDir, parser, objects);

  const tasks = objects.filter((o) => o._type === 'task');
  const statusCount: Record<string, number> = {};
  for (const t of tasks) {
    const s = String(t.status ?? '[ ]');
    statusCount[s] = (statusCount[s] || 0) + 1;
  }
  const agents = objects.filter((o) => o._type === 'agent').map((a) => a.id);
  const events = readEvents(alpDir);
  const activeLocks = readLocks(cwd);

  return {
    project: objects.find((o) => o._type === 'project')?.id ?? null,
    totalTasks: tasks.length,
    statusCount,
    agents,
    activeLocks,
    recentEvents: events.slice(-50),
    tasks: tasks.map((t) => ({
      id: t.id,
      status: t.status ?? '[ ]',
      owner: (t as any).owner ?? null,
    })),
  };
}

export function buildGraph(alpDir: string) {
  const parser = new AlpParser();
  const objects: AlpObject[] = [];
  loadAlpDir(alpDir, parser, objects);
  const nodes = objects
    .filter((o) => o._type === 'task')
    .map((t) => ({ id: t.id, status: t.status ?? '[ ]' }));
  const edges: { from: string; to: string }[] = [];
  for (const t of objects.filter((o) => o._type === 'task')) {
    for (const dep of extractDeps(t)) {
      edges.push({ from: dep, to: t.id as string });
    }
  }
  return { nodes, edges };
}

export function readLocks(cwd: string): string[] {
  const lockFile = path.join(cwd, '.alp', '.runtime', 'locks.json');
  if (!fs.existsSync(lockFile)) return [];
  try {
    const locks = JSON.parse(fs.readFileSync(lockFile, 'utf-8')) as Record<string, unknown>;
    return Object.keys(locks);
  } catch {
    return [];
  }
}
