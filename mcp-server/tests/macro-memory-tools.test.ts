import { describe, it, expect } from 'vitest';
import { startServer, callTool } from './helpers';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

describe('mcp-server macro & memory tools', () => {
  it('alp_get_macros lists @macro definitions from the workspace', async () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'alp-mcp-macros-'));
    try {
      fs.mkdirSync(path.join(tmp, '.alp'), { recursive: true });
      fs.writeFileSync(
        path.join(tmp, '.alp', 'macros.alp'),
        '!alp-version: 3.1.0\n\n' +
        '@macro\n' +
        '  id: demo-macro\n' +
        '  iterate_over: "[\"auth\", \"billing\"]"\n' +
        '  as: svc\n' +
        '  template:\n' +
        '    _type: task\n' +
        '    id: task-${svc}\n' +
        '    name: Deploy ${svc}\n',
      );

      const { proc, pending } = startServer(tmp);
      try {
        const res = await callTool(proc, pending, 'alp_get_macros', {});
        expect(res.result.isError).toBeFalsy();
        const macros = JSON.parse(res.result.content[0].text);
        expect(Array.isArray(macros)).toBe(true);
        expect(macros.length).toBe(1);
        expect(macros[0]).toHaveProperty('id', 'demo-macro');
        expect(macros[0]).toHaveProperty('iterate_over');
        expect(macros[0].as).toBe('svc');
      } finally {
        proc.kill();
      }
    } finally {
      for (let i = 0; i < 5; i++) {
        try {
          fs.rmSync(tmp, { recursive: true, force: true });
          break;
        } catch {
          await new Promise((r) => setTimeout(r, 200));
        }
      }
    }
  }, 25000);

  it('alp_expand_macro expands a macro definition by id', async () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'alp-mcp-expand-'));
    try {
      fs.mkdirSync(path.join(tmp, '.alp'), { recursive: true });
      fs.writeFileSync(
        path.join(tmp, '.alp', 'macros.alp'),
        '!alp-version: 3.1.0\n\n' +
        '@macro\n' +
        '  id: demo-macro\n' +
        '  iterate_over: "[\"auth\", \"billing\"]"\n' +
        '  as: svc\n' +
        '  template:\n' +
        '    _type: task\n' +
        '    id: task-${svc}\n' +
        '    name: Deploy ${svc}\n',
      );

      const { proc, pending } = startServer(tmp);
      try {
        const res = await callTool(proc, pending, 'alp_expand_macro', { id: 'demo-macro' });
        expect(res.result.isError).toBeFalsy();
        const expanded = JSON.parse(res.result.content[0].text);
        expect(Array.isArray(expanded)).toBe(true);
        expect(expanded.length).toBe(2);
        expect(expanded[0]).toHaveProperty('id', 'task-auth');
        expect(expanded[1]).toHaveProperty('id', 'task-billing');
      } finally {
        proc.kill();
      }
    } finally {
      for (let i = 0; i < 5; i++) {
        try {
          fs.rmSync(tmp, { recursive: true, force: true });
          break;
        } catch {
          await new Promise((r) => setTimeout(r, 200));
        }
      }
    }
  }, 25000);

  it('alp_memory_store and alp_memory_query store and retrieve memories', async () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'alp-mcp-memory-'));
    try {
      fs.mkdirSync(path.join(tmp, '.alp'), { recursive: true });

      const { proc, pending } = startServer(tmp);
      try {
        const store = await callTool(proc, pending, 'alp_memory_store', {
          id: 'mem-1',
          agentId: 'agent-tester',
          key: 'test-key',
          content: 'hello world',
          tags: ['test'],
        });
        expect(store.result.isError).toBeFalsy();
        const node = JSON.parse(store.result.content[0].text);
        expect(node).toHaveProperty('id', 'mem-1');
        expect(node).toHaveProperty('agentId', 'agent-tester');

        const query = await callTool(proc, pending, 'alp_memory_query', { query: 'hello' });
        expect(query.result.isError).toBeFalsy();
        const results = JSON.parse(query.result.content[0].text);
        expect(Array.isArray(results)).toBe(true);
        if (results.length > 0) {
          expect(results[0]).toHaveProperty('score');
          expect(results[0]).toHaveProperty('node');
        }
      } finally {
        proc.kill();
      }
    } finally {
      for (let i = 0; i < 5; i++) {
        try {
          fs.rmSync(tmp, { recursive: true, force: true });
          break;
        } catch {
          await new Promise((r) => setTimeout(r, 200));
        }
      }
    }
  }, 25000);

  it('alp_memory_stats returns mesh statistics', async () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'alp-mcp-stats-'));
    try {
      fs.mkdirSync(path.join(tmp, '.alp'), { recursive: true });

      const { proc, pending } = startServer(tmp);
      try {
        const res = await callTool(proc, pending, 'alp_memory_stats', {});
        expect(res.result.isError).toBeFalsy();
        const stats = JSON.parse(res.result.content[0].text);
        expect(stats).toHaveProperty('totalMemories');
        expect(stats).toHaveProperty('activeAgents');
        expect(typeof stats.totalMemories).toBe('number');
      } finally {
        proc.kill();
      }
    } finally {
      for (let i = 0; i < 5; i++) {
        try {
          fs.rmSync(tmp, { recursive: true, force: true });
          break;
        } catch {
          await new Promise((r) => setTimeout(r, 200));
        }
      }
    }
  }, 25000);
});
