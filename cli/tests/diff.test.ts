import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

const CLI = path.resolve(process.cwd(), 'cli/dist/index.js');

describe('alp diff', () => {
  it('diffs two snapshots showing added, removed, and modified objects', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'alp-diff-'));
    try {
      const snapshotsDir = path.join(tmp, '.alp', '.snapshots');
      fs.mkdirSync(snapshotsDir, { recursive: true });

      const snapshotA = {
        metadata: { name: 'snap-a', object_count: 2, project_count: 1, created_at: '2026-01-01T00:00:00Z' },
        objects: [
          { id: 'obj-1', name: 'Alpha' },
          { id: 'obj-2', name: 'Beta' },
        ],
        projects: [],
      };
      const snapshotB = {
        metadata: { name: 'snap-b', object_count: 2, project_count: 1, created_at: '2026-01-02T00:00:00Z' },
        objects: [
          { id: 'obj-2', name: 'Beta-updated' },
          { id: 'obj-3', name: 'Gamma' },
        ],
        projects: [],
      };

      fs.writeFileSync(path.join(snapshotsDir, 'snap-a.json'), JSON.stringify(snapshotA, null, 2), 'utf-8');
      fs.writeFileSync(path.join(snapshotsDir, 'snap-b.json'), JSON.stringify(snapshotB, null, 2), 'utf-8');

      const output = execFileSync('node', [CLI, 'diff', 'snap-a', 'snap-b'], {
        cwd: tmp,
        encoding: 'utf-8',
        timeout: 30000,
      });

      expect(output).toContain('Added:   1');
      expect(output).toContain('Removed: 1');
      expect(output).toContain('Modified: 1');
      expect(output).toContain('obj-1');
      expect(output).toContain('obj-3');
      expect(output).toContain('obj-2');
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  it('reports no differences for identical snapshots', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'alp-diff-same-'));
    try {
      const snapshotsDir = path.join(tmp, '.alp', '.snapshots');
      fs.mkdirSync(snapshotsDir, { recursive: true });

      const payload = {
        metadata: { name: 'snap-a', object_count: 1, project_count: 0, created_at: '2026-01-01T00:00:00Z' },
        objects: [{ id: 'obj-1', name: 'Alpha' }],
        projects: [],
      };

      fs.writeFileSync(path.join(snapshotsDir, 'snap-a.json'), JSON.stringify(payload, null, 2), 'utf-8');
      fs.writeFileSync(path.join(snapshotsDir, 'snap-b.json'), JSON.stringify(payload, null, 2), 'utf-8');

      const output = execFileSync('node', [CLI, 'diff', 'snap-a', 'snap-b'], {
        cwd: tmp,
        encoding: 'utf-8',
        timeout: 30000,
      });

      expect(output).toContain('Added:   0');
      expect(output).toContain('Removed: 0');
      expect(output).toContain('Modified: 0');
      expect(output).toContain('No differences found');
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  it('reports error when snapshots directory is missing', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'alp-diff-nodir-'));
    try {
      fs.mkdirSync(path.join(tmp, '.alp'), { recursive: true });

      let failed = false;
      try {
        execFileSync('node', [CLI, 'diff', 'a', 'b'], {
          cwd: tmp,
          encoding: 'utf-8',
          timeout: 30000,
        });
      } catch (err: any) {
        failed = true;
        const out = `${err.stdout ?? ''}${err.stderr ?? ''}`;
        expect(out).toContain('No snapshots directory found');
      }
      expect(failed).toBe(true);
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });
});
