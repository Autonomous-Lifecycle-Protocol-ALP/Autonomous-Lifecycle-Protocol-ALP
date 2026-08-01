import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

const CLI = path.resolve(process.cwd(), 'cli/dist/index.js');

describe('alp deduplicate', () => {
  it('removes duplicate objects across files', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'alp-dedup-'));
    try {
      fs.mkdirSync(path.join(tmp, '.alp'), { recursive: true });
      fs.writeFileSync(path.join(tmp, '.alp', 'a.alp'), '@task\n  id: task-1\n  description: First\n@task\n  id: task-2\n  description: Second\n', 'utf-8');
      fs.writeFileSync(path.join(tmp, '.alp', 'b.alp'), '@task\n  id: task-1\n  description: Duplicate\n', 'utf-8');

      const out = execFileSync('node', [CLI, 'deduplicate'], {
        cwd: tmp,
        encoding: 'utf-8',
        timeout: 30000,
      });

      expect(out).toContain('Deduplicated 1');
      const contentB = fs.readFileSync(path.join(tmp, '.alp', 'b.alp'), 'utf-8');
      expect(contentB).not.toContain('task-1');
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  it('reports no duplicates when none exist', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'alp-dedup-'));
    try {
      fs.mkdirSync(path.join(tmp, '.alp'), { recursive: true });
      fs.writeFileSync(path.join(tmp, '.alp', 'a.alp'), '@task\n  id: task-1\n  description: First\n', 'utf-8');

      const out = execFileSync('node', [CLI, 'deduplicate'], {
        cwd: tmp,
        encoding: 'utf-8',
        timeout: 30000,
      });

      expect(out).toContain('No duplicate objects found');
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  it('reports error when .alp directory is missing', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'alp-dedup-'));

    let failed = false;
    try {
      execFileSync('node', [CLI, 'deduplicate'], {
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
