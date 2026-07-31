import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

const CLI = path.resolve(process.cwd(), 'cli/dist/index.js');

describe('alp template', () => {
  it('creates a new object from a template', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'alp-template-'));
    try {
      fs.mkdirSync(path.join(tmp, '.alp'), { recursive: true });

      const output = execFileSync('node', [CLI, 'template', 'task', 'my-task'], {
        cwd: tmp,
        encoding: 'utf-8',
        timeout: 30000,
      });

      expect(output).toContain('Created my-task.alp from task template');
      const content = fs.readFileSync(path.join(tmp, '.alp', 'my-task.alp'), 'utf-8');
      expect(content).toContain('@task');
      expect(content).toContain('id: my-task');
      expect(content).toContain('status: todo');
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  it('reports error for unknown template type', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'alp-template-unknown-'));
    try {
      fs.mkdirSync(path.join(tmp, '.alp'), { recursive: true });

      let failed = false;
      try {
        execFileSync('node', [CLI, 'template', 'unknown', 'id1'], {
          cwd: tmp,
          encoding: 'utf-8',
          timeout: 30000,
        });
      } catch (err: any) {
        failed = true;
        const out = `${err.stdout ?? ''}${err.stderr ?? ''}`;
        expect(out).toContain("Unknown template type 'unknown'");
      }
      expect(failed).toBe(true);
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  it('reports error when file already exists', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'alp-template-exists-'));
    try {
      fs.mkdirSync(path.join(tmp, '.alp'), { recursive: true });
      fs.writeFileSync(path.join(tmp, '.alp', 'my-task.alp'), 'existing', 'utf-8');

      let failed = false;
      try {
        execFileSync('node', [CLI, 'template', 'task', 'my-task'], {
          cwd: tmp,
          encoding: 'utf-8',
          timeout: 30000,
        });
      } catch (err: any) {
        failed = true;
        const out = `${err.stdout ?? ''}${err.stderr ?? ''}`;
        expect(out).toContain('already exists');
      }
      expect(failed).toBe(true);
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  it('reports error when .alp directory is missing', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'alp-template-noalp-'));
    try {
      let failed = false;
      try {
        execFileSync('node', [CLI, 'template', 'task', 'my-task'], {
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
