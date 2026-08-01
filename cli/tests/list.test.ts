import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

const CLI = path.resolve(process.cwd(), 'cli/dist/index.js');

describe('alp list', () => {
  it('lists all objects in the workspace', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'alp-list-'));
    try {
      fs.mkdirSync(path.join(tmp, '.alp'), { recursive: true });
      fs.writeFileSync(path.join(tmp, '.alp', 'tasks.alp'), '@task\n  id: task-1\n  description: First\n@task\n  id: task-2\n  description: Second\n', 'utf-8');

      const out = execFileSync('node', [CLI, 'list'], {
        cwd: tmp,
        encoding: 'utf-8',
        timeout: 30000,
      });

      expect(out).toContain('task-1');
      expect(out).toContain('task-2');
      expect(out).toContain('tasks.alp');
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  it('filters by type', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'alp-list-'));
    try {
      fs.mkdirSync(path.join(tmp, '.alp'), { recursive: true });
      fs.writeFileSync(path.join(tmp, '.alp', 'mixed.alp'), '@task\n  id: task-1\n  description: First\n@agent\n  id: agent-1\n  model: gpt-4\n', 'utf-8');

      const out = execFileSync('node', [CLI, 'list', '--type', 'task'], {
        cwd: tmp,
        encoding: 'utf-8',
        timeout: 30000,
      });

      expect(out).toContain('task-1');
      expect(out).not.toContain('agent-1');
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  it('reports error when .alp directory is missing', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'alp-list-'));

    let failed = false;
    try {
      execFileSync('node', [CLI, 'list'], {
        cwd: tmp,
        encoding: 'utf-8',
        timeout: 30000,
      });
    } catch (err: any) {
      failed = true;
      const out = `${err.stdout ?? ''}${err.stderr ?? ''}`;
      expect(out).toContain('.alp directory not found');
    }
    expect(failed).toBe(true);
    fs.rmSync(tmp, { recursive: true, force: true });
  });
});
