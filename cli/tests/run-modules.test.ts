import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

import type { RunOptions } from '../src/commands/run/run-command';
import {
  loadAlpDirectory,
  extractDependencies,
  updateTaskStatusOnFile,
  resolveSwarmConfig,
  releaseOnExit,
} from '../src/commands/run/workspace-loader';
import { buildContextBundle } from '../src/commands/run/context-builder';

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------
function makeObj(type: string, props: Record<string, any> = {}): any {
  return { _type: type, ...props };
}

function makeTmp(prefix: string): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

function writeAlpFile(dir: string, name: string, content: string): string {
  const fullPath = path.join(dir, name);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content, 'utf-8');
  return fullPath;
}

// ---------------------------------------------------------------------------
// workspace-loader.extractDependencies
// ---------------------------------------------------------------------------
describe('workspace-loader.extractDependencies', () => {
  it('extracts a single string dependency with -> prefix', () => {
    const obj = makeObj('task', { depends_on: '-> task-a' });
    expect(extractDependencies(obj)).toEqual(['task-a']);
  });

  it('extracts an array of dependencies with -> prefix', () => {
    const obj = makeObj('task', { depends_on: ['-> task-a', '-> task-b', '-> task-c'] });
    expect(extractDependencies(obj)).toEqual(['task-a', 'task-b', 'task-c']);
  });

  it('returns empty array when no dependency keys exist', () => {
    const obj = makeObj('task', { id: 't1', status: '[ ]', description: 'a task' });
    expect(extractDependencies(obj)).toEqual([]);
  });

  it('returns empty array for an empty object', () => {
    expect(extractDependencies({ _type: 'task' })).toEqual([]);
  });

  it('extracts from all three blocking keys: depends_on, blocked_by, requires', () => {
    const obj = makeObj('task', {
      depends_on: '-> dep-1',
      blocked_by: '-> dep-2',
      requires: ['-> dep-3', '-> dep-4'],
    });
    expect(extractDependencies(obj)).toEqual(['dep-1', 'dep-2', 'dep-3', 'dep-4']);
  });

  it('ignores string dependencies that lack the -> prefix', () => {
    const obj = makeObj('task', { depends_on: 'task-a' });
    expect(extractDependencies(obj)).toEqual([]);
  });

  it('ignores array items that lack the -> prefix', () => {
    const obj = makeObj('task', { requires: ['-> keep', 'drop', '-> keep-me'] });
    expect(extractDependencies(obj)).toEqual(['keep', 'keep-me']);
  });

  it('ignores unrelated keys such as id, status, owner', () => {
    const obj = makeObj('task', {
      id: 't1',
      status: '[ ]',
      owner: '-> agent-1',
      name: 'foo',
      depends_on: '-> real-dep',
    });
    expect(extractDependencies(obj)).toEqual(['real-dep']);
  });

  it('handles mixed string and array values across keys (flattened order)', () => {
    const obj = makeObj('task', {
      depends_on: '-> d1',
      blocked_by: ['-> d2', 'drop-me'],
      requires: '-> d3',
    });
    expect(extractDependencies(obj)).toEqual(['d1', 'd2', 'd3']);
  });

  it('strips only the first -> prefix occurrence from the value', () => {
    const obj = makeObj('task', { depends_on: '-> task->with->arrows' });
    expect(extractDependencies(obj)).toEqual(['task->with->arrows']);
  });
});

