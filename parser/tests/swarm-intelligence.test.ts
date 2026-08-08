import { describe, it, expect } from 'vitest';
import { EmergentBehaviorDetector, RoleSpecializer, CollectiveDecisionMaker, SwarmSignal, AgentSpecialization, CollectiveVote } from '../src/swarm-intelligence';

describe('EmergentBehaviorDetector', () => {
  it('detects repeated failures', () => {
    const detector = new EmergentBehaviorDetector();
    const now = new Date().toISOString();
    for (let i = 0; i < 3; i++) {
      detector.ingest({ agent_id: 'agent-1', swarm_id: 'swarm-1', type: 'task_fail', timestamp: now, metadata: {} });
    }
    const patterns = detector.detect();
    const failurePatterns = patterns.filter((p) => p.pattern_type === 'repeated_failure');
    expect(failurePatterns.length).toBeGreaterThanOrEqual(1);
    expect(failurePatterns[0].affected_agents).toContain('agent-1');
  });

  it('detects load imbalance', () => {
    const detector = new EmergentBehaviorDetector();
    const now = new Date().toISOString();
    detector.ingest({ agent_id: 'agent-1', swarm_id: 'swarm-1', type: 'claim', timestamp: now, metadata: {} });
    detector.ingest({ agent_id: 'agent-1', swarm_id: 'swarm-1', type: 'claim', timestamp: now, metadata: {} });
    detector.ingest({ agent_id: 'agent-2', swarm_id: 'swarm-1', type: 'claim', timestamp: now, metadata: {} });
    detector.ingest({ agent_id: 'agent-3', swarm_id: 'swarm-1', type: 'task_complete', timestamp: now, metadata: {} });
    const patterns = detector.detect();
    const imbalance = patterns.filter((p) => p.pattern_type === 'load_imbalance');
    expect(imbalance.length).toBeGreaterThanOrEqual(1);
  });

  it('returns empty patterns for healthy swarm', () => {
    const detector = new EmergentBehaviorDetector();
    const now = new Date().toISOString();
    detector.ingest({ agent_id: 'agent-1', swarm_id: 'swarm-1', type: 'task_complete', timestamp: now, metadata: {} });
    expect(detector.detect()).toHaveLength(0);
  });
});

describe('RoleSpecializer', () => {
  it('records specialization from successes', () => {
    const specializer = new RoleSpecializer();
    specializer.record('agent-1', 'planner', true);
    specializer.record('agent-1', 'planner', true);
    const spec = specializer.getSpecialization('agent-1');
    expect(spec?.role).toBe('planner');
    expect(spec?.confidence).toBeGreaterThan(0.7);
  });

  it('downgrades confidence on failures', () => {
    const specializer = new RoleSpecializer();
    specializer.record('agent-1', 'builder', false);
    const spec = specializer.getSpecialization('agent-1');
    expect(spec?.confidence).toBeLessThan(0.5);
  });

  it('returns sorted specializations', () => {
    const specializer = new RoleSpecializer();
    specializer.record('agent-1', 'planner', true);
    specializer.record('agent-2', 'builder', true);
    specializer.record('agent-2', 'builder', true);
    const all = specializer.getAll();
    expect(all.length).toBe(2);
    expect(all[0].agent_id).toBe('agent-2');
  });
});

describe('CollectiveDecisionMaker', () => {
  it('reaches decision with sufficient quorum', () => {
    const maker = new CollectiveDecisionMaker();
    maker.castVote('prop-1', 'voter-1', true);
    maker.castVote('prop-1', 'voter-2', true);
    maker.castVote('prop-1', 'voter-3', false);
    const decision = maker.decide('prop-1', 2);
    expect(decision.passed).toBe(true);
    expect(decision.votes).toHaveLength(3);
  });

  it('fails decision below quorum', () => {
    const maker = new CollectiveDecisionMaker();
    maker.castVote('prop-1', 'voter-1', true);
    const decision = maker.decide('prop-1', 3);
    expect(decision.passed).toBe(false);
  });
});
