import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

const CLI = path.resolve(process.cwd(), 'cli/dist/index.js');

describe('alp copy', () => {
  it('copies an object id across .alp files', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'alp-copy-'));
    try {
      fs.mkdirSync(path.join(tmp, '.alp'), { recursive: true });
      fs.writeFileSync(path.join(tmp, '.alp', 'a.alp'), '@task\n  id: source-id\n  description: "Alpha"\n', 'utf-8');
      fs.writeFileSync(path.join(tmp, '.alp', 'b.alp'), '@task\n  id: source-id\n  depends_on: other\n', 'utf-8');

      const output = execFileSync('node', [CLI, 'copy', 'source-id', 'target-id'], {
        cwd: tmp,
        encoding: 'utf-8',
        timeout: 30000,
      });

      expect(output).toContain('Copied 2 occurrences');
      expect(fs.readFileSync(path.join(tmp, '.alp', 'a.alp'), 'utf-8')).toContain('id: target-id');
      expect(fs.readFileSync(path.join(tmp, '.alp', 'b.alp'), 'utf-8')).toContain('id: target-id');
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  it('updates reference fields when --update-refs is passed', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'alp-copy-refs-'));
    try {
      fs.mkdirSync(path.join(tmp, '.alp'), { recursive: true });
      fs.writeFileSync(path.join(tmp, '.alp', 'a.alp'), '@task\n  id: source-id\n  depends_on: source-id\n', 'utf-8');

      const output = execFileSync('node', [CLI, 'copy', 'source-id', 'target-id', '--update-refs'], {
        cwd: tmp,
        encoding: 'utf-8',
        timeout: 30000,
      });

      expect(output).toContain('Copied 1 occurrence');
      const content = fs.readFileSync(path.join(tmp, '.alp', 'a.alp'), 'utf-8');
      expect(content).toContain('id: target-id');
      expect(content).toContain('depends_on: target-id');
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  it('reports when no source object is found', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'alp-copy-missing-'));
    try {
      fs.mkdirSync(path.join(tmp, '.alp'), { recursive: true });
      fs.writeFileSync(path.join(tmp, '.alp', 'a.alp'), '@task\n  id: keep-me\n', 'utf-8');

      const output = execFileSync('node', [CLI, 'copy', 'missing-id', 'target-id'], {
        cwd: tmp,
        encoding: 'utf-8',
        timeout: 30000,
      });

      expect(output).toContain("No object with id 'missing-id' found");
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  it('reports error when .alp directory is missing', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'alp-copy-noalp-'));
    try {
      let failed = false;
      try {
        execFileSync('node', [CLI, 'copy', 'source-id', 'target-id'], {
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