// ---------------------------------------------------------------------------
// context-builder.buildContextBundle
// ---------------------------------------------------------------------------
describe('context-builder.buildContextBundle', () => {
  const fullTask: any = makeObj('task', {
    _type: 'task',
    id: 't1',
    description: 'Build authentication module',
    priority: 'high',
    status: '[ ]',
    accept: ['Users can log in', 'Invalid credentials are rejected'],
    verify: ['npm run test', 'npm run lint'],
  });
  const fullProject: any = makeObj('project', {
    id: 'my-proj',
    description: 'A sample project',
    stack: 'Node.js + TypeScript',
  });
  const fullAgent: any = makeObj('agent', {
    id: 'dev-agent',
    description: 'A coding agent',
    capabilities: ['coding', 'testing'],
  });
  const fullMemories: any[] = [
    makeObj('memory', { id: 'mem-1', type: 'decision', description: 'Use Postgres' }),
  ];
  const fullRules: any[] = [
    makeObj('rule', { id: 'rule-1', description: 'Never trust input', enforce: 'always' }),
  ];
  const fullDecisions: any[] = [
    makeObj('decision', { id: 'dec-1', description: 'Chose React', outcome: 'selected' }),
  ];

  it('always includes the top-level context header', () => {
    const out = buildContextBundle(fullTask, null, null, [], [], [], []);
    expect(out).toContain('# ALP Task Execution Context');
    expect(out).toContain('Generated by `alp run`');
  });

  it('includes the Target Task section with task details', () => {
    const out = buildContextBundle(fullTask, null, null, [], [], [], []);
    expect(out).toContain('## Target Task');
    expect(out).toContain('- ID: t1');
    expect(out).toContain('- Description: Build authentication module');
    expect(out).toContain('- Priority: high');
    expect(out).toContain('- Status: [ ]');
  });

  it('includes the Project section when project is provided', () => {
    const out = buildContextBundle(fullTask, fullProject, null, [], [], [], []);
    expect(out).toContain('## Project');
    expect(out).toContain('- Name: my-proj');
    expect(out).toContain('- Description: A sample project');
    expect(out).toContain('- Stack: Node.js + TypeScript');
  });

  it('omits the Project section when project is null', () => {
    const out = buildContextBundle(fullTask, null, null, [], [], [], []);
    expect(out).not.toContain('## Project');
  });

  it('includes Acceptance Criteria when task.accept is an array', () => {
    const out = buildContextBundle(fullTask, null, null, [], [], [], []);
    expect(out).toContain('## Acceptance Criteria');
    expect(out).toContain('- Users can log in');
    expect(out).toContain('- Invalid credentials are rejected');
  });

  it('includes Verification Commands when task.verify is an array', () => {
    const out = buildContextBundle(fullTask, null, null, [], [], [], []);
    expect(out).toContain('## Verification Commands');
    expect(out).toContain('- `npm run test`');
    expect(out).toContain('- `npm run lint`');
  });

  it('omits Acceptance Criteria and Verification Commands when absent', () => {
    const task = makeObj('task', { id: 't2', status: '[ ]' });
    const out = buildContextBundle(task, null, null, [], [], [], []);
    expect(out).not.toContain('## Acceptance Criteria');
    expect(out).not.toContain('## Verification Commands');
  });

  it('includes the Assigned Agent section with capabilities', () => {
    const out = buildContextBundle(fullTask, null, fullAgent, [], [], [], []);
    expect(out).toContain('## Assigned Agent');
    expect(out).toContain('- Role: dev-agent');
    expect(out).toContain('- Description: A coding agent');
    expect(out).toContain('- Capabilities: coding, testing');
  });

  it('omits Assigned Agent when agent is null', () => {
    const out = buildContextBundle(fullTask, null, null, [], [], [], []);
    expect(out).not.toContain('## Assigned Agent');
  });

  it('includes Architectural Rules with fallback to enforce when description missing', () => {
    const rules = [
      makeObj('rule', { id: 'rule-1', description: 'Never trust input', enforce: 'always' }),
      makeObj('rule', { id: 'rule-2', enforce: 'on-change' }),
      makeObj('rule', { id: 'rule-3' }),
    ];
    const out = buildContextBundle(fullTask, null, null, [], rules, [], []);
    expect(out).toContain('## Architectural Rules (MUST follow)');
    expect(out).toContain('- **rule-1**: Never trust input');
    expect(out).toContain('- **rule-2**: on-change');
    expect(out).toContain('- **rule-3**: N/A');
  });

  it('omits Architectural Rules when rules array is empty', () => {
    const out = buildContextBundle(fullTask, null, null, [], [], [], []);
    expect(out).not.toContain('## Architectural Rules');
  });

  it('includes Finalized Decisions with fallback to outcome when description missing', () => {
    const decisions = [
      makeObj('decision', { id: 'dec-1', description: 'Chose React', outcome: 'selected' }),
      makeObj('decision', { id: 'dec-2', outcome: 'done' }),
      makeObj('decision', { id: 'dec-3' }),
    ];
    const out = buildContextBundle(fullTask, null, null, [], [], decisions, []);
    expect(out).toContain('## Finalized Decisions');
    expect(out).toContain('- **dec-1**: Chose React');
    expect(out).toContain('- **dec-2**: done');
    expect(out).toContain('- **dec-3**: N/A');
  });

  it('omits Finalized Decisions when decisions array is empty', () => {
    const out = buildContextBundle(fullTask, null, null, [], [], [], []);
    expect(out).not.toContain('## Finalized Decisions');
  });

  it('includes Relevant Memories with type fallback', () => {
    const out = buildContextBundle(fullTask, null, null, fullMemories, [], [], []);
    expect(out).toContain('## Relevant Memories');
    expect(out).toContain('- **mem-1** (decision): Use Postgres');
  });

  it('falls back to content for memory description', () => {
    const memories = [makeObj('memory', { id: 'mem-2', type: 'context', content: 'some context' })];
    const out = buildContextBundle(fullTask, null, null, memories, [], [], []);
    expect(out).toContain('- **mem-2** (context): some context');
  });

  it('uses "general" type when memory has no type', () => {
    const memories = [makeObj('memory', { id: 'mem-3', description: 'no type info' })];
    const out = buildContextBundle(fullTask, null, null, memories, [], [], []);
    expect(out).toContain('- **mem-3** (general): no type info');
  });

  it('renders a complete bundle with all sections present', () => {
    const out = buildContextBundle(
      fullTask, fullProject, fullAgent, fullMemories, fullRules, fullDecisions, []
    );
    for (const header of [
      '# ALP Task Execution Context',
      '## Project',
      '## Target Task',
      '## Acceptance Criteria',
      '## Verification Commands',
      '## Assigned Agent',
      '## Architectural Rules (MUST follow)',
      '## Finalized Decisions',
      '## Relevant Memories',
    ]) {
      expect(out).toContain(header);
    }
  });
});

