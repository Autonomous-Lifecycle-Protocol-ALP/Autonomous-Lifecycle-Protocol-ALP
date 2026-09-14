import * as fs from 'fs';
import * as path from 'path';
import {
  AlpParser,
  AlpObject,
  LockManager,
  SwarmClient,
  SwarmConfig,
} from '@autonomous-lifecycle-protocol-alp/parser';

export function loadAlpDirectory(
  dir: string,
  parser: AlpParser,
  results: AlpObject[]
) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      loadAlpDirectory(fullPath, parser, results);
    } else if (entry.name.endsWith('.alp')) {
      try {
        const content = fs.readFileSync(fullPath, 'utf-8');
        const objects = parser.parse(content);
        results.push(...objects);
      } catch {
      }
    }
  }
}

export function extractDependencies(obj: AlpObject): string[] {
  const deps: string[] = [];
  const blockingKeys = new Set(['depends_on', 'blocked_by', 'requires']);
  for (const [key, value] of Object.entries(obj)) {
    if (!blockingKeys.has(key)) continue;
    if (typeof value === 'string' && value.startsWith('-> ')) {
      deps.push(value.replace('-> ', ''));
    }
    if (Array.isArray(value)) {
      for (const item of value) {
        if (typeof item === 'string' && item.startsWith('-> ')) {
          deps.push(item.replace('-> ', ''));
        }
      }
    }
  }
  return deps;
}

export function releaseOnExit(lockManager: LockManager, taskId: string): void {
  let released = false;
  const release = () => {
    if (released) return;
    released = true;
    try {
      lockManager.release(taskId);
    } catch {
    }
  };
  process.once('exit', release);
  process.once('SIGINT', () => {
    release();
    process.exit(130);
  });
  process.once('SIGTERM', () => {
    release();
    process.exit(143);
  });
}

export function updateTaskStatusOnFile(taskId: string, newStatus: string, alpDir: string): boolean {
  let updated = false;
  const walk = (dir: string) => {
    if (updated) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (updated) return;
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (fullPath.endsWith('.alp')) {
        let content = fs.readFileSync(fullPath, 'utf8');
        const regex = new RegExp(`(id:\\s*${taskId}\\b[^@]*?status:\\s*)([^\\n]+)`);
        if (regex.test(content)) {
          content = content.replace(regex, `$1${newStatus}`);
          fs.writeFileSync(fullPath, content, 'utf8');
          updated = true;
        }
      }
    }
  };
  if (fs.existsSync(alpDir)) {
    walk(alpDir);
  }
  return updated;
}

export function resolveSwarmConfig(
  alpDir: string,
  swarmId: string,
  coordinator?: string,
  token?: string,
  node?: string
): SwarmConfig {
  const parser = new AlpParser();
  const objects: AlpObject[] = [];
  const walk = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === '.runtime' || entry.name === '.cache') continue;
        walk(full);
      } else if (entry.name.endsWith('.alp')) {
        try { objects.push(...parser.parse(fs.readFileSync(full, 'utf-8'))); } catch {}
      }
    }
  };
  walk(alpDir);
  const swarm = objects.find((o) => o._type === 'swarm' && o.id === swarmId);
  if (!swarm) {
    console.error(`Error: @swarm "${swarmId}" not found in workspace.`);
    process.exit(1);
  }
  const rawToken = token || (swarm as any).token;
  let resolvedToken: string | undefined;
  if (rawToken) {
    const m = /\$\{([^}]+)\}/.exec(rawToken);
    resolvedToken = m ? process.env[m[1]] : rawToken;
  }
  const rawHb = (swarm as any).heartbeat_seconds;
  const rawPull = (swarm as any).pull_state;
  return {
    id: swarmId,
    coordinator: coordinator || (swarm as any).coordinator || 'http://127.0.0.1:4000',
    token: resolvedToken,
    node_id: node || (swarm as any).node_id,
    heartbeat_seconds: rawHb === undefined ? undefined : Number(rawHb),
    pull_state: rawPull === undefined ? undefined : (rawPull === true || rawPull === 'true'),
    peers: (swarm as any).peers,
  };
}
