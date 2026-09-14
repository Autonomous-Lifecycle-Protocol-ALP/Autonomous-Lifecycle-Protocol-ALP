import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

vi.mock('fs', () => ({
  existsSync: vi.fn(),
  readdirSync: vi.fn(),
  readFileSync: vi.fn(),
  writeFileSync: vi.fn(),
  mkdirSync: vi.fn(),
  statSync: vi.fn(() => ({ mtimeMs: 0 })),
  appendFileSync: vi.fn(),
  cpSync: vi.fn(),
  rmSync: vi.fn(),
  promises: {
    access: vi.fn(),
    stat: vi.fn(),
  },
}));

vi.mock('@autonomous-lifecycle-protocol-alp/parser', () => ({
  AlpGraph: vi.fn(),
  updateObjectStatus: vi.fn(),
}));

vi.mock('@autonomous-lifecycle-protocol-alp/sdk', () => ({
  DocumentValidator: vi.fn().mockImplementation(() => ({
    validate: vi.fn(),
  })),
}));

vi.mock('../../src/workspace', () => ({
  loadWorkspace: vi.fn(() => []),
  validateDirectory: vi.fn(),
  toKebab: vi.fn((input: string) => input.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').replace(/-{2,}/g, '-')),
  getAlpDirMtime: vi.fn(() => 0),
  findAlpFiles: vi.fn(() => []),
}));

vi.mock('../../src/policy', () => ({
  enforcePolicy: vi.fn(() => null),
}));

vi.mock('../../src/audit', () => ({
  audit: vi.fn(),
}));

import { callTool } from '../../src/tools/task-tools';
import { loadWorkspace } from '../../src/workspace';
import { toKebab } from '../../src/workspace';
import { enforcePolicy } from '../../src/policy';
import { audit } from '../../src/audit';

const mockLoadWorkspace = loadWorkspace as ReturnType<typeof vi.fn>;
const mockToKebab = toKebab as ReturnType<typeof vi.fn>;
const mockEnforcePolicy = enforcePolicy as ReturnType<typeof vi.fn>;
const mockAudit = audit as ReturnType<typeof vi.fn>;

const MOCK_CWD = '/tmp/mock-cwd';

beforeEach(() => {
  vi.clearAllMocks();
  mockLoadWorkspace.mockReturnValue([]);
  mockToKebab.mockImplementation((input: string) => input.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').replace(/-{2,}/g, '-'));
  mockEnforcePolicy.mockReturnValue(null);
  mockAudit.mockImplementation(() => {});
});

describe('task-tools', () => {
  it('alp_create_task creates a .alp file in .alp/tasks/', () => {
    const writtenFiles: Record<string, string> = {};

    vi.mocked(fs.existsSync).mockImplementation((p: any) => false);
    vi.mocked(fs.mkdirSync).mockImplementation(() => {});
    vi.mocked(fs.writeFileSync).mockImplementation((p: any, content: any) => {
      writtenFiles[String(p)] = typeof content === 'string' ? content : String(content);
    });

    const result = callTool('alp_create_task', { title: 'Test Task', description: 'A test task' }, MOCK_CWD);

    expect(result.isError).toBeFalsy();
    expect(result.content[0].text).toBe('Created task test-task.');

    const expectedPath = path.join(MOCK_CWD, '.alp', 'tasks', 'test-task.alp');
    expect(writtenFiles[expectedPath]).toBeDefined();
    expect(writtenFiles[expectedPath]).toContain('@task');
    expect(writtenFiles[expectedPath]).toContain('id: test-task');
    expect(writtenFiles[expectedPath]).toContain('A test task');
  });

  it('alp_delegate creates a delegated task with owner, priority, tags', () => {
    const writtenFiles: Record<string, string> = {};

    vi.mocked(fs.existsSync).mockImplementation((p: any) => false);
    vi.mocked(fs.mkdirSync).mockImplementation(() => {});
    vi.mocked(fs.writeFileSync).mockImplementation((p: any, content: any) => {
      writtenFiles[String(p)] = typeof content === 'string' ? content : String(content);
    });

    const result = callTool('alp_delegate', {
      title: 'Delegate Task',
      agent: 'agent-qa',
      priority: 'high',
      tags: ['bug', 'urgent'],
    }, MOCK_CWD);

    expect(result.isError).toBeFalsy();
    expect(result.content[0].text).toBe('Delegated task delegate-task to agent-qa.');

    const expectedPath = path.join(MOCK_CWD, '.alp', 'tasks', 'delegate-task.alp');
    expect(writtenFiles[expectedPath]).toBeDefined();
    const body = writtenFiles[expectedPath];
    expect(body).toContain('@task');
    expect(body).toContain('owner: -> agent-qa');
    expect(body).toContain('priority: high');
    expect(body).toContain('tags: ["bug", "urgent"]');
  });
});
