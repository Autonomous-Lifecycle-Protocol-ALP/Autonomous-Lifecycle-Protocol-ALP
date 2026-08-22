import { describe, it, expect } from 'vitest';
import { startServer, callTool } from './helpers';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

const MULTIMODAL_EXAMPLE = path.resolve(process.cwd(), 'examples/multimodal-vla');
const SYNAPSE_EXAMPLE = path.resolve(process.cwd(), 'examples/synapse-mesh');

describe('mcp-server multimodal & synapse tools', () => {
  it('alp_multimodal_inspect returns multimodal, action spaces, and vision models', async () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'alp-mcp-multimodal-'));
    try {
      fs.cpSync(MULTIMODAL_EXAMPLE, tmp, { recursive: true });

      const { proc, pending } = startServer(tmp);
      const send = (obj: unknown) => proc.stdin.write(JSON.stringify(obj) + '\n');
      send({ jsonrpc: '2.0', id: 0, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 't', version: '0' } } });

      const res = await callTool(proc, pending, 'alp_multimodal_inspect', {});
      expect(res.result.isError).toBeFalsy();
      const text = res.result.content[0].text;
      expect(text).toContain('MULTI-MODAL & VLA INSPECTION');
      expect(text).toContain('[MULTIMODAL SPECS]');
      expect(text).toContain('[ACTION SPACES]');
      expect(text).toContain('[VISION MODELS]');

      proc.kill();
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

  it('alp_multimodal_validate returns valid specs', async () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'alp-mcp-mm-validate-'));
    try {
      fs.cpSync(MULTIMODAL_EXAMPLE, tmp, { recursive: true });

      const { proc, pending } = startServer(tmp);
      const send = (obj: unknown) => proc.stdin.write(JSON.stringify(obj) + '\n');
      send({ jsonrpc: '2.0', id: 0, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 't', version: '0' } } });

      const res = await callTool(proc, pending, 'alp_multimodal_validate', {});
      expect(res.result.isError).toBeFalsy();
      const text = res.result.content[0].text;
      expect(text).toContain('All multimodal specs are valid');

      proc.kill();
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

  it('alp_action_space_check reports action counts and safety status', async () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'alp-mcp-action-space-'));
    try {
      fs.cpSync(MULTIMODAL_EXAMPLE, tmp, { recursive: true });

      const { proc, pending } = startServer(tmp);
      const send = (obj: unknown) => proc.stdin.write(JSON.stringify(obj) + '\n');
      send({ jsonrpc: '2.0', id: 0, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 't', version: '0' } } });

      const res = await callTool(proc, pending, 'alp_action_space_check', {});
      expect(res.result.isError).toBeFalsy();
      const text = res.result.content[0].text;
      expect(text).toContain('ACTION SPACE');
      expect(text).toContain('as-warehouse-robot');

      proc.kill();
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

  it('alp_token_cost returns token estimates', async () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'alp-mcp-token-cost-'));
    try {
      fs.cpSync(MULTIMODAL_EXAMPLE, tmp, { recursive: true });

      const { proc, pending } = startServer(tmp);
      const send = (obj: unknown) => proc.stdin.write(JSON.stringify(obj) + '\n');
      send({ jsonrpc: '2.0', id: 0, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 't', version: '0' } } });

      const res = await callTool(proc, pending, 'alp_token_cost', {});
      expect(res.result.isError).toBeFalsy();
      const text = res.result.content[0].text;
      expect(text).toContain('TOKEN COST ESTIMATION');
      expect(text).toContain('mm-warehouse-inspection');

      proc.kill();
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

  it('alp_synapse_export writes vault files and canvas', async () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'alp-mcp-synapse-export-'));
    try {
      fs.cpSync(SYNAPSE_EXAMPLE, tmp, { recursive: true });

      const { proc, pending } = startServer(tmp);
      const send = (obj: unknown) => proc.stdin.write(JSON.stringify(obj) + '\n');
      send({ jsonrpc: '2.0', id: 0, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 't', version: '0' } } });

      const res = await callTool(proc, pending, 'alp_synapse_export', { out: '.synapse-test' });
      expect(res.result.isError).toBeFalsy();
      const text = res.result.content[0].text;
      expect(text).toContain('Exported');

      const synapseDir = path.join(tmp, '.synapse-test');
      expect(fs.existsSync(synapseDir)).toBe(true);
      expect(fs.existsSync(path.join(synapseDir, 'MOC.md'))).toBe(true);
      expect(fs.existsSync(path.join(synapseDir, 'synapse.canvas'))).toBe(true);

      proc.kill();
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

  it('alp_synapse_graph returns topology in default json format', async () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'alp-mcp-synapse-graph-'));
    try {
      fs.cpSync(SYNAPSE_EXAMPLE, tmp, { recursive: true });

      const { proc, pending } = startServer(tmp);
      const send = (obj: unknown) => proc.stdin.write(JSON.stringify(obj) + '\n');
      send({ jsonrpc: '2.0', id: 0, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 't', version: '0' } } });

      const res = await callTool(proc, pending, 'alp_synapse_graph', { format: 'json' });
      expect(res.result.isError).toBeFalsy();
      const graph = JSON.parse(res.result.content[0].text);
      expect(graph).toHaveProperty('nodes');
      expect(graph).toHaveProperty('edges');
      expect(graph).toHaveProperty('stats');
      expect(Array.isArray(graph.nodes)).toBe(true);

      proc.kill();
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

  it('alp_synapse_graph supports mermaid and dot formats', async () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'alp-mcp-synapse-mermaid-'));
    try {
      fs.cpSync(SYNAPSE_EXAMPLE, tmp, { recursive: true });

      const { proc, pending } = startServer(tmp);
      const send = (obj: unknown) => proc.stdin.write(JSON.stringify(obj) + '\n');
      send({ jsonrpc: '2.0', id: 0, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 't', version: '0' } } });

      const mermaidRes = await callTool(proc, pending, 'alp_synapse_graph', { format: 'mermaid' });
      expect(mermaidRes.result.isError).toBeFalsy();
      expect(mermaidRes.result.content[0].text).toContain('flowchart LR');

      const dotRes = await callTool(proc, pending, 'alp_synapse_graph', { format: 'dot' });
      expect(dotRes.result.isError).toBeFalsy();
      expect(dotRes.result.content[0].text).toContain('digraph SynapseGraph');

      proc.kill();
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

  it('alp_synapse_stats returns connectivity metrics', async () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'alp-mcp-synapse-stats-'));
    try {
      fs.cpSync(SYNAPSE_EXAMPLE, tmp, { recursive: true });

      const { proc, pending } = startServer(tmp);
      const send = (obj: unknown) => proc.stdin.write(JSON.stringify(obj) + '\n');
      send({ jsonrpc: '2.0', id: 0, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 't', version: '0' } } });

      const res = await callTool(proc, pending, 'alp_synapse_stats', {});
      expect(res.result.isError).toBeFalsy();
      const stats = JSON.parse(res.result.content[0].text);
      expect(stats).toHaveProperty('totalNodes');
      expect(stats).toHaveProperty('totalEdges');
      expect(stats).toHaveProperty('density');
      expect(stats).toHaveProperty('centralHubs');
      expect(stats).toHaveProperty('orphanNodes');
      expect(stats).toHaveProperty('brokenLinks');
      expect(stats).toHaveProperty('byTypeCount');
      expect(typeof stats.totalNodes).toBe('number');
      expect(stats.totalNodes).toBeGreaterThan(0);

      proc.kill();
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
