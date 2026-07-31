import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

const CLI = path.resolve(process.cwd(), 'cli/dist/index.js');

describe('alp depends', () => {
  it('shows dependencies for an object', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'alp-depends-'));
    try {
      fs.mkdirSync(path.join(tmp, '.alp'), { recursive: true });
      fs.writeFileSync(path.join(tmp, '.alp', 'a.alp'), '@task\n  id: task-1\n  depends_on: task-2\n@task\n  id: task-2\n  depends_on: task-3\n@task\n  id: task-3\n', 'utf-8');

      const output = execFileSync('node', [CLI, 'depends', 'task-2'], {
        cwd: tmp,
        encoding: 'utf-8',
        timeout: 30000,
      });

      expect(output).toContain("Dependencies for 'task-2'");
      expect(output).toContain('Depends on:');
      expect(output).toContain('depends_on: task-3');
      expect(output).toContain('Depended by:');
      expect(output).toContain('task-1');
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  it('reports no dependencies when object has none', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'alp-depends-none-'));
    try {
      fs.mkdirSync(path.join(tmp, '.alp'), { recursive: true });
      fs.writeFileSync(path.join(tmp, '.alp', 'a.alp'), '@task\n  id: task-1\n  description: "Alpha"\n', 'utf-8');

      const output = execFileSync('node', [CLI, 'depends', 'task-1'], {
        cwd: tmp,
        encoding: 'utf-8',
        timeout: 30000,
      });

      expect(output).toContain('Depends on: (none)');
      expect(output).toContain('Depended by: (none)');
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  it('reports error when object is not found', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'alp-depends-missing-'));
    try {
      fs.mkdirSync(path.join(tmp, '.alp'), { recursive: true });
      fs.writeFileSync(path.join(tmp, '.alp', 'a.alp'), '@task\n  id: task-1\n', 'utf-8');

      let failed = false;
      try {
        execFileSync('node', [CLI, 'depends', 'missing-id'], {
          cwd: tmp,
          encoding: 'utf-8',
          timeout: 30000,
        });
      } catch (err: any) {
        failed = true;
        const out = `${err.stdout ?? ''}${err.stderr ?? ''}`;
        expect(out).toContain("Object 'missing-id' not found");
      }
      expect(failed).toBe(true);
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  it('reports error when .alp directory is missing', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'alp-depends-noalp-'));
    try {
      let failed = false;
      try {
        execFileSync('node', [CLI, 'depends', 'task-1'], {
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
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });
});
