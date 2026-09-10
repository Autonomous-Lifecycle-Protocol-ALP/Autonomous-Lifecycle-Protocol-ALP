import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { initCommand } from '../src/commands/init';

describe('initCommand', () => {
  let originalCwd: string;
  let originalExit: (code?: number) => never;

  beforeEach(() => {
    originalCwd = process.cwd();
    originalExit = process.exit.bind(process);
    process.exit = vi.fn(() => { throw new Error('process.exit'); }) as any;
  });

  afterEach(() => {
    process.chdir(originalCwd);
    process.exit = originalExit;
    vi.restoreAllMocks();
  });

  it('creates a .alp directory', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'alp-init-'));
    try {
      process.chdir(tmp);
      initCommand({});

      expect(fs.existsSync(path.join(tmp, '.alp'))).toBe(true);
      expect(fs.statSync(path.join(tmp, '.alp')).isDirectory()).toBe(true);
    } finally {
      process.chdir(originalCwd);
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  it('creates project.alp with valid content', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'alp-init-'));
    try {
      process.chdir(tmp);
      initCommand({});

      const projectPath = path.join(tmp, '.alp', 'project.alp');
      expect(fs.existsSync(projectPath)).toBe(true);
      const content = fs.readFileSync(projectPath, 'utf-8');
      expect(content).toContain('!alp-version: 3.0.0');
      expect(content).toContain('@project');
      expect(content).toContain('id: my-project');
      expect(content).toContain('name: "My New Project"');
      expect(content).toContain('version: 0.1.0');
      expect(content).toContain('status: [~]');
      expect(content).toContain('description: "Initialized by ALP CLI"');
    } finally {
      process.chdir(originalCwd);
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  it('handles existing .alp directory by exiting with error', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'alp-init-'));
    try {
      fs.mkdirSync(path.join(tmp, '.alp'), { recursive: true });
      process.chdir(tmp);

      let threw = false;
      try {
        initCommand({});
      } catch (e: any) {
        threw = true;
      }

      expect(threw).toBe(true);
      expect(process.exit).toHaveBeenCalledWith(1);
    } finally {
      process.chdir(originalCwd);
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });
});