// ---------------------------------------------------------------------------
// workspace-loader.updateTaskStatusOnFile
// ---------------------------------------------------------------------------
describe('workspace-loader.updateTaskStatusOnFile', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTmp('alp-updatestatus-');
  });

  afterEach(() => {
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}
  });

  it('updates the status of a matching task and returns true', () => {
    writeAlpFile(tmpDir, 'task.alp', [
      '@task',
      '  id: task-1',
      '  status: [ ]',
      '  description: First task',
    ].join('\n'));

    const updated = updateTaskStatusOnFile('task-1', '[x]', tmpDir);
    expect(updated).toBe(true);

    const content = fs.readFileSync(path.join(tmpDir, 'task.alp'), 'utf-8');
    expect(content).toContain('status: [x]');
    expect(content).not.toMatch(/status:\s*\[ \]/);
  });

  it('returns false when the task id is not found', () => {
    writeAlpFile(tmpDir, 'task.alp', [
      '@task',
      '  id: task-1',
      '  status: [ ]',
    ].join('\n'));

    const updated = updateTaskStatusOnFile('nonexistent', '[x]', tmpDir);
    expect(updated).toBe(false);

    const content = fs.readFileSync(path.join(tmpDir, 'task.alp'), 'utf-8');
    expect(content).toContain('status: [ ]');
  });

  it('leaves other tasks untouched when updating one in a multi-object file', () => {
    writeAlpFile(tmpDir, 'tasks.alp', [
      '@task',
      '  id: task-a',
      '  status: [ ]',
      '',
      '@task',
      '  id: task-b',
      '  status: [ ]',
    ].join('\n'));

    const updated = updateTaskStatusOnFile('task-a', '[x]', tmpDir);
    expect(updated).toBe(true);

    const content = fs.readFileSync(path.join(tmpDir, 'tasks.alp'), 'utf-8');
    expect(content.match(/task-a[\s\S]*?status:\s*\[x\]/)).toBeTruthy();
    expect(content).not.toMatch(/task-b[\s\S]*?status:\s*\[x\]/);
    expect(content.match(/task-b[\s\S]*?status:\s*\[ \]/)).toBeTruthy();
  });

  it('finds and updates tasks nested in subdirectories', () => {
    writeAlpFile(tmpDir, 'nested/deep/task.alp', [
      '@task',
      '  id: nested-task',
      '  status: [ ]',
    ].join('\n'));

    const updated = updateTaskStatusOnFile('nested-task', 'done', tmpDir);
    expect(updated).toBe(true);

    const content = fs.readFileSync(path.join(tmpDir, 'nested', 'deep', 'task.alp'), 'utf-8');
    expect(content).toContain('status: done');
  });

  it('ignores non-.alp files', () => {
    fs.writeFileSync(path.join(tmpDir, 'task.txt'), 'id: task-1\nstatus: [ ]\n', 'utf-8');
    writeAlpFile(tmpDir, 'task.alp', [
      '@task',
      '  id: task-1',
      '  status: [ ]',
    ].join('\n'));

    const updated = updateTaskStatusOnFile('task-1', '[x]', tmpDir);
    expect(updated).toBe(true);

    const txtContent = fs.readFileSync(path.join(tmpDir, 'task.txt'), 'utf-8');
    expect(txtContent).toContain('status: [ ]');
  });

  it('returns false and leaves files unchanged when the directory has no tasks', () => {
    writeAlpFile(tmpDir, 'task.alp', [
      '@task',
      '  id: task-1',
      '  status: [ ]',
    ].join('\n'));

    const updated = updateTaskStatusOnFile('task-2', '[x]', tmpDir);
    expect(updated).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// workspace-loader.releaseOnExit
// ---------------------------------------------------------------------------
describe('workspace-loader.releaseOnExit', () => {
  let captured: Record<string, (...args: any[]) => void>;
  let onceSpy: any;
  let exitSpy: any;

  beforeEach(() => {
    captured = {};

    onceSpy = vi.spyOn(process, 'once').mockImplementation(((event: any, listener: any) => {
      captured[event as string] = listener as (...args: any[]) => void;
      return process;
    }) as any);

    exitSpy = vi.spyOn(process, 'exit').mockImplementation((() => {
      throw new Error('process.exit called');
    }) as any);
  });

  afterEach(() => {
    onceSpy.mockRestore();
    exitSpy.mockRestore();
  });

  it('registers handlers for exit, SIGINT, and SIGTERM', () => {
    releaseOnExit({ release: vi.fn() } as any, 'task-1');
    expect(Object.keys(captured)).toEqual(
      expect.arrayContaining(['exit', 'SIGINT', 'SIGTERM'])
    );
  });

  it('registers exactly three handlers', () => {
    releaseOnExit({ release: vi.fn() } as any, 'task-1');
    expect(Object.keys(captured).length).toBe(3);
  });

  it('calls lockManager.release with the task id on exit', () => {
    const lockManager = { release: vi.fn() };
    releaseOnExit(lockManager as any, 'task-1');

    captured['exit']();

    expect(lockManager.release).toHaveBeenCalledTimes(1);
    expect(lockManager.release).toHaveBeenCalledWith('task-1');
  });

  it('only releases the lock once even if exit fires repeatedly', () => {
    const lockManager = { release: vi.fn() };
    releaseOnExit(lockManager as any, 'task-1');

    captured['exit']();
    captured['exit']();
    captured['exit']();

    expect(lockManager.release).toHaveBeenCalledTimes(1);
  });

  it('releases the lock and exits with code 130 on SIGINT', () => {
    const lockManager = { release: vi.fn() };
    releaseOnExit(lockManager as any, 'task-1');

    expect(() => captured['SIGINT']()).toThrow('process.exit called');

    expect(lockManager.release).toHaveBeenCalledTimes(1);
    expect(lockManager.release).toHaveBeenCalledWith('task-1');
    expect(exitSpy).toHaveBeenCalledWith(130);
  });

  it('releases the lock and exits with code 143 on SIGTERM', () => {
    const lockManager = { release: vi.fn() };
    releaseOnExit(lockManager as any, 'task-1');

    expect(() => captured['SIGTERM']()).toThrow('process.exit called');

    expect(lockManager.release).toHaveBeenCalledTimes(1);
    expect(lockManager.release).toHaveBeenCalledWith('task-1');
    expect(exitSpy).toHaveBeenCalledWith(143);
  });

  it('swallows errors thrown by lockManager.release', () => {
    const lockManager = { release: vi.fn(() => { throw new Error('release failed'); }) };
    releaseOnExit(lockManager as any, 'task-1');

    expect(() => captured['exit']()).not.toThrow();
    expect(lockManager.release).toHaveBeenCalledTimes(1);
  });

  it('does not release twice if exit fires after SIGINT', () => {
    const lockManager = { release: vi.fn() };
    releaseOnExit(lockManager as any, 'task-1');

    expect(() => captured['SIGINT']()).toThrow();
    captured['exit']();

    expect(lockManager.release).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// workspace-loader.resolveSwarmConfig
// ---------------------------------------------------------------------------
describe('workspace-loader.resolveSwarmConfig', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTmp('alp-swarmconfig-');
  });

  afterEach(() => {
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}
  });

  const fullSwarmAlp = [
    '@swarm',
    '  id: test-swarm',
    '  coordinator: http://localhost:9000',
    '  token: file-token',
    '  node_id: node-1',
    '  heartbeat_seconds: 30',
    '  pull_state: true',
    '  peers:',
    '    - peer-a',
    '    - peer-b',
  ].join('\n');

  it('parses and resolves a swarm object from .alp files', () => {
    writeAlpFile(tmpDir, 'swarm.alp', fullSwarmAlp);

    const cfg = resolveSwarmConfig(tmpDir, 'test-swarm');

    expect(cfg).toMatchObject({
      id: 'test-swarm',
      coordinator: 'http://localhost:9000',
      token: 'file-token',
      node_id: 'node-1',
      heartbeat_seconds: 30,
      pull_state: true,
      peers: ['peer-a', 'peer-b'],
    });
  });

  it('uses explicit coordinator, token, and node overrides when provided', () => {
    writeAlpFile(tmpDir, 'swarm.alp', fullSwarmAlp);

    const cfg = resolveSwarmConfig(
      tmpDir, 'test-swarm',
      'http://explicit:8080', 'override-token', 'override-node'
    );

    expect(cfg.coordinator).toBe('http://explicit:8080');
    expect(cfg.token).toBe('override-token');
    expect(cfg.node_id).toBe('override-node');
  });

  it('resolves a ${VAR} token from process.env', () => {
    writeAlpFile(tmpDir, 'swarm.alp', fullSwarmAlp);
    process.env.TEST_SWARM_TOKEN = 'env-resolved-secret';

    const cfg = resolveSwarmConfig(
      tmpDir, 'test-swarm', undefined, '${TEST_SWARM_TOKEN}', undefined
    );

    expect(cfg.token).toBe('env-resolved-secret');

    delete process.env.TEST_SWARM_TOKEN;
  });

  it('defaults coordinator to http://127.0.0.1:4000 when not specified', () => {
    writeAlpFile(tmpDir, 'minimal.alp', [
      '@swarm',
      '  id: default-swarm',
    ].join('\n'));

    const cfg = resolveSwarmConfig(tmpDir, 'default-swarm');

    expect(cfg.coordinator).toBe('http://127.0.0.1:4000');
    expect(cfg.token).toBeUndefined();
    expect(cfg.node_id).toBeUndefined();
    expect(cfg.heartbeat_seconds).toBeUndefined();
    expect(cfg.pull_state).toBeUndefined();
  });

  it('resolves heartbeat_seconds and pull_state from string values in the file', () => {
    writeAlpFile(tmpDir, 'swarm.alp', [
      '@swarm',
      '  id: typed-swarm',
      '  heartbeat_seconds: 45',
      '  pull_state: true',
    ].join('\n'));

    const cfg = resolveSwarmConfig(tmpDir, 'typed-swarm');

    expect(cfg.heartbeat_seconds).toBe(45);
    expect(cfg.pull_state).toBe(true);
  });

  it('treats pull_state string "false" as boolean false', () => {
    writeAlpFile(tmpDir, 'swarm.alp', [
      '@swarm',
      '  id: false-swarm',
      '  pull_state: false',
    ].join('\n'));

    const cfg = resolveSwarmConfig(tmpDir, 'false-swarm');

    expect(cfg.pull_state).toBe(false);
  });

  it('skips .runtime and .cache directories when searching for swarms', () => {
    writeAlpFile(tmpDir, '.runtime/hidden.alp', [
      '@swarm',
      '  id: hidden-swarm',
      '  coordinator: http://hidden:1',
    ].join('\n'));
    writeAlpFile(tmpDir, 'swarm.alp', [
      '@swarm',
      '  id: real-swarm',
      '  coordinator: http://real:2',
    ].join('\n'));

    const cfg = resolveSwarmConfig(tmpDir, 'real-swarm');
    expect(cfg.coordinator).toBe('http://real:2');

    const exitSpy = vi.spyOn(process, 'exit').mockImplementation((() => {
      throw new Error('exit');
    }) as any);
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => resolveSwarmConfig(tmpDir, 'hidden-swarm')).toThrow('exit');
    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(errSpy).toHaveBeenCalledWith(
      expect.stringContaining('hidden-swarm')
    );

    exitSpy.mockRestore();
    errSpy.mockRestore();
  });

  it('finds swarms nested in ordinary subdirectories (excluding .runtime/.cache)', () => {
    writeAlpFile(tmpDir, 'sub/deep/swarm.alp', [
      '@swarm',
      '  id: nested-swarm',
      '  coordinator: http://nested:3',
    ].join('\n'));

    const cfg = resolveSwarmConfig(tmpDir, 'nested-swarm');
    expect(cfg.id).toBe('nested-swarm');
    expect(cfg.coordinator).toBe('http://nested:3');
  });

  it('calls process.exit(1) and logs when the swarm is not found', () => {
    writeAlpFile(tmpDir, 'swarm.alp', fullSwarmAlp);

    const exitSpy = vi.spyOn(process, 'exit').mockImplementation((() => {
      throw new Error('exit');
    }) as any);
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => resolveSwarmConfig(tmpDir, 'does-not-exist')).toThrow('exit');
    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(errSpy).toHaveBeenCalledWith(
      expect.stringContaining('does-not-exist')
    );

    exitSpy.mockRestore();
    errSpy.mockRestore();
  });

  it('ignores empty .alp files and continues searching', () => {
    writeAlpFile(tmpDir, 'empty.alp', '');
    writeAlpFile(tmpDir, 'swarm.alp', [
      '@swarm',
      '  id: after-empty',
      '  coordinator: http://after:4',
    ].join('\n'));

    const cfg = resolveSwarmConfig(tmpDir, 'after-empty');
    expect(cfg.coordinator).toBe('http://after:4');
  });
});

