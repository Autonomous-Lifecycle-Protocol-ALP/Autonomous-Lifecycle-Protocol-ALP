import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

const CLI = path.resolve(process.cwd(), 'cli/dist/index.js');

describe('alp inspect', () => {
  it('inspects an object by id', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'alp-inspect-'));
    try {
      fs.mkdirSync(path.join(tmp, '.alp'), { recursive: true });
      fs.writeFileSync(path.join(tmp, '.alp', 'a.alp'), '@task\n  id: task-1\n  description: Alpha\n  status: [ ]\n', 'utf-8');

      const out = execFileSync('node', [CLI, 'inspect', 'task-1'], {
        cwd: tmp,
        encoding: 'utf-8',
        timeout: 30000,
      });

      expect(out).toContain('task-1');
      expect(out).toContain('task');
      expect(out).toContain('Alpha');
      expect(out).toContain('[ ]');
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  it('inspects an object from a specific file', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'alp-inspect-'));
    try {
      fs.mkdirSync(path.join(tmp, '.alp'), { recursive: true });
      fs.writeFileSync(path.join(tmp, '.alp', 'a.alp'), '@agent\n  id: agent-1\n  model: gpt-4\n', 'utf-8');

      const out = execFileSync('node', [CLI, 'inspect', 'agent-1', '--file', path.join(tmp, '.alp', 'a.alp')], {
        cwd: tmp,
        encoding: 'utf-8',
        timeout: 30000,
      });

      expect(out).toContain('agent-1');
      expect(out).toContain('agent');
      expect(out).toContain('gpt-4');
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  it('reports error for missing object', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'alp-inspect-'));
    try {
      fs.mkdirSync(path.join(tmp, '.alp'), { recursive: true });
      fs.writeFileSync(path.join(tmp, '.alp', 'a.alp'), '@task\n  id: task-1\n', 'utf-8');

      let failed = false;
      try {
        execFileSync('node', [CLI, 'inspect', 'missing'], {
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
