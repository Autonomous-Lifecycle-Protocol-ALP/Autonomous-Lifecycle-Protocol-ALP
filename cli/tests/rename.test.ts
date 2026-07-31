import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

const CLI = path.resolve(process.cwd(), 'cli/dist/index.js');

describe('alp rename', () => {
  it('renames an object id across .alp files', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'alp-rename-'));
    try {
      fs.mkdirSync(path.join(tmp, '.alp'), { recursive: true });
      fs.writeFileSync(path.join(tmp, '.alp', 'a.alp'), '@task\n  id: old-id\n  description: "Alpha"\n', 'utf-8');
      fs.writeFileSync(path.join(tmp, '.alp', 'b.alp'), '@task\n  id: old-id\n  depends_on: other-id\n', 'utf-8');

      const output = execFileSync('node', [CLI, 'rename', 'old-id', 'new-id'], {
        cwd: tmp,
        encoding: 'utf-8',
        timeout: 30000,
      });

      expect(output).toContain('Renamed 2 occurrences');
      expect(fs.readFileSync(path.join(tmp, '.alp', 'a.alp'), 'utf-8')).toContain('id: new-id');
      expect(fs.readFileSync(path.join(tmp, '.alp', 'b.alp'), 'utf-8')).toContain('id: new-id');
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  it('reports when no occurrences are found', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'alp-rename-missing-'));
    try {
      fs.mkdirSync(path.join(tmp, '.alp'), { recursive: true });
      fs.writeFileSync(path.join(tmp, '.alp', 'a.alp'), '@task\n  id: keep-me\n', 'utf-8');

      const output = execFileSync('node', [CLI, 'rename', 'missing-id', 'new-id'], {
        cwd: tmp,
        encoding: 'utf-8',
        timeout: 30000,
      });

      expect(output).toContain("No occurrences of id 'missing-id' found");
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  it('reports error when .alp directory is missing', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'alp-rename-noalp-'));
    try {
      let failed = false;
      try {
        execFileSync('node', [CLI, 'rename', 'old-id', 'new-id'], {
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
