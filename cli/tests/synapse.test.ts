import { describe, it, expect } from 'vitest';
import { SynapseEngine } from '@autonomous-lifecycle-protocol-alp/sdk';
import { AlpObject } from '@autonomous-lifecycle-protocol-alp/parser';

describe('SynapseEngine — Knowledge Graph & Canvas Vault', () => {
  const sampleObjects: AlpObject[] = [
    {
      _type: 'task',
      id: 'task-auth',
      status: '[~]',
      description: 'Implement OAuth2 auth flow',
      owner: 'agent-security',
      depends: ['task-db-schema', 'contract-jwt'],
    } as any,
    {
      _type: 'task',
      id: 'task-db-schema',
      status: '[x]',
      description: 'Create user tables in SQLite',
      owner: 'agent-db',
    } as any,
    {
      _type: 'contract',
      id: 'contract-jwt',
      status: 'active',
      description: 'JWT token schema definition',
    } as any,
    {
      _type: 'agent',
      id: 'agent-security',
      description: 'Security & Auth specialist agent',
    } as any,
    {
      _type: 'agent',
      id: 'agent-db',
      description: 'Database schema specialist agent',
    } as any,
    {
      _type: 'policy',
      id: 'policy-zero-trust',
      description: 'Enforce zero-trust architecture',
      guards: ['task-auth'],
    } as any,
  ];

  it('builds topology with nodes, edges, and degree centrality', () => {
    const engine = new SynapseEngine();
    const topology = engine.buildTopology(sampleObjects);

    expect(topology.nodes.length).toBe(6);
    expect(topology.edges.length).toBeGreaterThan(0);

    // Verify task-auth node properties
    const authNode = topology.nodes.find((n) => n.id === 'task-auth');
    expect(authNode).toBeDefined();
    expect(authNode?.type).toBe('task');
    expect(authNode?.outLinks).toContain('task-db-schema');
    expect(authNode?.outLinks).toContain('contract-jwt');
    expect(authNode?.inLinks).toContain('agent-security');
    expect(authNode?.inLinks).toContain('policy-zero-trust');
    expect(authNode?.degree).toBe(4);

    // Verify statistics
    expect(topology.stats.totalNodes).toBe(6);
    expect(topology.stats.byTypeCount['task']).toBe(2);
    expect(topology.stats.byTypeCount['agent']).toBe(2);
    expect(topology.stats.byTypeCount['policy']).toBe(1);
    expect(topology.stats.byTypeCount['contract']).toBe(1);
  });

  it('generates a complete Synapse Markdown Vault with wikilinks and MOC', () => {
    const engine = new SynapseEngine();
    const files = engine.generateVault(sampleObjects);

    // Should have 6 notes + MOC.md + synapse.canvas = 8 files
    expect(files.length).toBe(8);

    const mocFile = files.find((f) => f.relativePath === 'MOC.md');
    expect(mocFile).toBeDefined();
    expect(mocFile?.content).toContain('# 🧠 Synapse Knowledge Graph');
    expect(mocFile?.content).toContain('[[task-auth]]');
    expect(mocFile?.content).toContain('[[agent-security]]');

    const authFile = files.find((f) => f.relativePath === 'tasks/task-auth.md');
    expect(authFile).toBeDefined();
    expect(authFile?.content).toContain('id: "task-auth"');
    expect(authFile?.content).toContain('[[task-db-schema]]');
    expect(authFile?.content).toContain('[[contract-jwt]]');
    expect(authFile?.content).toContain('[[agent-security]]');
    expect(authFile?.content).toContain('```mermaid');
  });

  it('generates an interactive visual JSON Canvas (.canvas)', () => {
    const engine = new SynapseEngine();
    const topology = engine.buildTopology(sampleObjects);
    const canvas = engine.generateCanvas(topology);

    expect(canvas.nodes.length).toBeGreaterThan(sampleObjects.length); // Includes group nodes
    expect(canvas.edges.length).toBe(topology.edges.length);

    // Group containers should exist
    const taskGroup = canvas.nodes.find((n) => n.id === 'group-task');
    expect(taskGroup).toBeDefined();
    expect(taskGroup?.type).toBe('group');

    // Individual node cards
    const authCard = canvas.nodes.find((n) => n.id === 'task-auth');
    expect(authCard).toBeDefined();
    expect(authCard?.type).toBe('text');
    expect(authCard?.text).toContain('task-auth');
  });

  it('generates Mermaid and Graphviz DOT formats', () => {
    const engine = new SynapseEngine();
    const topology = engine.buildTopology(sampleObjects);

    const mermaid = engine.toMermaid(topology);
    expect(mermaid).toContain('flowchart LR');
    expect(mermaid).toContain('task_auth');

    const dot = engine.toDot(topology);
    expect(dot).toContain('digraph SynapseGraph');
    expect(dot).toContain('"task-auth"');
  });

  it('identifies broken links and orphan nodes', () => {
    const brokenObjects: AlpObject[] = [
      {
        _type: 'task',
        id: 'task-isolated',
        description: 'Isolated task with no edges',
      } as any,
      {
        _type: 'task',
        id: 'task-broken',
        depends: ['non-existent-task-123'],
      } as any,
    ];

    const engine = new SynapseEngine();
    const topology = engine.buildTopology(brokenObjects);

    expect(topology.stats.orphanNodes).toContain('task-isolated');
    expect(topology.stats.brokenLinks.length).toBe(1);
    expect(topology.stats.brokenLinks[0].target).toBe('non-existent-task-123');
  });

  it('handles empty objects array without crashing', () => {
    const engine = new SynapseEngine();
    const topology = engine.buildTopology([]);
    expect(topology.nodes.length).toBe(0);
    expect(topology.edges.length).toBe(0);
    expect(topology.stats.density).toBe(0);
  });

  it('generates vault files for empty object list', () => {
    const engine = new SynapseEngine();
    const vaultFiles = engine.generateVault([]);
    expect(vaultFiles.length).toBe(2);
    expect(vaultFiles.some((f) => f.relativePath === 'MOC.md')).toBe(true);
  });

  it('generates canvas for empty topology', () => {
    const engine = new SynapseEngine();
    const topology = engine.buildTopology([]);
    const canvas = engine.generateCanvas(topology);
    expect(canvas.nodes.length).toBeGreaterThanOrEqual(0);
  });

  it('produces valid Mermaid output for single node', () => {
    const engine = new SynapseEngine();
    const topology = engine.buildTopology([
      { _type: 'task', id: 'solo', description: 'Alone' } as any,
    ]);
    const mermaid = engine.toMermaid(topology);
    expect(mermaid).toContain('flowchart LR');
    expect(mermaid).toContain('solo');
  });

  it('produces valid DOT output for empty graph', () => {
    const engine = new SynapseEngine();
    const topology = engine.buildTopology([]);
    const dot = engine.toDot(topology);
    expect(dot).toContain('digraph SynapseGraph');
  });
});
