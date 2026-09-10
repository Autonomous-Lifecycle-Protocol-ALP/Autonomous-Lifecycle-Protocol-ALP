import { describe, it, expect, vi, afterEach } from 'vitest';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { exportCommand } from '../src/commands/export';

const SAMPLE_ALP = `@task
  id: task-1
  description: First task
  status: todo
@task
  id: task-2
  description: Second task
  status: done
`;

const createdDirs: string[] = [];

afterEach(() => {
  for (const dir of createdDirs) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
  createdDirs.length = 0;
});

function makeWorkspace(files: Record<string, string>): string {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'alp-export-'));
  createdDirs.push(tmp);
  fs.mkdirSync(path.join(tmp, '.alp'), { recursive: true });
  for (const [name, content] of Object.entries(files)) {
    fs.writeFileSync(path.join(tmp, '.alp', name), content, 'utf-8');
  }
  return tmp;
}

function runIn(workspace: string, fn: () => void) {
  const originalCwd = process.cwd();
  process.chdir(workspace);
  try {
    fn();
  } finally {
    process.chdir(originalCwd);
  }
}

function captureStdout(fn: () => void): string {
  const logs: string[] = [];
  const spy = vi.spyOn(console, 'log').mockImplementation((...args: any[]) => {
    logs.push(args.map((a) => (typeof a === 'string' ? a : JSON.stringify(a))).join(' '));
  });
  try {
    fn();
  } finally {
    spy.mockRestore();
  }
  return logs.join('\n');
}

describe('alp export', () => {
  it('outputs JSON to stdout by default', () => {
    const workspace = makeWorkspace({ 'tasks.alp': SAMPLE_ALP });
    let output = '';
    runIn(workspace, () => {
      output = captureStdout(() => exportCommand({}));
    });

    expect(output).toContain('task-1');
    expect(output).toContain('task-2');
    const parsed = JSON.parse(output);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed.length).toBe(2);
  });

  it('outputs YAML with --format yaml', () => {
    const workspace = makeWorkspace({ 'tasks.alp': SAMPLE_ALP });
    let output = '';
    runIn(workspace, () => {
      output = captureStdout(() => exportCommand({ format: 'yaml' }));
    });

    expect(output).toContain('task-1');
    expect(output).toContain('description: First task');
    expect(() => JSON.parse(output)).toThrow();
  });

  it('writes to file with --out flag', () => {
    const workspace = makeWorkspace({ 'tasks.alp': SAMPLE_ALP });
    const outFile = 'exported.json';
    runIn(workspace, () => {
      captureStdout(() => exportCommand({ out: outFile }));
    });

    const outPath = path.join(workspace, outFile);
    expect(fs.existsSync(outPath)).toBe(true);
    const content = fs.readFileSync(outPath, 'utf-8');
    const parsed = JSON.parse(content);
    expect(parsed.length).toBe(2);
  });

  it('minifies JSON with --minified flag', () => {
    const workspace = makeWorkspace({ 'tasks.alp': SAMPLE_ALP });
    let output = '';
    runIn(workspace, () => {
      output = captureStdout(() => exportCommand({ minified: true }));
    });

    const parsed = JSON.parse(output);
    expect(parsed.length).toBe(2);
    expect(output).not.toContain('\n  ');
    const singleLine = JSON.stringify(parsed);
    expect(output.replace(/\s+$/, '')).toBe(singleLine);
  });

  it('handles empty workspace', () => {
    const workspace = makeWorkspace({});
    let output = '';
    runIn(workspace, () => {
      output = captureStdout(() => exportCommand({}));
    });

    const parsed = JSON.parse(output);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed.length).toBe(0);
  });
});
