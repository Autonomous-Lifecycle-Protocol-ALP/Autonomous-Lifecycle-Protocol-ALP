import { describe, it, expect } from 'vitest';
import { SwarmSelfHealingMesh } from '../src/swarm-self-healing-mesh';

describe('v60.0.0 SwarmSelfHealingMesh — Autonomous Swarm Self-Healing Mesh', () => {
  it('registers swarm nodes and detects node failures', () => {
    const mesh = new SwarmSelfHealingMesh();
    mesh.registerNode('node-us-east-1', 'us-east', 'HEALTHY', ['task-1']);
    mesh.registerNode('node-eu-west-1', 'eu-west', 'FAILED', ['task-2', 'task-3']);

    const failures = mesh.detectFailures();
    expect(failures.length).toBe(1);
    expect(failures[0].nodeId).toBe('node-eu-west-1');
  });

  it('synthesizes a self-healing action plan and reroutes tasks from failed nodes', () => {
    const mesh = new SwarmSelfHealingMesh();
    mesh.registerNode('node-healthy-1', 'us-east', 'HEALTHY', ['task-1']);
    mesh.registerNode('node-failed-1', 'eu-west', 'FAILED', ['task-auth', 'task-db']);

    const plan = mesh.generateSelfHealingPlan();

    expect(plan.failedNodes).toContain('node-failed-1');
    expect(plan.healthyNodes).toContain('node-healthy-1');
    expect(plan.taskReroutes.length).toBe(2);
    expect(plan.taskReroutes[0].toNode).toBe('node-healthy-1');

    const healthyNode = mesh.getNode('node-healthy-1');
    expect(healthyNode?.activeTasks).toContain('task-auth');
    expect(healthyNode?.activeTasks).toContain('task-db');
  });
});
