import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { spawn, ChildProcess } from 'child_process';

function makeTmpWorkspace(alpFiles: Record<string, string>, createAlpDir = true): string {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'alp-synapse-'));
  if (createAlpDir) {
    const alpDir = path.join(tmp, '.alp');
    fs.mkdirSync(alpDir, { recursive: true });

    for (const [name, content] of Object.entries(alpFiles)) {
      fs.writeFileSync(path.join(alpDir, name), content, 'utf-8');
    }
  }

  return tmp;
}

describe('E2E: synapse CLI commands', () => {
  let workspace: string;

  afterEach(() => {
    if (workspace) fs.rmSync(workspace, { recursive: true, force: true });
  });

  it('runs synapse export and creates vault files', async () => {
    workspace = makeTmpWorkspace({
      'project.alp': `!alp-version: 3.0.0
@project
  id: synapse-test
  description: "Test project"`,
      'tasks.alp': `!alp-version: 3.0.0
@task
  id: task-1
  description: "Do work"
  owner: agent-1`,
      'agents.alp': `!alp-version: 3.0.0
@agent
  id: agent-1
  description: "Test agent"`,
    });

    const cliPath = path.resolve(__dirname, '..', 'dist', 'index.js');
    const outDir = path.join(workspace, '.synapse');

    const result = await new Promise<{ code: number; stdout: string }>((resolve) => {
      const child = spawn('node', [cliPath, 'synapse', 'export', '--out', outDir], {
        cwd: workspace,
        stdio: ['ignore', 'pipe', 'pipe'],
      });
      let stdout = '';
      child.stdout.on('data', (d) => (stdout += d));
      child.stderr.on('data', (d) => (stdout += d));
      child.on('close', (code) => resolve({ code: code || 0, stdout }));
    });

    expect(result.code).toBe(0);
    expect(result.stdout).toContain('Successfully exported');
    expect(fs.existsSync(path.join(outDir, 'MOC.md'))).toBe(true);
    expect(fs.existsSync(path.join(outDir, 'synapse.canvas'))).toBe(true);
    expect(fs.existsSync(path.join(outDir, 'tasks', 'task-1.md'))).toBe(true);
    expect(fs.existsSync(path.join(outDir, 'agents', 'agent-1.md'))).toBe(true);
  });

  it('runs synapse graph in json format', async () => {
    workspace = makeTmpWorkspace({
      'project.alp': `!alp-version: 3.0.0
@project
  id: synapse-test
  description: "Test project"`,
      'tasks.alp': `!alp-version: 3.0.0
@task
  id: task-1
  description: "Do work"`,
    });

    const cliPath = path.resolve(__dirname, '..', 'dist', 'index.js');

    const result = await new Promise<{ code: number; stdout: string }>((resolve) => {
      const child = spawn('node', [cliPath, 'synapse', 'graph', '--format', 'json'], {
        cwd: workspace,
        stdio: ['ignore', 'pipe', 'pipe'],
      });
      let stdout = '';
      child.stdout.on('data', (d) => (stdout += d));
      child.stderr.on('data', (d) => (stdout += d));
      child.on('close', (code) => resolve({ code: code || 0, stdout }));
    });

    expect(result.code).toBe(0);
    const parsed = JSON.parse(result.stdout);
    expect(parsed.nodes).toBeDefined();
    expect(parsed.edges).toBeDefined();
    expect(parsed.stats).toBeDefined();
  });

  it('runs synapse graph in mermaid format', async () => {
    workspace = makeTmpWorkspace({
      'project.alp': `!alp-version: 3.0.0
@project
  id: synapse-test
  description: "Test project"`,
      'tasks.alp': `!alp-version: 3.0.0
@task
  id: task-1
  description: "Do work"`,
    });

    const cliPath = path.resolve(__dirname, '..', 'dist', 'index.js');

    const result = await new Promise<{ code: number; stdout: string }>((resolve) => {
      const child = spawn('node', [cliPath, 'synapse', 'graph', '--format', 'mermaid'], {
        cwd: workspace,
        stdio: ['ignore', 'pipe', 'pipe'],
      });
      let stdout = '';
      child.stdout.on('data', (d) => (stdout += d));
      child.stderr.on('data', (d) => (stdout += d));
      child.on('close', (code) => resolve({ code: code || 0, stdout }));
    });

    expect(result.code).toBe(0);
    expect(result.stdout).toContain('flowchart LR');
    expect(result.stdout).toContain('task-1');
  });

  it('runs synapse graph in dot format', async () => {
    workspace = makeTmpWorkspace({
      'project.alp': `!alp-version: 3.0.0
@project
  id: synapse-test
  description: "Test project"`,
      'tasks.alp': `!alp-version: 3.0.0
@task
  id: task-1
  description: "Do work"`,
    });

    const cliPath = path.resolve(__dirname, '..', 'dist', 'index.js');

    const result = await new Promise<{ code: number; stdout: string }>((resolve) => {
      const child = spawn('node', [cliPath, 'synapse', 'graph', '--format', 'dot'], {
        cwd: workspace,
        stdio: ['ignore', 'pipe', 'pipe'],
      });
      let stdout = '';
      child.stdout.on('data', (d) => (stdout += d));
      child.stderr.on('data', (d) => (stdout += d));
      child.on('close', (code) => resolve({ code: code || 0, stdout }));
    });

    expect(result.code).toBe(0);
    expect(result.stdout).toContain('digraph SynapseGraph');
    expect(result.stdout).toContain('task-1');
  });

  it('runs synapse graph in canvas format', async () => {
    workspace = makeTmpWorkspace({
      'project.alp': `!alp-version: 3.0.0
@project
  id: synapse-test
  description: "Test project"`,
      'tasks.alp': `!alp-version: 3.0.0
@task
  id: task-1
  description: "Do work"`,
    });

    const cliPath = path.resolve(__dirname, '..', 'dist', 'index.js');

    const result = await new Promise<{ code: number; stdout: string }>((resolve) => {
      const child = spawn('node', [cliPath, 'synapse', 'graph', '--format', 'canvas'], {
        cwd: workspace,
        stdio: ['ignore', 'pipe', 'pipe'],
      });
      let stdout = '';
      child.stdout.on('data', (d) => (stdout += d));
      child.stderr.on('data', (d) => (stdout += d));
      child.on('close', (code) => resolve({ code: code || 0, stdout }));
    });

    expect(result.code).toBe(0);
    const parsed = JSON.parse(result.stdout);
    expect(parsed.nodes).toBeDefined();
    expect(parsed.edges).toBeDefined();
  });

  it('runs synapse stats and reports graph statistics', async () => {
    workspace = makeTmpWorkspace({
      'project.alp': `!alp-version: 3.0.0
@project
  id: synapse-test
  description: "Test project"`,
      'tasks.alp': `!alp-version: 3.0.0
@task
  id: task-1
  description: "Do work"
@task
  id: task-2
  description: "More work"
  depends: task-1`,
      'agents.alp': `!alp-version: 3.0.0
@agent
  id: agent-1
  description: "Agent"`,
    });

    const cliPath = path.resolve(__dirname, '..', 'dist', 'index.js');

    const result = await new Promise<{ code: number; stdout: string }>((resolve) => {
      const child = spawn('node', [cliPath, 'synapse', 'stats'], {
        cwd: workspace,
        stdio: ['ignore', 'pipe', 'pipe'],
      });
      let stdout = '';
      child.stdout.on('data', (d) => (stdout += d));
      child.stderr.on('data', (d) => (stdout += d));
      child.on('close', (code) => resolve({ code: code || 0, stdout }));
    });

    expect(result.code).toBe(0);
    expect(result.stdout).toContain('Total Nodes:    4');
    expect(result.stdout).toContain('Total Edges:    1');
    expect(result.stdout).toContain('task');
    expect(result.stdout).toContain('agent');
    expect(result.stdout).toContain('project');
  });

  it('runs synapse graph and writes to file with --out', async () => {
    workspace = makeTmpWorkspace({
      'project.alp': `!alp-version: 3.0.0
@project
  id: synapse-test
  description: "Test project"`,
      'tasks.alp': `!alp-version: 3.0.0
@task
  id: task-1
  description: "Do work"`,
    });

    const cliPath = path.resolve(__dirname, '..', 'dist', 'index.js');
    const outFile = path.join(workspace, 'graph.json');

    const result = await new Promise<{ code: number; stdout: string }>((resolve) => {
      const child = spawn('node', [cliPath, 'synapse', 'graph', '--out', outFile], {
        cwd: workspace,
        stdio: ['ignore', 'pipe', 'pipe'],
      });
      let stdout = '';
      child.stdout.on('data', (d) => (stdout += d));
      child.stderr.on('data', (d) => (stdout += d));
      child.on('close', (code) => resolve({ code: code || 0, stdout }));
    });

    expect(result.code).toBe(0);
    expect(result.stdout).toContain('Graph written to');
    expect(fs.existsSync(outFile)).toBe(true);
    const content = JSON.parse(fs.readFileSync(outFile, 'utf-8'));
    expect(content.nodes).toBeDefined();
  });

  it('fails gracefully when .alp directory is missing', async () => {
    workspace = makeTmpWorkspace({}, false);

    const cliPath = path.resolve(__dirname, '..', 'dist', 'index.js');

    const result = await new Promise<{ code: number; stdout: string }>((resolve) => {
      const child = spawn('node', [cliPath, 'synapse', 'export'], {
        cwd: workspace,
        stdio: ['ignore', 'pipe', 'pipe'],
      });
      let stdout = '';
      child.stdout.on('data', (d) => (stdout += d));
      child.stderr.on('data', (d) => (stdout += d));
      child.on('close', (code) => resolve({ code: code || 0, stdout }));
    });

    expect(result.code).not.toBe(0);
    expect(result.stdout).toContain('.alp directory not found');
  });
});

