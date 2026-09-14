import { describe, it, expect, vi } from 'vitest';
import { SynapseEngine } from '../src/synapse';

// Minimal AlpObject shape used by SynapseEngine
type AlpObject = {
  id: string;
  _type: string;
  status?: string;
  description?: string;
  title?: string;
  owner?: string;
  agent?: string;
  depends?: string | string[];
  deps?: string | string[];
  depends_on?: string | string[];
  policy?: string | string[];
  policies?: string | string[];
  guards?: string | string[];
  targets?: string | string[];
  contract?: string | string[];
  contracts?: string | string[];
  from?: string;
  to?: string;
  vault?: string | string[];
  vaults?: string | string[];
  recipients?: string | string[];
  feature?: string;
  steps?: string | string[];
  [key: string]: unknown;
};

function makeObject(overrides: Partial<AlpObject> = {}): AlpObject {
  return {
    id: 'obj-1',
    _type: 'task',
    status: '[ ]',
    description: 'A task',
    ...overrides,
  };
}

describe('SynapseEngine', () => {
  it('buildTopology creates nodes from objects', () => {
    const engine = new SynapseEngine();
    const objects = [makeObject({ id: 't1', _type: 'task' }), makeObject({ id: 'a1', _type: 'agent' })];
    const topo = engine.buildTopology(objects);
    expect(topo.nodes).toHaveLength(2);
    expect(topo.nodes.map(n => n.id).sort()).toEqual(['a1', 't1']);
  });

  it('assigns colors and groups by type', () => {
    const engine = new SynapseEngine();
    const objects = [makeObject({ id: 't1', _type: 'task' }), makeObject({ id: 'p1', _type: 'policy' })];
    const topo = engine.buildTopology(objects);
    const taskNode = topo.nodes.find(n => n.id === 't1')!;
    const policyNode = topo.nodes.find(n => n.id === 'p1')!;
    expect(taskNode.color).toBe('#3b82f6');
    expect(taskNode.group).toBe(2);
    expect(policyNode.color).toBe('#ef4444');
    expect(policyNode.group).toBe(3);
  });

  it('extracts depends_on edges', () => {
    const engine = new SynapseEngine();
    const objects = [
      makeObject({ id: 't1', _type: 'task', depends: ['t2'] }),
      makeObject({ id: 't2', _type: 'task' }),
    ];
    const topo = engine.buildTopology(objects);
    expect(topo.edges).toHaveLength(1);
    expect(topo.edges[0]).toEqual({ source: 't1', target: 't2', label: 'depends on', relation: 'depends_on' });
  });

  it('extracts assigned_to edges', () => {
    const engine = new SynapseEngine();
    const objects = [
      makeObject({ id: 't1', _type: 'task', owner: 'a1' }),
      makeObject({ id: 'a1', _type: 'agent' }),
    ];
    const topo = engine.buildTopology(objects);
    expect(topo.edges).toHaveLength(1);
    expect(topo.edges[0]).toEqual({ source: 'a1', target: 't1', label: 'executes', relation: 'assigned_to' });
  });

  it('extracts guards edges for policies', () => {
    const engine = new SynapseEngine();
    const objects = [
      makeObject({ id: 'p1', _type: 'policy', guards: ['t1'] }),
      makeObject({ id: 't1', _type: 'task' }),
    ];
    const topo = engine.buildTopology(objects);
    expect(topo.edges).toHaveLength(1);
    expect(topo.edges[0]).toEqual({ source: 'p1', target: 't1', label: 'guards', relation: 'guards' });
  });

  it('extracts implements edges for contracts', () => {
    const engine = new SynapseEngine();
    const objects = [
      makeObject({ id: 'c1', _type: 'contract', from: 'a1', to: 't1' }),
      makeObject({ id: 'a1', _type: 'agent' }),
      makeObject({ id: 't1', _type: 'task' }),
    ];
    const topo = engine.buildTopology(objects);
    expect(topo.edges).toHaveLength(2);
    const relations = topo.edges.map(e => e.relation).sort();
    expect(relations).toEqual(['implements', 'references']);
  });

  it('detects broken links', () => {
    const engine = new SynapseEngine();
    const objects = [
      makeObject({ id: 't1', _type: 'task', depends: ['missing'] }),
    ];
    const topo = engine.buildTopology(objects);
    expect(topo.stats.brokenLinks).toHaveLength(1);
    expect(topo.stats.brokenLinks[0]).toEqual({ source: 't1', target: 'missing' });
  });

  it('prevents duplicate edges', () => {
    const engine = new SynapseEngine();
    const objects = [
      makeObject({ id: 't1', _type: 'task', depends: ['t2', 't2'] }),
      makeObject({ id: 't2', _type: 'task' }),
    ];
    const topo = engine.buildTopology(objects);
    expect(topo.edges).toHaveLength(1);
  });

  it('computes degree centrality', () => {
    const engine = new SynapseEngine();
    const objects = [
      makeObject({ id: 't1', _type: 'task', depends: ['t2'] }),
      makeObject({ id: 't2', _type: 'task' }),
    ];
    const topo = engine.buildTopology(objects);
    const t1 = topo.nodes.find(n => n.id === 't1')!;
    const t2 = topo.nodes.find(n => n.id === 't2')!;
    expect(t1.degree).toBe(1); // outLink
    expect(t2.degree).toBe(1); // inLink
  });

  it('computes stats', () => {
    const engine = new SynapseEngine();
    const objects = [
      makeObject({ id: 't1', _type: 'task', status: '[ ]' }),
      makeObject({ id: 't2', _type: 'task', status: '[x]' }),
      makeObject({ id: 'a1', _type: 'agent', status: undefined }),
    ];
    const topo = engine.buildTopology(objects);
    expect(topo.stats.totalNodes).toBe(3);
    expect(topo.stats.totalEdges).toBe(0);
    expect(topo.stats.byTypeCount).toEqual({ task: 2, agent: 1 });
    expect(topo.stats.byStatusCount).toEqual({ '[ ]': 1, '[x]': 1 });
  });

  it('generateVault creates markdown notes', () => {
    const engine = new SynapseEngine();
    const objects = [makeObject({ id: 't1', _type: 'task', description: 'Do work' })];
    const files = engine.generateVault(objects);
    expect(files.length).toBeGreaterThan(0);
    const note = files.find(f => f.relativePath.includes('t1'));
    expect(note).toBeDefined();
    expect(note!.content).toContain('Do work');
  });

  it('generateCanvas creates nodes and edges from topology', () => {
    const engine = new SynapseEngine();
    const objects = [
      makeObject({ id: 't1', _type: 'task' }),
      makeObject({ id: 't2', _type: 'task', depends: ['t1'] }),
    ];
    const topology = engine.buildTopology(objects);
    const canvas = engine.generateCanvas(topology);
    expect(canvas.nodes.length).toBeGreaterThan(0);
    expect(canvas.edges.length).toBeGreaterThan(0);
  });

  it('toMermaid generates valid mermaid syntax', () => {
    const engine = new SynapseEngine();
    const objects = [makeObject({ id: 't1', _type: 'task' })];
    const topology = engine.buildTopology(objects);
    const mermaid = engine.toMermaid(topology);
    expect(mermaid).toContain('flowchart LR');
    expect(mermaid).toContain('t1');
  });

  it('toDot generates valid dot syntax', () => {
    const engine = new SynapseEngine();
    const objects = [makeObject({ id: 't1', _type: 'task' })];
    const topology = engine.buildTopology(objects);
    const dot = engine.toDot(topology);
    expect(dot).toContain('digraph');
    expect(dot).toContain('t1');
  });
});
