import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

const CLI = path.resolve(process.cwd(), 'cli/dist/index.js');

describe('alp promote', () => {
  it('promotes an object to a new type', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'alp-promote-'));
    try {
      fs.mkdirSync(path.join(tmp, '.alp'), { recursive: true });
      fs.writeFileSync(path.join(tmp, '.alp', 'tasks.alp'), '@task\n  id: task-1\n  description: First task\n', 'utf-8');

      const out = execFileSync('node', [CLI, 'promote', 'task-1', 'feature'], {
        cwd: tmp,
        encoding: 'utf-8',
        timeout: 30000,
      });

      expect(out).toContain('Promoted');
      expect(out).toContain('task-1');
      expect(out).toContain('@task');
      expect(out).toContain('@feature');
      const content = fs.readFileSync(path.join(tmp, '.alp', 'tasks.alp'), 'utf-8');
      expect(content).toContain('@feature');
      expect(content).not.toContain('@task');
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  it('reports error for missing object', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'alp-promote-'));
    try {
      fs.mkdirSync(path.join(tmp, '.alp'), { recursive: true });
      fs.writeFileSync(path.join(tmp, '.alp', 'tasks.alp'), '@task\n  id: task-1\n  description: First task\n', 'utf-8');

      let failed = false;
      try {
        execFileSync('node', [CLI, 'promote', 'missing', 'feature'], {
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

  it('reports error when .alp directory is missing', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'alp-promote-'));

    let failed = false;
    try {
      execFileSync('node', [CLI, 'promote', 'task-1', 'feature'], {
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
