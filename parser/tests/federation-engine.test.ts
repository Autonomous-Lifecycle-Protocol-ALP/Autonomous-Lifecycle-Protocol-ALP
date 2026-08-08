import { describe, it, expect } from 'vitest';
import { SwarmFederationMesh, MeshSelfHealingEngine } from '../src/federation-engine';

describe('SwarmFederationMesh & SelfHealingEngine (v83.0.0)', () => {
  it('registers swarm nodes and elects leader based on capacity', () => {
    const mesh = new SwarmFederationMesh();
    mesh.registerNode({
      nodeId: 'node-us-east',
      cluster: 'us-east-1',
      status: 'ONLINE',
      workloadCapacity: 100,
      activeTasks: 20,
      latencyMs: 12,
      lastHeartbeat: new Date().toISOString(),
    });
    mesh.registerNode({
      nodeId: 'node-eu-west',
      cluster: 'eu-west-1',
      status: 'ONLINE',
      workloadCapacity: 100,
      activeTasks: 5,
      latencyMs: 34,
      lastHeartbeat: new Date().toISOString(),
    });

    expect(mesh.getActiveNodes().length).toBe(2);
    const leader = mesh.electLeader();
    expect(leader?.nodeId).toBe('node-eu-west'); // Node with highest remaining capacity
    expect(mesh.computeMeshDigest()).toHaveLength(64);
  });

  it('analyzes error trace and generates self-healing diagnostic patch', () => {
    const healing = new MeshSelfHealingEngine();
    const diag = healing.analyzeErrorTrace('anom-101', 'node-us-east', 'Error: ECONNREFUSED endpoint unreachable');

    expect(diag.anomalyId).toBe('anom-101');
    expect(diag.rootCause).toContain('Network partition');
    expect(diag.autoRemediated).toBe(true);
    expect(healing.getDiagnostics().length).toBe(1);
  });
});