// ---------------------------------------------------------------------------
// workspace-loader.loadAlpDirectory
// ---------------------------------------------------------------------------
describe('workspace-loader.loadAlpDirectory', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTmp('alp-loaddir-');
  });

  afterEach(() => {
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch {}
  });

  it('parses .alp files and pushes results to the provided array', () => {
    const parser = {
      parse: vi.fn().mockReturnValue([makeObj('task', { id: 't1', status: '[ ]' })]),
    };
    writeAlpFile(tmpDir, 't1.alp', 'irrelevant content');

    const results: any[] = [];
    loadAlpDirectory(tmpDir, parser as any, results);

    expect(parser.parse).toHaveBeenCalledTimes(1);
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('t1');
  });

  it('concatenates multiple objects parsed from a single file', () => {
    const parser = {
      parse: vi.fn().mockReturnValue([
        makeObj('task', { id: 't1' }),
        makeObj('task', { id: 't2' }),
      ]),
    };
    writeAlpFile(tmpDir, 'multi.alp', 'content');

    const results: any[] = [];
    loadAlpDirectory(tmpDir, parser as any, results);

    expect(results).toHaveLength(2);
    expect(results.map((o) => o.id)).toEqual(['t1', 't2']);
  });

  it('ignores files that do not end with .alp', () => {
    const parser = { parse: vi.fn() };
    fs.writeFileSync(path.join(tmpDir, 'notes.txt'), 'id: t1', 'utf-8');
    fs.writeFileSync(path.join(tmpDir, 'data.json'), '{}', 'utf-8');

    const results: any[] = [];
    loadAlpDirectory(tmpDir, parser as any, results);

    expect(parser.parse).not.toHaveBeenCalled();
    expect(results).toEqual([]);
  });

  it('recurses into subdirectories', () => {
    const parser = {
      parse: vi.fn().mockImplementation((content: string) => {
        if (content.includes('root')) return [makeObj('task', { id: 'root-task' })];
        return [makeObj('task', { id: 'sub-task' })];
      }),
    };
    writeAlpFile(tmpDir, 'root.alp', 'root');
    writeAlpFile(tmpDir, 'sub/dir/nested.alp', 'nested');

    const results: any[] = [];
    loadAlpDirectory(tmpDir, parser as any, results);

    expect(results).toHaveLength(2);
    expect(results.map((o) => o.id)).toEqual(['root-task', 'sub-task']);
  });

  it('continues processing when one file throws, swallowing the error', () => {
    const parser = {
      parse: vi.fn().mockImplementation((content: string) => {
        if (content === 'bad') throw new Error('parse error');
        return [makeObj('task', { id: 'good' })];
      }),
    };
    writeAlpFile(tmpDir, 'bad.alp', 'bad');
    writeAlpFile(tmpDir, 'good.alp', 'good');

    const results: any[] = [];
    loadAlpDirectory(tmpDir, parser as any, results);

    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('good');
  });

  it('results in an empty array for an empty directory', () => {
    const parser = { parse: vi.fn() };
    const results: any[] = [];
    loadAlpDirectory(tmpDir, parser as any, results);
    expect(results).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// RunOptions interface (run-command.ts)
// ---------------------------------------------------------------------------
describe('run-command.RunOptions', () => {
  it('accepts all documented optional fields with correct types', () => {
    const opts: RunOptions = {
      task: 't1',
      agent: 'default-agent',
      dryRun: true,
      concurrent: 2,
      provider: 'openai',
      model: 'gpt-4o',
      swarm: 'swarm-1',
    };
    expect(opts.task).toBe('t1');
    expect(opts.dryRun).toBe(true);
    expect(opts.concurrent).toBe(2);
  });

  it('allows an empty options object (all fields optional)', () => {
    const opts: RunOptions = {};
    expect(opts).toEqual({});
  });
});
