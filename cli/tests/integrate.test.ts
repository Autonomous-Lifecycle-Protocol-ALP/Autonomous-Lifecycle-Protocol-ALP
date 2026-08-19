import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { integrateCommand } from '../src/commands/integrate';

describe('alp integrate CLI command', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'alp-integrate-test-'));
  });

  afterEach(() => {
    if (fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('scaffolds cursor rules', () => {
    const res = integrateCommand('cursor', { targetDir: tmpDir });
    expect(res.success).toBe(true);

    const cursorRulesPath = path.join(tmpDir, '.cursorrules');
    expect(fs.existsSync(cursorRulesPath)).toBe(true);
    const content = fs.readFileSync(cursorRulesPath, 'utf8');
    expect(content).toContain('Autonomous Lifecycle Protocol');
    expect(content).toContain('alp graph');
  });

  it('scaffolds claude code instructions', () => {
    const res = integrateCommand('claude', { targetDir: tmpDir });
    expect(res.success).toBe(true);

    const claudePath = path.join(tmpDir, 'CLAUDE.md');
    const claudecodePath = path.join(tmpDir, '.claudecode.md');
    expect(fs.existsSync(claudePath)).toBe(true);
    expect(fs.existsSync(claudecodePath)).toBe(true);
    const content = fs.readFileSync(claudePath, 'utf8');
    expect(content).toContain('ALP Instructions for Claude Code');
  });

  it('scaffolds github actions workflow', () => {
    const res = integrateCommand('github', { targetDir: tmpDir });
    expect(res.success).toBe(true);

    const workflowPath = path.join(tmpDir, '.github', 'workflows', 'alp-validate.yml');
    expect(fs.existsSync(workflowPath)).toBe(true);
    const content = fs.readFileSync(workflowPath, 'utf8');
    expect(content).toContain('name: "ALP Validate"');
  });

  it('scaffolds all integrations by default', () => {
    const res = integrateCommand('all', { targetDir: tmpDir });
    expect(res.success).toBe(true);

    expect(fs.existsSync(path.join(tmpDir, '.cursorrules'))).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, 'CLAUDE.md'))).toBe(true);
    expect(fs.existsSync(path.join(tmpDir, '.github', 'workflows', 'alp-validate.yml'))).toBe(true);
  });

  it('skips existing files unless --force is specified', () => {
    // First run
    integrateCommand('cursor', { targetDir: tmpDir });
    const cursorRulesPath = path.join(tmpDir, '.cursorrules');
    fs.writeFileSync(cursorRulesPath, 'CUSTOM CONTENT', 'utf8');

    // Second run without force
    const res2 = integrateCommand('cursor', { targetDir: tmpDir, force: false });
    expect(res2.results[0].skipped).toBe(true);
    expect(fs.readFileSync(cursorRulesPath, 'utf8')).toBe('CUSTOM CONTENT');

    // Third run with force
    const res3 = integrateCommand('cursor', { targetDir: tmpDir, force: true });
    expect(res3.results[0].created).toBe(true);
    expect(fs.readFileSync(cursorRulesPath, 'utf8')).not.toBe('CUSTOM CONTENT');
  });

  it('handles unknown targets gracefully', () => {
    const res = integrateCommand('unknown-tool', { targetDir: tmpDir });
    expect(res.success).toBe(false);
  });
});
