import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

const CLI = path.resolve(process.cwd(), 'cli/dist/index.js');

describe('alp stats', () => {
  it('reports object counts by type and file', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'alp-stats-'));
    try {
      fs.mkdirSync(path.join(tmp, '.alp'), { recursive: true });
      fs.writeFileSync(path.join(tmp, '.alp', 'a.alp'), '@task\n  id: t1\n  description: "A"\n@task\n  id: t2\n', 'utf-8');
      fs.writeFileSync(path.join(tmp, '.alp', 'b.alp'), '@agent\n  id: a1\n  model: gpt\n', 'utf-8');

      const output = execFileSync('node', [CLI, 'stats'], {
        cwd: tmp,
        encoding: 'utf-8',
        timeout: 30000,
      });

      expect(output).toContain('Files:       2');
      expect(output).toContain('Objects:     3');
      expect(output).toContain('task: 2');
      expect(output).toContain('agent: 1');
      expect(output).toContain('a.alp: 2');
      expect(output).toContain('b.alp: 1');
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  it('reports error when .alp directory is missing', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'alp-stats-noalp-'));
    try {
      let failed = false;
      try {
        execFileSync('node', [CLI, 'stats'], {
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
