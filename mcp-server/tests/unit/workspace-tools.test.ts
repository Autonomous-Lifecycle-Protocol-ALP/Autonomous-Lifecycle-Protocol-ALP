import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fs from 'fs';

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
  AlpGraph: vi.fn().mockImplementation(() => ({
    buildGraph: vi.fn(),
    topologicalSort: vi.fn().mockReturnValue([]),
    getImpact: vi.fn().mockReturnValue([]),
  })),
  AlpParser: vi.fn(),
  AlpObject: Object,
}));

vi.mock('../../src/workspace', () => ({
  loadWorkspace: vi.fn(() => []),
  validateDirectory: vi.fn(),
  toKebab: (input: string) => input.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').replace(/-{2,}/g, '-'),
  getAlpDirMtime: vi.fn(() => 0),
  findAlpFiles: vi.fn(() => []),
}));

import { callTool } from '../../src/tools/workspace-tools';
import { loadWorkspace } from '../../src/workspace';

const mockLoadWorkspace = loadWorkspace as ReturnType<typeof vi.fn>;
const MOCK_CWD = '/tmp/test-alp';

beforeEach(() => {
  vi.clearAllMocks();
  mockLoadWorkspace.mockReturnValue([
    { _type: 'task', id: 'task-1', status: '[ ]', description: 'Test task' },
    { _type: 'task', id: 'task-2', status: '[x]', description: 'Done task' },
    { _type: 'agent', id: 'agent-1', status: '[~]', description: 'Test agent' },
  ]);
});

describe('workspace-tools', () => {
  it('alp_list_objects returns objects from a mocked workspace directory', () => {
    const result = callTool('alp_list_objects', {}, MOCK_CWD);
    expect(result.isError).toBeFalsy();
    const parsed = JSON.parse(result.content[0].text);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed.length).toBe(3);
    expect(parsed[0]).toEqual({ type: 'task', id: 'task-1' });
  });

  it('alp_get_status returns status counts correctly', () => {
    const result = callTool('alp_get_status', {}, MOCK_CWD);
    expect(result.isError).toBeFalsy();
    const parsed = JSON.parse(result.content[0].text);
    expect(parsed.total_objects).toBe(3);
    expect(parsed.status).toEqual({
      done: 1,
      in_progress: 1,
      todo: 1,
      blocked: 0,
    });
  });

  it('alp_search filters by type and text', () => {
    const textResult = callTool('alp_search', { query: 'Done' }, MOCK_CWD);
    expect(textResult.isError).toBeFalsy();
    const textParsed = JSON.parse(textResult.content[0].text);
    expect(textParsed.length).toBe(1);
    expect(textParsed[0].id).toBe('task-2');

    const typeResult = callTool('alp_search', { query: '', type: 'agent' }, MOCK_CWD);
    const typeParsed = JSON.parse(typeResult.content[0].text);
    expect(typeParsed.length).toBe(1);
    expect(typeParsed[0].id).toBe('agent-1');
  });
});
