import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

const CLI = path.resolve(process.cwd(), 'cli/dist/index.js');

describe('alp split', () => {
  it('splits a mixed file into type files', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'alp-split-'));
    try {
      fs.mkdirSync(path.join(tmp, '.alp'), { recursive: true });
      fs.writeFileSync(path.join(tmp, '.alp', 'mixed.alp'), '@task\n  id: task-1\n  description: First\n@agent\n  id: agent-1\n  model: gpt-4\n@task\n  id: task-2\n  description: Second\n', 'utf-8');

      const out = execFileSync('node', [CLI, 'split', 'mixed.alp'], {
        cwd: tmp,
        encoding: 'utf-8',
        timeout: 30000,
      });

      expect(out).toContain('tasks.alp');
      expect(out).toContain('agents.alp');
      expect(fs.existsSync(path.join(tmp, '.alp', 'tasks.alp'))).toBe(true);
      expect(fs.existsSync(path.join(tmp, '.alp', 'agents.alp'))).toBe(true);
      const tasksContent = fs.readFileSync(path.join(tmp, '.alp', 'tasks.alp'), 'utf-8');
      expect(tasksContent).toContain('task-1');
      expect(tasksContent).toContain('task-2');
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  it('splits with type filter', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'alp-split-'));
    try {
      fs.mkdirSync(path.join(tmp, '.alp'), { recursive: true });
      fs.writeFileSync(path.join(tmp, '.alp', 'mixed.alp'), '@task\n  id: task-1\n  description: First\n@agent\n  id: agent-1\n  model: gpt-4\n', 'utf-8');

      const out = execFileSync('node', [CLI, 'split', 'mixed.alp', '--type', 'task'], {
        cwd: tmp,
        encoding: 'utf-8',
        timeout: 30000,
      });

      expect(out).toContain('tasks.alp');
      expect(fs.existsSync(path.join(tmp, '.alp', 'tasks.alp'))).toBe(true);
      expect(fs.existsSync(path.join(tmp, '.alp', 'agents.alp'))).toBe(false);
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  it('reports error for missing file', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'alp-split-'));
    try {
      fs.mkdirSync(path.join(tmp, '.alp'), { recursive: true });

      let failed = false;
      try {
        execFileSync('node', [CLI, 'split', 'missing.alp'], {
          cwd: tmp,
          encoding: 'utf-8',
          timeout: 30000,
        });
      } catch (err: any) {
        failed = true;
        const out = `${err.stdout ?? ''}${err.stderr ?? ''}`;
        expect(out).toContain("Source file");
      }
      expect(failed).toBe(true);
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });
});
