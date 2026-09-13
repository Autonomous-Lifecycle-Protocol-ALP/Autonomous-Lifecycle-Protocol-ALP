import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import * as path from 'path';

const CLI = path.resolve(process.cwd(), 'cli/dist/index.js');

describe('alp studio and alp sham commands', () => {
  it('alp studio displays enterprise portal information and credentials', () => {
    const output = execFileSync('node', [CLI, 'studio'], {
      encoding: 'utf-8',
      timeout: 10000,
    });

    expect(output).toContain('ALP STUDIO & WEB SERVICES');
    expect(output).toContain('Enterprise Web Portal');
    expect(output).toContain('http://localhost:5174');
    expect(output).toContain('demo@alp-enterprise.com / demo123');
  });

  it('alp studio playground displays playground service details', () => {
    const output = execFileSync('node', [CLI, 'studio', 'playground'], {
      encoding: 'utf-8',
      timeout: 10000,
    });

    expect(output).toContain('Monaco Web Playground');
    expect(output).toContain('http://localhost:5173');
  });

  it('alp studio server displays backend API details', () => {
    const output = execFileSync('node', [CLI, 'studio', 'server'], {
      encoding: 'utf-8',
      timeout: 10000,
    });

    expect(output).toContain('Enterprise Backend API');
    expect(output).toContain('http://localhost:5000');
    expect(output).toContain('in-memory MongoDB');
  });

  it('alp studio supports custom port override', () => {
    const output = execFileSync('node', [CLI, 'studio', 'portal', '--port', '8080'], {
      encoding: 'utf-8',
      timeout: 10000,
    });

    expect(output).toContain('http://localhost:8080');
  });

  it('alp sham --help shows description and options', () => {
    const output = execFileSync('node', [CLI, 'sham', '--help'], {
      encoding: 'utf-8',
      timeout: 10000,
    });

    expect(output).toContain('Launch the SHAM Desktop IDE');
    expect(output).toContain('--dev');
  });

  it('alp studio --help shows available arguments and options', () => {
    const output = execFileSync('node', [CLI, 'studio', '--help'], {
      encoding: 'utf-8',
      timeout: 10000,
    });

    expect(output).toContain('Access and launch ALP web studios');
    expect(output).toContain('--open');
    expect(output).toContain('--start');
    expect(output).toContain('--port');
  });
});
