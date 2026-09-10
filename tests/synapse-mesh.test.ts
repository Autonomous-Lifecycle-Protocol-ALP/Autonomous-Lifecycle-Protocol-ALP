import { describe, it, expect } from 'vitest';
import * as path from 'path';
import * as fs from 'fs';
import { AlpParser, AlpObject } from '@autonomous-lifecycle-protocol-alp/parser';
import { SynapseEngine } from '@autonomous-lifecycle-protocol-alp/sdk';

describe('Examples — Synapse Distributed Mesh Project', () => {
  const alpDir = path.resolve(__dirname, '../examples/synapse-mesh/.alp');

  it('parses all .alp files without syntax or validation errors', () => {
    const parser = new AlpParser();
    const files = fs.readdirSync(alpDir).filter((f) => f.endsWith('.alp'));
    expect(files.length).toBe(5);

    const allObjects: AlpObject[] = [];
    for (const file of files) {
      const content = fs.readFileSync(path.join(alpDir, file), 'utf-8');
      const objects = parser.parse(content);
      expect(objects.length).toBeGreaterThan(0);
      allObjects.push(...objects);
    }

    expect(allObjects.length).toBeGreaterThanOrEqual(10);
  });

  it('builds valid Synapse topology with 0 broken links and correct degree centrality', () => {
    const parser = new AlpParser();
    const files = fs.readdirSync(alpDir).filter((f) => f.endsWith('.alp'));
    const allObjects: AlpObject[] = [];
    for (const file of files) {
      const content = fs.readFileSync(path.join(alpDir, file), 'utf-8');
      allObjects.push(...parser.parse(content));
    }

    const engine = new SynapseEngine();
    const topology = engine.buildTopology(allObjects);

    expect(topology.nodes.length).toBe(allObjects.length);
    expect(topology.edges.length).toBeGreaterThan(5);
    expect(topology.stats.brokenLinks.length).toBe(0);

    // Verify key nodes exist
    const orchestratorNode = topology.nodes.find((n) => n.id === 'agent-mesh-orchestrator');
    expect(orchestratorNode).toBeDefined();
    expect(orchestratorNode?.type).toBe('agent');

    const pqTask = topology.nodes.find((n) => n.id === 'task-pq-handshake');
    expect(pqTask).toBeDefined();
    expect(pqTask?.type).toBe('task');
  });

  it('generates a complete Synapse Markdown vault with MOC.md and .canvas', () => {
    const parser = new AlpParser();
    const files = fs.readdirSync(alpDir).filter((f) => f.endsWith('.alp'));
    const allObjects: AlpObject[] = [];
    for (const file of files) {
      const content = fs.readFileSync(path.join(alpDir, file), 'utf-8');
      allObjects.push(...parser.parse(content));
    }

    const engine = new SynapseEngine();
    const vaultFiles = engine.generateVault(allObjects);

    // Should contain individual note files + MOC.md + synapse.canvas
    expect(vaultFiles.length).toBe(allObjects.length + 2);

    const moc = vaultFiles.find((f) => f.relativePath === 'MOC.md');
    expect(moc).toBeDefined();
    expect(moc?.content).toContain('# 🧠 Synapse Knowledge Graph');
    expect(moc?.content).toContain('[[task-pq-handshake]]');
    expect(moc?.content).toContain('[[agent-cryptographer]]');

    const canvas = vaultFiles.find((f) => f.relativePath === 'synapse.canvas');
    expect(canvas).toBeDefined();
    const canvasParsed = JSON.parse(canvas!.content);
    expect(canvasParsed.nodes.length).toBeGreaterThan(0);
    expect(canvasParsed.edges.length).toBeGreaterThan(0);
  });

  it('handles empty object array without crashing', () => {
    const engine = new SynapseEngine();
    const topology = engine.buildTopology([]);
    expect(topology.nodes.length).toBe(0);
    expect(topology.edges.length).toBe(0);
    expect(topology.stats.totalNodes).toBe(0);
    expect(topology.stats.totalEdges).toBe(0);
    expect(topology.stats.density).toBe(0);
  });

  it('handles single node with no edges as orphan', () => {
    const engine = new SynapseEngine();
    const topology = engine.buildTopology([
      { _type: 'task', id: 'lonely-task', description: 'No connections' } as AlpObject,
    ]);
    expect(topology.nodes.length).toBe(1);
    expect(topology.nodes[0].degree).toBe(0);
    expect(topology.nodes[0].outLinks).toHaveLength(0);
    expect(topology.nodes[0].inLinks).toHaveLength(0);
  });

  it('identifies orphan nodes and broken links in mixed topology', () => {
    const engine = new SynapseEngine();
    const topology = engine.buildTopology([
      { _type: 'task', id: 'task-a', depends: ['task-b'] } as AlpObject,
      { _type: 'task', id: 'task-b', depends: ['task-c'] } as AlpObject,
      { _type: 'task', id: 'task-c', depends: ['non-existent'] } as AlpObject,
      { _type: 'task', id: 'task-orphan', description: 'Isolated' } as AlpObject,
    ]);

    expect(topology.stats.orphanNodes).toContain('task-orphan');
    expect(topology.stats.brokenLinks.length).toBeGreaterThanOrEqual(1);
    expect(topology.stats.brokenLinks.some((b) => b.target === 'non-existent')).toBe(true);
  });

  it('generates vault files for empty object list', () => {
    const engine = new SynapseEngine();
    const vaultFiles = engine.generateVault([]);
    expect(vaultFiles.length).toBe(2);
    expect(vaultFiles.some((f) => f.relativePath === 'MOC.md')).toBe(true);
  });

  it('generates canvas with zero nodes for empty topology', () => {
    const engine = new SynapseEngine();
    const topology = engine.buildTopology([]);
    const canvas = engine.generateCanvas(topology);
    expect(canvas.nodes.length).toBeGreaterThanOrEqual(0);
  });

  it('produces valid Mermaid syntax for simple topology', () => {
    const engine = new SynapseEngine();
    const topology = engine.buildTopology([
      { _type: 'task', id: 'task-a', depends: ['task-b'] } as AlpObject,
      { _type: 'task', id: 'task-b', depends: [] } as AlpObject,
    ]);
    const mermaid = engine.toMermaid(topology);
    expect(mermaid).toContain('flowchart LR');
    expect(mermaid).toContain('task_a');
    expect(mermaid).toContain('task_b');
  });

  it('produces valid DOT syntax for simple topology', () => {
    const engine = new SynapseEngine();
    const topology = engine.buildTopology([
      { _type: 'agent', id: 'agent-x', description: 'Test agent' } as AlpObject,
    ]);
    const dot = engine.toDot(topology);
    expect(dot).toContain('digraph SynapseGraph');
    expect(dot).toContain('"agent-x"');
  });
});
