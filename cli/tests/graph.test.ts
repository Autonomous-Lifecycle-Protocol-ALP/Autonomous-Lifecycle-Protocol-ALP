import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { graphCommand } from '../src/commands/graph';

const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {});
const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

let originalCwd: string;

beforeEach(() => {
  originalCwd = process.cwd();
});

afterEach(() => {
  vi.clearAllMocks();
  if (process.cwd() !== originalCwd) {
    try {
      process.chdir(originalCwd);
    } catch {
      // ignore chdir errors during cleanup
    }
  }
});

describe('graphCommand', () => {
  it('generates default output by reading .alp directory', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'alp-graph-'));
    try {
      fs.mkdirSync(path.join(tmp, '.alp'), { recursive: true });
      fs.writeFileSync(
        path.join(tmp, '.alp', 'project.alp'),
        '!alp-version: 1.0.0\n\n@project\n  id: test-project\n  description: "Test"\n',
        'utf-8',
      );

      process.chdir(tmp);
      graphCommand();

      const output = logSpy.mock.calls.map(c => c[0]).join('\n');
      expect(output).toContain('[PKG] ALP Dependency Graph');
      expect(output).toContain('Total objects: 1');
    } finally {
      process.chdir(originalCwd);
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  it('generates JSON output with --json flag', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'alp-graph-json-'));
    try {
      fs.mkdirSync(path.join(tmp, '.alp'), { recursive: true });
      fs.writeFileSync(
        path.join(tmp, '.alp', 'project.alp'),
        '!alp-version: 1.0.0\n\n@project\n  id: test-project\n  description: "Test"\n',
        'utf-8',
      );

      process.chdir(tmp);
      graphCommand(undefined, { json: true });

      const output = logSpy.mock.calls.map(c => c[0]).join('\n');
      const parsed = JSON.parse(output);
      expect(parsed).toHaveProperty('nodes');
      expect(parsed).toHaveProperty('edges');
      expect(parsed.nodes.length).toBe(1);
      expect(parsed.nodes[0].id).toBe('test-project');
    } finally {
      process.chdir(originalCwd);
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  it('generates mermaid output with --mermaid flag', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'alp-graph-mermaid-'));
    try {
      fs.mkdirSync(path.join(tmp, '.alp'), { recursive: true });
      fs.writeFileSync(
        path.join(tmp, '.alp', 'project.alp'),
        '!alp-version: 1.0.0\n\n@project\n  id: test-project\n  description: "Test"\n',
        'utf-8',
      );

      process.chdir(tmp);
      graphCommand(undefined, { mermaid: true });

      const output = logSpy.mock.calls.map(c => c[0]).join('\n');
      expect(output).toContain('```mermaid');
      expect(output).toContain('graph TD');
      expect(output).toContain('test_project');
    } finally {
      process.chdir(originalCwd);
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  it('handles a specific file argument', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'alp-graph-file-'));
    try {
      const filePath = path.join(tmp, 'project.alp');
      fs.writeFileSync(
        filePath,
        '!alp-version: 1.0.0\n\n@project\n  id: test-project\n  description: "Test"\n',
        'utf-8',
      );

      graphCommand(filePath);

      const output = logSpy.mock.calls.map(c => c[0]).join('\n');
      expect(output).toContain('[PKG] ALP Dependency Graph');
      expect(output).toContain('Total objects: 1');
    } finally {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });

  it('handles missing .alp directory', () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'alp-graph-missing-'));
    try {
      process.chdir(tmp);
      graphCommand();

      expect(errorSpy).toHaveBeenCalled();
      expect(errorSpy.mock.calls[0][0]).toBe('Error: .alp directory not found. Run `alp init` first.');
      expect(exitSpy).toHaveBeenCalled();
    } finally {
      process.chdir(originalCwd);
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  });
});
