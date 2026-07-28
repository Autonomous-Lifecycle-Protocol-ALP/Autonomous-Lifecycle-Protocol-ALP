import fs from 'fs';
import path from 'path';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';

import { settingsCommand } from '../src/commands/settings';
import { searchCommand } from '../src/commands/search';

const FIXTURE_DIR = path.join(__dirname, 'fixtures', 'cli-v41');

function fixture(name: string): string {
  return path.join(FIXTURE_DIR, name);
}

describe('settingsCommand', () => {
  beforeEach(() => {
    const dir = fixture('workspace');
    fs.rmSync(dir, { recursive: true, force: true });
    fs.mkdirSync(path.join(dir, '.alp'), { recursive: true });
    process.chdir(dir);
  });

  afterEach(() => {
    process.chdir(path.join(__dirname, '..', '..'));
  });

  it('lists no settings when settings.json is missing', () => {
    const consoleSpy = { log: [] as string[] };
    const origLog = console.log;
    console.log = (...args: unknown[]) => consoleSpy.log.push(args.join(' '));
    try {
      settingsCommand({ list: true });
    } finally {
      console.log = origLog;
    }
    expect(consoleSpy.log.join(' ')).toContain('(no settings configured)');
  });

  it('sets and gets a setting', () => {
    const consoleSpy = { log: [] as string[] };
    const origLog = console.log;
    console.log = (...args: unknown[]) => consoleSpy.log.push(args.join(' '));
    try {
      settingsCommand({ set: 'theme', value: 'dark' });
      settingsCommand({ get: 'theme' });
    } finally {
      console.log = origLog;
    }
    const last = consoleSpy.log[consoleSpy.log.length - 1];
    expect(last).toContain('dark');
  });
});

describe('searchCommand', () => {
  beforeEach(() => {
    const dir = fixture('workspace');
    fs.rmSync(dir, { recursive: true, force: true });
    fs.mkdirSync(path.join(dir, '.alp'), { recursive: true });
    fs.writeFileSync(path.join(dir, '.alp', 'task-auth.alp'), `!alp-version: 2.0.0\n\n@task\n  id: task-auth\n  description: "Implement authentication"\n  status: [ ]\n`);
    process.chdir(dir);
  });

  afterEach(() => {
    process.chdir(path.join(__dirname, '..', '..'));
  });

  it('finds objects by text query', () => {
    const consoleSpy = { log: [] as string[] };
    const origLog = console.log;
    console.log = (...args: unknown[]) => consoleSpy.log.push(args.join(' '));
    try {
      searchCommand({ query: 'auth' });
    } finally {
      console.log = origLog;
    }
    const output = consoleSpy.log.join(' ');
    expect(output).toContain('task-auth');
  });

  it('filters by type', () => {
    const consoleSpy = { log: [] as string[] };
    const origLog = console.log;
    console.log = (...args: unknown[]) => consoleSpy.log.push(args.join(' '));
    try {
      searchCommand({ query: 'auth', type: 'task' });
    } finally {
      console.log = origLog;
    }
    const output = consoleSpy.log.join(' ');
    expect(output).toContain('task-auth');
  });

  it('supports regex queries', () => {
    const consoleSpy = { log: [] as string[] };
    const origLog = console.log;
    console.log = (...args: unknown[]) => consoleSpy.log.push(args.join(' '));
    try {
      searchCommand({ query: '^task-.*', regex: true });
    } finally {
      console.log = origLog;
    }
    const output = consoleSpy.log.join(' ');
    expect(output).toContain('task-auth');
  });
});
