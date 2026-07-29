import { describe, it, expect, beforeEach } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { SettingsManager, WorkspaceSettings } from '../src/settings';

function makeAlpDir(): string {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'alp-settings-'));
  fs.mkdirSync(path.join(tmp, '.alp'), { recursive: true });
  return tmp;
}

describe('SettingsManager (v41.0.0)', () => {
  it('returns empty settings when file does not exist', () => {
    const tmp = makeAlpDir();
    try {
      const mgr = new SettingsManager(path.join(tmp, '.alp'));
      expect(mgr.getAll()).toEqual({});
      expect(mgr.list()).toEqual({});
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  it('loads existing settings from disk', () => {
    const tmp = makeAlpDir();
    try {
      fs.writeFileSync(
        path.join(tmp, '.alp', 'settings.json'),
        JSON.stringify({ theme: 'dark', language: 'en' }, null, 2)
      );
      const mgr = new SettingsManager(path.join(tmp, '.alp'));
      expect(mgr.get('theme')).toBe('dark');
      expect(mgr.get('language')).toBe('en');
      expect(mgr.get('missing')).toBeUndefined();
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  it('sets and persists a setting', () => {
    const tmp = makeAlpDir();
    try {
      const mgr = new SettingsManager(path.join(tmp, '.alp'));
      mgr.set('theme', 'dark');
      expect(mgr.get('theme')).toBe('dark');

      const raw = JSON.parse(fs.readFileSync(path.join(tmp, '.alp', 'settings.json'), 'utf8'));
      expect(raw.theme).toBe('dark');
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  it('removes a setting', () => {
    const tmp = makeAlpDir();
    try {
      fs.writeFileSync(
        path.join(tmp, '.alp', 'settings.json'),
        JSON.stringify({ theme: 'dark' }, null, 2)
      );
      const mgr = new SettingsManager(path.join(tmp, '.alp'));
      mgr.remove('theme');
      expect(mgr.get('theme')).toBeUndefined();
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  it('validates settings and reports errors', () => {
    const tmp = makeAlpDir();
    try {
      fs.writeFileSync(
        path.join(tmp, '.alp', 'settings.json'),
        JSON.stringify({ theme: 'invalid-theme' }, null, 2)
      );
      const mgr = new SettingsManager(path.join(tmp, '.alp'));
      const errors = mgr.validate();
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some((e) => e.includes('Invalid theme'))).toBe(true);
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  it('returns no validation errors for valid settings', () => {
    const tmp = makeAlpDir();
    try {
      fs.writeFileSync(
        path.join(tmp, '.alp', 'settings.json'),
        JSON.stringify({ theme: 'dark', language: 'en', trusted_paths: ['src/**'] }, null, 2)
      );
      const mgr = new SettingsManager(path.join(tmp, '.alp'));
      expect(mgr.validate()).toHaveLength(0);
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });
});
