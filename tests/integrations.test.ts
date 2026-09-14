import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

describe('Integrations directory verification', () => {
  const integrationsRoot = path.resolve(__dirname, '../integrations');

  it('verifies cursor integration file exists and has valid instructions', () => {
    const cursorFile = path.join(integrationsRoot, 'cursor', '.cursorrules');
    expect(fs.existsSync(cursorFile)).toBe(true);
    const content = fs.readFileSync(cursorFile, 'utf8');
    expect(content.length).toBeGreaterThan(100);
    expect(content).toContain('Autonomous Lifecycle Protocol');
    expect(content).toContain('@task');
    expect(content).toContain('validate');

    // Emoji check
    const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
    expect(emojiRegex.test(content)).toBe(false);
  });

  it('verifies claude-code instructions file exists and is valid', () => {
    const claudeFile = path.join(integrationsRoot, 'claude-code', 'instructions.md');
    expect(fs.existsSync(claudeFile)).toBe(true);
    const content = fs.readFileSync(claudeFile, 'utf8');
    expect(content.length).toBeGreaterThan(100);
    expect(content).toContain('Autonomous Lifecycle Protocol');
    expect(content).toContain('node cli/dist/index.js');

    // Emoji check
    const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
    expect(emojiRegex.test(content)).toBe(false);
  });

  it('verifies all GitHub Actions workflow files are valid YAML with no emojis', () => {
    const githubDir = path.join(integrationsRoot, 'github');
    expect(fs.existsSync(githubDir)).toBe(true);
    const files = fs.readdirSync(githubDir).filter((f) => f.endsWith('.yml') || f.endsWith('.yaml'));
    expect(files.length).toBeGreaterThanOrEqual(4);

    for (const file of files) {
      const filePath = path.join(githubDir, file);
      const rawContent = fs.readFileSync(filePath, 'utf8');

      // Check valid YAML
      const parsed = yaml.load(rawContent);
      expect(parsed).toBeDefined();
      expect(typeof parsed).toBe('object');
      expect((parsed as any).name).toBeDefined();
      expect((parsed as any).on).toBeDefined();
      expect((parsed as any).jobs).toBeDefined();

      // Emoji check
      const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
      expect(emojiRegex.test(rawContent)).toBe(false);
    }
  });

  it('verifies integrations README is complete and accurate', () => {
    const readmeFile = path.join(integrationsRoot, 'README.md');
    expect(fs.existsSync(readmeFile)).toBe(true);
    const content = fs.readFileSync(readmeFile, 'utf8');
    expect(content).toContain('Cursor');
    expect(content).toContain('Claude Code');
    expect(content).toContain('GitHub Actions');
    expect(content).toContain('mcp-server');

    // Emoji check
    const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
    expect(emojiRegex.test(content)).toBe(false);
  });
});
