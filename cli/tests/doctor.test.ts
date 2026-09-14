import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { doctorCommand } from '../src/commands/doctor';

describe('doctorCommand', () => {
  let originalCwd: string;
  let exitSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    originalCwd = process.cwd();
    exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);
  });

  afterEach(() => {
    try {
      process.chdir(originalCwd);
    } catch {
      // ignore
    }
    exitSpy.mockRestore();
  });

  it('reports healthy workspace', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'alp-doctor-healthy-'));
    try {
      const alpDir = path.join(tmp, '.alp');
      fs.mkdirSync(alpDir, { recursive: true });
      fs.writeFileSync(
        path.join(alpDir, 'project.alp'),
        '!alp-version: 3.0.0\n\n@project\n  id: healthy-test\n  status: [~]\n  description: "Healthy workspace"\n',
        'utf-8',
      );
      fs.writeFileSync(
        path.join(tmp, 'package.json'),
        JSON.stringify({
          name: 'test-project',
          dependencies: {
            '@autonomous-lifecycle-protocol-alp/sdk': '*',
          },
        }),
        'utf-8',
      );

      process.chdir(tmp);
      doctorCommand();

      expect(exitSpy).not.toHaveBeenCalled();
    } finally {
      process.chdir(originalCwd);
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  it('detects missing .alp directory', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'alp-doctor-missing-'));
    try {
      process.chdir(tmp);
      doctorCommand();

      expect(exitSpy).toHaveBeenCalledWith(1);
    } finally {
      process.chdir(originalCwd);
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  it('detects parse errors in .alp files', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'alp-doctor-parse-'));
    try {
      const alpDir = path.join(tmp, '.alp');
      fs.mkdirSync(alpDir, { recursive: true });
      fs.writeFileSync(
        path.join(alpDir, 'broken.alp'),
        '!alp-version: 3.0.0\n\n!unknown-directive causes parse failure\n',
        'utf-8',
      );

      process.chdir(tmp);
      doctorCommand();

      expect(exitSpy).toHaveBeenCalledWith(1);
    } finally {
      process.chdir(originalCwd);
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  it('checks for required tools (ecosystem check)', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'alp-doctor-tools-'));
    try {
      const alpDir = path.join(tmp, '.alp');
      fs.mkdirSync(alpDir, { recursive: true });
      fs.writeFileSync(
        path.join(alpDir, 'project.alp'),
        '!alp-version: 3.0.0\n\n@project\n  id: tools-test\n  status: [~]\n  description: "Tools check test"\n',
        'utf-8',
      );
      fs.writeFileSync(
        path.join(tmp, 'package.json'),
        JSON.stringify({
          name: 'test-project',
          dependencies: {},
          devDependencies: {},
        }),
        'utf-8',
      );

      process.chdir(tmp);
      doctorCommand();

      // Missing ALP packages produces a warning but not a fatal error
      expect(exitSpy).not.toHaveBeenCalled();
    } finally {
      process.chdir(originalCwd);
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });
});
