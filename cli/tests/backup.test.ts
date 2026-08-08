import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

const CLI = path.resolve(process.cwd(), 'cli/dist/index.js');

describe('alp backup', () => {
  it('creates a backup and lists it', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'alp-backup-'));
    try {
      fs.mkdirSync(path.join(tmp, '.alp'), { recursive: true });
      fs.writeFileSync(path.join(tmp, '.alp', 'test.alp'), '@task\n  id: t1\n  description: "Test"\n', 'utf-8');

      execFileSync('node', [CLI, 'backup', 'create', 'my-backup'], {
        cwd: tmp,
        encoding: 'utf-8',
        timeout: 30000,
      });

      const listOutput = execFileSync('node', [CLI, 'backup', 'list'], {
        cwd: tmp,
        encoding: 'utf-8',
        timeout: 30000,
      });

      expect(listOutput).toContain('my-backup');
      expect(fs.existsSync(path.join(tmp, '.alp-backups'))).toBe(true);
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  it('restores a backup', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'alp-backup-restore-'));
    try {
      fs.mkdirSync(path.join(tmp, '.alp'), { recursive: true });
      fs.writeFileSync(path.join(tmp, '.alp', 'original.alp'), '@task\n  id: t1\n  description: "Original"\n', 'utf-8');

      execFileSync('node', [CLI, 'backup', 'create', 'restore-test'], {
        cwd: tmp,
        encoding: 'utf-8',
        timeout: 30000,
      });

      fs.writeFileSync(path.join(tmp, '.alp', 'original.alp'), '@task\n  id: t1\n  description: "Modified"\n', 'utf-8');

      const listOutput = execFileSync('node', [CLI, 'backup', 'list'], {
        cwd: tmp,
        encoding: 'utf-8',
        timeout: 30000,
      });

      const match = listOutput.match(/restore-test-\S+/);
      const backupName = match ? match[0] : 'restore-test';

      execFileSync('node', [CLI, 'backup', 'restore', backupName], {
        cwd: tmp,
        encoding: 'utf-8',
        timeout: 30000,
      });

      const restored = fs.readFileSync(path.join(tmp, '.alp', 'original.alp'), 'utf-8');
      expect(restored).toContain('Original');
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  }, 60000);

  it('reports error when .alp directory is missing', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'alp-backup-noalp-'));
    try {
      let failed = false;
      try {
        execFileSync('node', [CLI, 'backup', 'create'], {
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
