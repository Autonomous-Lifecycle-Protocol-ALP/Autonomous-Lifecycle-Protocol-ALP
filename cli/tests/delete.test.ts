import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

const CLI = path.resolve(process.cwd(), 'cli/dist/index.js');

describe('alp delete', () => {
  it('deletes an object from a file', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'alp-delete-'));
    try {
      fs.mkdirSync(path.join(tmp, '.alp'), { recursive: true });
      fs.writeFileSync(path.join(tmp, '.alp', 'a.alp'), '@task\n  id: task-1\n  description: Alpha\n@task\n  id: task-2\n  description: Beta\n', 'utf-8');

      execFileSync('node', [CLI, 'delete', 'task-1'], {
        cwd: tmp,
        encoding: 'utf-8',
        timeout: 30000,
      });

      const content = fs.readFileSync(path.join(tmp, '.alp', 'a.alp'), 'utf-8');
      expect(content).not.toContain('task-1');
      expect(content).toContain('task-2');
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  it('deletes an object from a specific file', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'alp-delete-'));
    try {
      fs.mkdirSync(path.join(tmp, '.alp'), { recursive: true });
      fs.writeFileSync(path.join(tmp, '.alp', 'a.alp'), '@task\n  id: task-1\n  description: Alpha\n', 'utf-8');
      fs.writeFileSync(path.join(tmp, '.alp', 'b.alp'), '@task\n  id: task-2\n  description: Beta\n', 'utf-8');

      execFileSync('node', [CLI, 'delete', 'task-1', '--file', path.join(tmp, '.alp', 'a.alp')], {
        cwd: tmp,
        encoding: 'utf-8',
        timeout: 30000,
      });

      const contentA = fs.readFileSync(path.join(tmp, '.alp', 'a.alp'), 'utf-8');
      const contentB = fs.readFileSync(path.join(tmp, '.alp', 'b.alp'), 'utf-8');
      expect(contentA).not.toContain('task-1');
      expect(contentB).toContain('task-2');
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  it('reports error for missing object', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'alp-delete-'));
    try {
      fs.mkdirSync(path.join(tmp, '.alp'), { recursive: true });
      fs.writeFileSync(path.join(tmp, '.alp', 'a.alp'), '@task\n  id: task-1\n', 'utf-8');

      let failed = false;
      try {
        execFileSync('node', [CLI, 'delete', 'missing'], {
          cwd: tmp,
          encoding: 'utf-8',
          timeout: 30000,
        });
      } catch (err: any) {
        failed = true;
        const out = `${err.stdout ?? ''}${err.stderr ?? ''}`;
        expect(out).toContain("Object 'missing' not found");
      }
      expect(failed).toBe(true);
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });
});
