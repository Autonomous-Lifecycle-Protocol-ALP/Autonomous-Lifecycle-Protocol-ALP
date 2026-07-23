import { describe, it, expect } from 'vitest';
import { startServer, callTool } from './helpers';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

const EXAMPLE = path.resolve(process.cwd(), 'examples/todo-app');

describe('mcp-server query tools', () => {
  it('alp_get_contracts returns contract objects with allow/deny rules', async () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'alp-mcp-contracts-'));
    try {
      fs.cpSync(EXAMPLE, tmp, { recursive: true });

      const { proc, pending } = startServer(tmp);

      const send = (obj: unknown) => proc.stdin.write(JSON.stringify(obj) + '\n');
      send({ jsonrpc: '2.0', id: 0, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 't', version: '0' } } });

      const res = await callTool(proc, pending, 'alp_get_contracts', {});
      expect(res.result.isError).toBeFalsy();
      const contracts = JSON.parse(res.result.content[0].text);
      expect(Array.isArray(contracts)).toBe(true);
      expect(contracts.length).toBeGreaterThanOrEqual(1);
      const first = contracts[0];
      expect(first).toHaveProperty('id');
      expect(first).toHaveProperty('from');
      expect(first).toHaveProperty('to');
      expect(first).toHaveProperty('allows');
      expect(first).toHaveProperty('denies');
      expect(first).toHaveProperty('on_violation');
      expect(first.id).toBe('contract-api-boundary');
      expect(first.from).toBe('-> agent-frontend');
      expect(first.to).toBe('-> agent-backend');
      expect(first.allows).toEqual(['api.v1.tasks.read', 'api.v1.tasks.write']);
      expect(first.denies).toEqual(['api.v1.admin.*']);

      const filtered = await callTool(proc, pending, 'alp_get_contracts', { id: 'contract-api-boundary' });
      expect(filtered.result.isError).toBeFalsy();
      const list = JSON.parse(filtered.result.content[0].text);
      expect(list.length).toBe(1);
      expect(list[0].id).toBe('contract-api-boundary');

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

  it('alp_get_vaults returns vault objects with recipients and algorithm defaults', async () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'alp-mcp-vaults-'));
    try {
      fs.cpSync(EXAMPLE, tmp, { recursive: true });

      const { proc, pending } = startServer(tmp);

      const send = (obj: unknown) => proc.stdin.write(JSON.stringify(obj) + '\n');
      send({ jsonrpc: '2.0', id: 0, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 't', version: '0' } } });

      const res = await callTool(proc, pending, 'alp_get_vaults', {});
      expect(res.result.isError).toBeFalsy();
      const vaults = JSON.parse(res.result.content[0].text);
      expect(Array.isArray(vaults)).toBe(true);
      expect(vaults.length).toBeGreaterThanOrEqual(1);
      const first = vaults[0];
      expect(first).toHaveProperty('id');
      expect(first).toHaveProperty('algorithm');
      expect(first).toHaveProperty('recipients');
      expect(first.id).toBe('vault-prod-secrets');
      expect(first.algorithm).toBe('X25519+AES-256-GCM');
      expect(first.recipients.length).toBe(1);
      expect(first.recipients[0]).toHaveProperty('id');
      expect(first.recipients[0]).toHaveProperty('algorithm');

      const filtered = await callTool(proc, pending, 'alp_get_vaults', { id: 'vault-prod-secrets' });
      expect(filtered.result.isError).toBeFalsy();
      const list = JSON.parse(filtered.result.content[0].text);
      expect(list.length).toBe(1);
      expect(list[0].id).toBe('vault-prod-secrets');

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

  it('alp_get_swarm_marketplace returns listings from flat @swarm_marketplace objects with optional category filter', async () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'alp-mcp-marketplace-'));
    try {
      fs.cpSync(EXAMPLE, tmp, { recursive: true });

      fs.mkdirSync(path.join(tmp, '.alp'), { recursive: true });
      fs.writeFileSync(
        path.join(tmp, '.alp', 'marketplace.alp'),
        `!alp-version: 3.1.0\n\n` +
        `@swarm_marketplace\n` +
        `  id: listing-testing\n` +
        `  provider_agent: -> agent-qa\n` +
        `  skill_name: pytest-runner\n` +
        `  category: testing\n` +
        `  cost_per_call: 0.05\n` +
        `  rating: 4.8\n` +
        `  total_invocations: 1200\n` +
        `  description: "Run pytest suites in isolated env"\n` +
        `\n` +
        `---\n\n` +
        `@swarm_marketplace\n` +
        `  id: listing-deploy\n` +
        `  provider_agent: -> agent-devops\n` +
        `  skill_name: deploy-helm\n` +
        `  category: deployment\n` +
        `  cost_per_call: 0.10\n` +
        `  rating: 4.5\n` +
        `  total_invocations: 340\n` +
        `  description: "Deploy Helm charts to Kubernetes"\n`,
      );

      const { proc, pending } = startServer(tmp);

      const send = (obj: unknown) => proc.stdin.write(JSON.stringify(obj) + '\n');
      send({ jsonrpc: '2.0', id: 0, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 't', version: '0' } } });

      const res = await callTool(proc, pending, 'alp_get_swarm_marketplace', {});
      expect(res.result.isError).toBeFalsy();
      const listings = JSON.parse(res.result.content[0].text);
      expect(Array.isArray(listings)).toBe(true);
      expect(listings.length).toBe(2);
      const testing = listings.find((l: any) => l.id === 'listing-testing');
      expect(testing).toBeDefined();
      expect(testing.category).toBe('testing');
      expect(testing.providerAgent).toBe('-> agent-qa');
      expect(testing.costPerCall).toBe(0.05);

      const filtered = await callTool(proc, pending, 'alp_get_swarm_marketplace', { category: 'deployment' });
      expect(filtered.result.isError).toBeFalsy();
      const sub = JSON.parse(filtered.result.content[0].text);
      expect(sub.length).toBe(1);
      expect(sub[0].id).toBe('listing-deploy');
      expect(sub[0].category).toBe('deployment');

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

  it('alp_get_event_mesh returns subscriptions and no events when none declared', async () => {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'alp-mcp-eventmesh-'));
    try {
      fs.cpSync(EXAMPLE, tmp, { recursive: true });

      fs.writeFileSync(
        path.join(tmp, '.alp', 'events.alp'),
        `!alp-version: 3.1.0\n\n` +
        `@event_mesh\n` +
        `  id: mesh-main\n` +
        `  subscriptions:\n` +
        `    - "task.status"\n` +
        `    - "agent.join"\n`,
      );

      const { proc, pending } = startServer(tmp);

      const send = (obj: unknown) => proc.stdin.write(JSON.stringify(obj) + '\n');
      send({ jsonrpc: '2.0', id: 0, method: 'initialize', params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 't', version: '0' } } });

      const res = await callTool(proc, pending, 'alp_get_event_mesh', {});
      expect(res.result.isError).toBeFalsy();
      const meshes = JSON.parse(res.result.content[0].text);
      expect(Array.isArray(meshes)).toBe(true);
      expect(meshes.length).toBe(1);
      expect(meshes[0].id).toBe('mesh-main');
      expect(meshes[0].subscriptions).toEqual(['task.status', 'agent.join']);
      expect(meshes[0].events).toEqual([]);

      const filtered = await callTool(proc, pending, 'alp_get_event_mesh', { topic: 'task.status' });
      expect(filtered.result.isError).toBeFalsy();
      const topicEvents = JSON.parse(filtered.result.content[0].text);
      expect(topicEvents[0].events).toEqual([]);

      const limited = await callTool(proc, pending, 'alp_get_event_mesh', { limit: 1 });
      expect(limited.result.isError).toBeFalsy();
      const limitedEvents = JSON.parse(limited.result.content[0].text);
      expect(limitedEvents[0].events).toEqual([]);

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
