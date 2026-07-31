import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

const CLI = path.resolve(process.cwd(), 'cli/dist/index.js');

describe('alp move', () => {
  it('moves an object from one file to another', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'alp-move-'));
    try {
      fs.mkdirSync(path.join(tmp, '.alp'), { recursive: true });
      fs.writeFileSync(path.join(tmp, '.alp', 'a.alp'), '@task\n  id: task-1\n  description: "Alpha"\n@task\n  id: task-2\n', 'utf-8');

      const output = execFileSync('node', [CLI, 'move', 'task-1', 'b.alp'], {
        cwd: tmp,
        encoding: 'utf-8',
        timeout: 30000,
      });

      expect(output).toContain("Moved 'task-1' to b.alp");
      const sourceContent = fs.readFileSync(path.join(tmp, '.alp', 'a.alp'), 'utf-8');
      expect(sourceContent).toContain('task-2');
      expect(sourceContent).not.toContain('task-1');
      const targetContent = fs.readFileSync(path.join(tmp, '.alp', 'b.alp'), 'utf-8');
      expect(targetContent).toContain('task-1');
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  it('creates target file if it does not exist', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'alp-move-create-'));
    try {
      fs.mkdirSync(path.join(tmp, '.alp'), { recursive: true });
      fs.writeFileSync(path.join(tmp, '.alp', 'a.alp'), '@task\n  id: task-1\n', 'utf-8');

      const output = execFileSync('node', [CLI, 'move', 'task-1', 'new-file.alp'], {
        cwd: tmp,
        encoding: 'utf-8',
        timeout: 30000,
      });

      expect(output).toContain("Moved 'task-1' to new-file.alp");
      expect(fs.existsSync(path.join(tmp, '.alp', 'new-file.alp'))).toBe(true);
      expect(fs.readFileSync(path.join(tmp, '.alp', 'new-file.alp'), 'utf-8')).toContain('task-1');
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  it('reports error when object is not found', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'alp-move-missing-'));
    try {
      fs.mkdirSync(path.join(tmp, '.alp'), { recursive: true });
      fs.writeFileSync(path.join(tmp, '.alp', 'a.alp'), '@task\n  id: task-1\n', 'utf-8');

      let failed = false;
      try {
        execFileSync('node', [CLI, 'move', 'missing-id', 'b.alp'], {
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

  it('reports error when target file does not have .alp extension', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'alp-move-ext-'));
    try {
      fs.mkdirSync(path.join(tmp, '.alp'), { recursive: true });
      fs.writeFileSync(path.join(tmp, '.alp', 'a.alp'), '@task\n  id: task-1\n', 'utf-8');

      let failed = false;
      try {
        execFileSync('node', [CLI, 'move', 'task-1', 'bad.txt'], {
          cwd: tmp,
          encoding: 'utf-8',
          timeout: 30000,
        });
      } catch (err: any) {
        failed = true;
        const out = `${err.stdout ?? ''}${err.stderr ?? ''}`;
        expect(out).toContain('.alp extension');
      }
      expect(failed).toBe(true);
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  it('reports error when .alp directory is missing', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'alp-move-noalp-'));
    try {
      let failed = false;
      try {
        execFileSync('node', [CLI, 'move', 'task-1', 'b.alp'], {
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