describe('E2E: synapse example runner', () => {
  it('runs the synapse-mesh example script against real .alp files', async () => {
    const exampleDir = path.resolve(__dirname, '..', '..', 'examples', 'synapse-mesh');
    const runnerPath = path.join(exampleDir, 'src', 'index.ts');

    const result = await new Promise<{ code: number; stdout: string }>((resolve) => {
      const child = spawn('npx.cmd', ['tsx', runnerPath], {
        cwd: path.resolve(__dirname, '..'),
        stdio: ['ignore', 'pipe', 'pipe'],
        shell: true,
      });
      let stdout = '';
      child.stdout.on('data', (d) => (stdout += d));
      child.stderr.on('data', (d) => (stdout += d));
      child.on('close', (code) => resolve({ code: code || 0, stdout }));
    });

    expect(result.code).toBe(0);
    expect(result.stdout).toContain('ALP SYNAPSE MESH ORCHESTRATOR DEMO');
    expect(result.stdout).toContain('Parsing 5 ALP specification files');
    expect(result.stdout).toContain('Compiling Synapse Knowledge Graph');
    expect(result.stdout).toContain('Generating Synapse Markdown Vault');
    expect(result.stdout).toContain('Generating Interactive JSON Canvas');
    expect(result.stdout).toContain('completed successfully');
  });
});
