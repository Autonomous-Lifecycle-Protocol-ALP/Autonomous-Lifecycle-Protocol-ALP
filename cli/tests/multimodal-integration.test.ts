import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { spawn, ChildProcess } from 'child_process';

function makeTmpWorkspace(alpFiles: Record<string, string>, createAlpDir = true): string {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'alp-multimodal-'));
  if (createAlpDir) {
    const alpDir = path.join(tmp, '.alp');
    fs.mkdirSync(alpDir, { recursive: true });

    for (const [name, content] of Object.entries(alpFiles)) {
      fs.writeFileSync(path.join(alpDir, name), content, 'utf-8');
    }
  }

  return tmp;
}

describe('E2E: multimodal CLI commands', () => {
  let workspace: string;

  afterEach(() => {
    if (workspace) fs.rmSync(workspace, { recursive: true, force: true });
  });

  it('runs multimodal inspect against real .alp files', async () => {
    workspace = makeTmpWorkspace({
      'project.alp': `!alp-version: 3.0.0
@project
  id: mm-test
  description: "Test project"`,
      'multimodal.alp': `!alp-version: 3.0.0
@multimodal
  id: mm-vision
  modalities:
    - vision
    - sensor
  assets:
    - id: cam1, type: image, uri: s3://bucket/cam1.png`,
      'vision_model.alp': `!alp-version: 3.0.0
@vision_model
  id: vm-clip
  backbone: clip
  context_tokens: 4096`,
      'action_space.alp': `!alp-version: 3.0.0
@action_space
  id: as-robot
  domain: robotics
  actions:
    - move
    - scan`,
    });

    const cliPath = path.resolve(__dirname, '..', 'dist', 'index.js');
    const result = await new Promise<{ code: number; stdout: string }>((resolve) => {
      const child = spawn('node', [cliPath, 'multimodal', 'inspect'], {
        cwd: workspace,
        stdio: ['ignore', 'pipe', 'pipe'],
      });
      let stdout = '';
      child.stdout.on('data', (d) => (stdout += d));
      child.stderr.on('data', (d) => (stdout += d));
      child.on('close', (code) => resolve({ code: code || 0, stdout }));
    });

    expect(result.code).toBe(0);
    expect(result.stdout).toContain('mm-vision');
    expect(result.stdout).toContain('vm-clip');
    expect(result.stdout).toContain('as-robot');
  });

  it('runs multimodal validate and reports valid specs', async () => {
    workspace = makeTmpWorkspace({
      'project.alp': `!alp-version: 3.0.0
@project
  id: mm-test
  description: "Test project"`,
      'multimodal.alp': `!alp-version: 3.0.0
@multimodal
  id: mm-valid
  modalities:
    - vision
  assets:
    - id: img1, type: image, uri: s3://bucket/img1.png`,
    });

    const cliPath = path.resolve(__dirname, '..', 'dist', 'index.js');
    const result = await new Promise<{ code: number; stdout: string }>((resolve) => {
      const child = spawn('node', [cliPath, 'multimodal', 'validate'], {
        cwd: workspace,
        stdio: ['ignore', 'pipe', 'pipe'],
      });
      let stdout = '';
      child.stdout.on('data', (d) => (stdout += d));
      child.stderr.on('data', (d) => (stdout += d));
      child.on('close', (code) => resolve({ code: code || 0, stdout }));
    });

    expect(result.code).toBe(0);
    expect(result.stdout).toContain('mm-valid');
    expect(result.stdout).toContain('valid');
  });

  it('runs action-space check and reports safety compliance', async () => {
    workspace = makeTmpWorkspace({
      'project.alp': `!alp-version: 3.0.0
@project
  id: mm-test
  description: "Test project"`,
      'action_space.alp': `!alp-version: 3.0.0
@action_space
  id: as-safe
  domain: robotics
  actions:
    - navigate
    - scan`,
    });

    const cliPath = path.resolve(__dirname, '..', 'dist', 'index.js');
    const result = await new Promise<{ code: number; stdout: string }>((resolve) => {
      const child = spawn('node', [cliPath, 'action-space', 'check'], {
        cwd: workspace,
        stdio: ['ignore', 'pipe', 'pipe'],
      });
      let stdout = '';
      child.stdout.on('data', (d) => (stdout += d));
      child.stderr.on('data', (d) => (stdout += d));
      child.on('close', (code) => resolve({ code: code || 0, stdout }));
    });

    expect(result.code).toBe(0);
    expect(result.stdout).toContain('as-safe');
    expect(result.stdout).toContain('safe and verified');
  });

  it('runs token-cost with --modalities override', async () => {
    workspace = makeTmpWorkspace({
      'project.alp': `!alp-version: 3.0.0
@project
  id: mm-test
  description: "Test project"`,
      'multimodal.alp': `!alp-version: 3.0.0
@multimodal
  id: mm-cost
  modalities:
    - vision
  assets:
    - id: img1, type: image, uri: s3://bucket/img1.png`,
      'vision_model.alp': `!alp-version: 3.0.0
@vision_model
  id: vm-clip
  backbone: clip
  context_tokens: 4096`,
    });

    const cliPath = path.resolve(__dirname, '..', 'dist', 'index.js');
    const result = await new Promise<{ code: number; stdout: string }>((resolve) => {
      const child = spawn('node', [cliPath, 'token-cost', '--modalities', 'vision,audio', '--json'], {
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
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed[0].id).toBe('mm-cost');
    expect(parsed[0].modalities).toEqual(['vision', 'audio']);
  });

  it('fails gracefully when .alp directory is missing', async () => {
    workspace = makeTmpWorkspace({}, false);

    const cliPath = path.resolve(__dirname, '..', 'dist', 'index.js');
    const result = await new Promise<{ code: number; stdout: string }>((resolve) => {
      const child = spawn('node', [cliPath, 'multimodal', 'inspect'], {
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

describe('E2E: multimodal example runner', () => {
  it('runs the multimodal-vla example script against real .alp files', async () => {
    const exampleDir = path.resolve(__dirname, '..', '..', 'examples', 'multimodal-vla');
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
    expect(result.stdout).toContain('MULTI-MODAL VLA ORCHESTRATOR DEMO');
    expect(result.stdout).toContain('Parsing 5 ALP specification files');
    expect(result.stdout).toContain('Validating Multi-Modal & VLA Specifications');
    expect(result.stdout).toContain('Compiling Synapse Knowledge Graph');
    expect(result.stdout).toContain('Generating Synapse Markdown Vault');
    expect(result.stdout).toContain('Generating Interactive JSON Canvas');
    expect(result.stdout).toContain('completed successfully');
  });
});
