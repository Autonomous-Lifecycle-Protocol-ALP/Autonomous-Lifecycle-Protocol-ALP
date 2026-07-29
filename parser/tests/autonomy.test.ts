import { describe, it, expect } from 'vitest';
import { AutonomyController, WorkflowMutator, AdaptiveEngine, EditProposal } from '../src/index';

describe('AutonomyController (v45.0.0)', () => {
  describe('startSwarm', () => {
    it('starts a swarm run with running status', () => {
      const controller = new AutonomyController();
      const workflow = { id: 'wf-1', type: 'workflow', steps: [] };
      const run = controller.startSwarm('wf-1', workflow);
      expect(run.swarm_id).toBe('wf-1');
      expect(run.status).toBe('running');
      expect(run.workflow).toEqual(workflow);
    });
  });

  describe('proposeMutation', () => {
    it('proposes a mutation for a running swarm', () => {
      const controller = new AutonomyController();
      const workflow = { id: 'wf-1', type: 'workflow', steps: [] };
      controller.startSwarm('wf-1', workflow);
      const proposal = controller.proposeMutation('wf-1', [{ op: 'update', target: 'status', value: '[x]' }], 'Mark complete');
      expect(proposal).toBeDefined();
      expect(proposal!.proposal_id).toContain('wf-1');
      expect(proposal!.status).toBe('pending');
    });

    it('returns undefined for a non-existent swarm', () => {
      const controller = new AutonomyController();
      const proposal = controller.proposeMutation('nonexistent', [{ op: 'update', target: 'status', value: '[x]' }], 'Mark complete');
      expect(proposal).toBeUndefined();
    });
  });

  describe('applyMutation', () => {
    it('applies a proposed mutation', () => {
      const controller = new AutonomyController();
      const workflow = { id: 'wf-1', type: 'workflow', steps: [] };
      controller.startSwarm('wf-1', workflow);
      const proposal = controller.proposeMutation('wf-1', [{ op: 'update', target: 'status', value: '[x]' }], 'Mark complete');
      const result = controller.applyMutation('wf-1', proposal!.proposal_id);
      expect(result).toBeDefined();
    });
  });

  describe('getDecisions', () => {
    it('returns decisions for a specific swarm', () => {
      const controller = new AutonomyController();
      const workflow = { id: 'wf-1', type: 'workflow', steps: [] };
      controller.startSwarm('wf-1', workflow);
      controller.proposeMutation('wf-1', [{ op: 'update', target: 'status', value: '[x]' }], 'Mark complete');
      const decisions = controller.getDecisions('wf-1');
      expect(decisions.length).toBeGreaterThan(0);
    });

    it('returns all decisions when no swarm ID is given', () => {
      const controller = new AutonomyController();
      const workflow = { id: 'wf-1', type: 'workflow', steps: [] };
      controller.startSwarm('wf-1', workflow);
      controller.proposeMutation('wf-1', [{ op: 'update', target: 'status', value: '[x]' }], 'Mark complete');
      const decisions = controller.getDecisions();
      expect(decisions.length).toBeGreaterThan(0);
    });
  });

  describe('observeSignal', () => {
    it('observes a signal and updates adaptive tuning', () => {
      const controller = new AutonomyController();
      controller.observeSignal('wf-1', { kind: 'latency', p99: 450 });
      const tuning = controller.adaptive.getTuning('retry.max_attempts');
      expect(tuning).toBeGreaterThanOrEqual(1);
    });
  });
});

describe('WorkflowMutator (v45.0.0)', () => {
  it('proposes an edit', () => {
    const mutator = new WorkflowMutator();
    const proposal = mutator.proposeEdit('wf-1', [{ op: 'update', target: 'status', value: '[x]' }], 'Auto-heal');
    expect(proposal.proposal_id).toBeDefined();
    expect(proposal.status).toBe('pending');
  });

  it('approves a proposal', () => {
    const mutator = new WorkflowMutator();
    const proposal = mutator.proposeEdit('wf-1', [{ op: 'update', target: 'status', value: '[x]' }], 'Auto-heal');
    const workflow = { id: 'wf-1', status: '[ ]' };
    const updated = mutator.approve(proposal.proposal_id, workflow);
    expect(updated.status).toBe('[x]');
  });

  it('rolls back a proposal', () => {
    const mutator = new WorkflowMutator();
    const proposal = mutator.proposeEdit('wf-1', [{ op: 'update', target: 'status', value: '[x]' }], 'Auto-heal');
    const workflow = { id: 'wf-1', status: '[ ]' };
    mutator.approve(proposal.proposal_id, workflow);
    const snapshot = mutator.rollback(proposal.proposal_id);
    expect(snapshot).toBeDefined();
    expect(snapshot!.status).toBe('[ ]');
  });
});

describe('AdaptiveEngine (v45.0.0)', () => {
  it('tunes retry.max_attempts from latency signal', () => {
    const engine = new AdaptiveEngine();
    engine.observe({ kind: 'latency', p99: 450 });
    expect(engine.getTuning('retry.max_attempts')).toBeGreaterThanOrEqual(1);
  });

  it('tunes circuit_breaker.threshold from error_rate signal', () => {
    const engine = new AdaptiveEngine();
    engine.observe({ kind: 'error_rate', rate: 0.05 });
    const threshold = engine.getTuning('circuit_breaker.threshold');
    expect(threshold).toBeGreaterThanOrEqual(0.01);
    expect(threshold).toBeLessThanOrEqual(0.5);
  });

  it('tunes pool.size from throughput signal', () => {
    const engine = new AdaptiveEngine();
    engine.observe({ kind: 'throughput', rps: 85 });
    expect(engine.getTuning('pool.size')).toBeGreaterThanOrEqual(1);
  });
});