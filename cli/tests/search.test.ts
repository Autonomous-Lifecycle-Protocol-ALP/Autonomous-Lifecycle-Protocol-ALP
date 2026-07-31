import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

const CLI = path.resolve(process.cwd(), 'cli/dist/index.js');

describe('alp search', () => {
  it('searches by id', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'alp-search-'));
    try {
      fs.mkdirSync(path.join(tmp, '.alp'), { recursive: true });
      fs.writeFileSync(path.join(tmp, '.alp', 'a.alp'), '@task\n  id: task-1\n  description: Alpha\n@task\n  id: task-2\n  description: Beta\n', 'utf-8');

      const out = execFileSync('node', [CLI, 'search', '--query', 'task-1'], {
        cwd: tmp,
        encoding: 'utf-8',
        timeout: 30000,
      });

      expect(out).toContain('task-1');
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  it('filters by type', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'alp-search-'));
    try {
      fs.mkdirSync(path.join(tmp, '.alp'), { recursive: true });
      fs.writeFileSync(path.join(tmp, '.alp', 'a.alp'), '@task\n  id: task-1\n@agent\n  id: agent-1\n', 'utf-8');

      const out = execFileSync('node', [CLI, 'search', '--query', '1', '--type', 'agent'], {
        cwd: tmp,
        encoding: 'utf-8',
        timeout: 30000,
      });

      expect(out).toContain('agent-1');
      expect(out).not.toContain('task-1');
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  it('supports regex search', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'alp-search-'));
    try {
      fs.mkdirSync(path.join(tmp, '.alp'), { recursive: true });
      fs.writeFileSync(path.join(tmp, '.alp', 'a.alp'), '@task\n  id: task-1\n  description: First task\n@task\n  id: task-2\n  description: Second task\n', 'utf-8');

      const out = execFileSync('node', [CLI, 'search', '--query', '^task-\\d$', '--regex'], {
        cwd: tmp,
        encoding: 'utf-8',
        timeout: 30000,
      });

      expect(out).toContain('task-1');
      expect(out).toContain('task-2');
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  it('returns no matches without error', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'alp-search-'));
    try {
      fs.mkdirSync(path.join(tmp, '.alp'), { recursive: true });
      fs.writeFileSync(path.join(tmp, '.alp', 'a.alp'), '@task\n  id: task-1\n', 'utf-8');

      const out = execFileSync('node', [CLI, 'search', '--query', 'nothing'], {
        cwd: tmp,
        encoding: 'utf-8',
        timeout: 30000,
      });

      expect(out).toContain('0 matches');
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });
});
