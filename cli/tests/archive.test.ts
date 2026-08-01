import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

const CLI = path.resolve(process.cwd(), 'cli/dist/index.js');

describe('alp archive', () => {
  it('archives objects with matching status', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'alp-archive-'));
    try {
      fs.mkdirSync(path.join(tmp, '.alp'), { recursive: true });
      fs.writeFileSync(path.join(tmp, '.alp', 'tasks.alp'), '@task\n  id: task-1\n  description: First\n  status: done\n@task\n  id: task-2\n  description: Second\n  status: todo\n', 'utf-8');

      const out = execFileSync('node', [CLI, 'archive', 'done'], {
        cwd: tmp,
        encoding: 'utf-8',
        timeout: 30000,
      });

      expect(out).toContain('Archived 1');
      expect(out).toContain('task-1');
      const content = fs.readFileSync(path.join(tmp, '.alp', 'tasks.alp'), 'utf-8');
      expect(content).not.toContain('task-1');
      expect(content).toContain('task-2');
      const archiveContent = fs.readFileSync(path.join(tmp, '.alp', 'archive.alp'), 'utf-8');
      expect(archiveContent).toContain('task-1');
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  it('reports no matching objects', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'alp-archive-'));
    try {
      fs.mkdirSync(path.join(tmp, '.alp'), { recursive: true });
      fs.writeFileSync(path.join(tmp, '.alp', 'tasks.alp'), '@task\n  id: task-1\n  description: First\n  status: todo\n', 'utf-8');

      const out = execFileSync('node', [CLI, 'archive', 'done'], {
        cwd: tmp,
        encoding: 'utf-8',
        timeout: 30000,
      });

      expect(out).toContain("No objects with status 'done' found");
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  it('reports error when .alp directory is missing', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'alp-archive-'));

    let failed = false;
    try {
      execFileSync('node', [CLI, 'archive', 'done'], {
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
