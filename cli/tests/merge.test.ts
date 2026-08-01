import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

const CLI = path.resolve(process.cwd(), 'cli/dist/index.js');

describe('alp merge', () => {
  it('merges new objects from source to target', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'alp-merge-'));
    try {
      fs.mkdirSync(path.join(tmp, '.alp'), { recursive: true });
      fs.writeFileSync(path.join(tmp, '.alp', 'source.alp'), '@task\n  id: task-1\n  description: Source\n@task\n  id: task-2\n  description: Source 2\n', 'utf-8');
      fs.writeFileSync(path.join(tmp, '.alp', 'target.alp'), '@task\n  id: task-3\n  description: Target\n', 'utf-8');

      const out = execFileSync('node', [CLI, 'merge', 'source.alp', 'target.alp'], {
        cwd: tmp,
        encoding: 'utf-8',
        timeout: 30000,
      });

      expect(out).toContain('Merged 2');
      const content = fs.readFileSync(path.join(tmp, '.alp', 'target.alp'), 'utf-8');
      expect(content).toContain('task-1');
      expect(content).toContain('task-2');
      expect(content).toContain('task-3');
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  it('skips objects that already exist in target', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'alp-merge-'));
    try {
      fs.mkdirSync(path.join(tmp, '.alp'), { recursive: true });
      fs.writeFileSync(path.join(tmp, '.alp', 'source.alp'), '@task\n  id: task-1\n  description: Source\n', 'utf-8');
      fs.writeFileSync(path.join(tmp, '.alp', 'target.alp'), '@task\n  id: task-1\n  description: Target\n', 'utf-8');

      const out = execFileSync('node', [CLI, 'merge', 'source.alp', 'target.alp'], {
        cwd: tmp,
        encoding: 'utf-8',
        timeout: 30000,
      });

      expect(out).toContain('No new objects');
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  it('reports error for missing source file', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'alp-merge-'));
    try {
      fs.mkdirSync(path.join(tmp, '.alp'), { recursive: true });
      fs.writeFileSync(path.join(tmp, '.alp', 'target.alp'), '@task\n  id: task-1\n', 'utf-8');

      let failed = false;
      try {
        execFileSync('node', [CLI, 'merge', 'missing.alp', 'target.alp'], {
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

  it('reports error for missing target file', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'alp-merge-'));
    try {
      fs.mkdirSync(path.join(tmp, '.alp'), { recursive: true });
      fs.writeFileSync(path.join(tmp, '.alp', 'source.alp'), '@task\n  id: task-1\n', 'utf-8');

      let failed = false;
      try {
        execFileSync('node', [CLI, 'merge', 'source.alp', 'missing.alp'], {
          cwd: tmp,
          encoding: 'utf-8',
          timeout: 30000,
        });
      } catch (err: any) {
        failed = true;
        const out = `${err.stdout ?? ''}${err.stderr ?? ''}`;
        expect(out).toContain("Target file");
      }
      expect(failed).toBe(true);
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });
});
