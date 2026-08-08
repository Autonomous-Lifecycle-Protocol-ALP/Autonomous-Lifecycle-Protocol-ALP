import { describe, it, expect } from 'vitest';
import { VerifiableReasoningTree, CritiqueEngine, CrossAgentPlanner } from '../src/reasoning-core.js';

describe('VerifiableReasoningTree (V82.0.0)', () => {
  it('adds reasoning steps and computes Merkle root hash', () => {
    const tree = new VerifiableReasoningTree();
    const s1 = tree.addStep('step-1', 'agent-planner', 'Decompose goal', 'decompose', 0.95);
    const s2 = tree.addStep('step-2', 'agent-codegen', 'Generate TypeScript handler', 'codegen', 0.9, 'step-1');

    expect(s1.hash).toBeDefined();
    expect(s2.hash).toBeDefined();
    expect(tree.getSteps().length).toBe(2);

    const verification = tree.verifyTrace();
    expect(verification.valid).toBe(true);
    expect(verification.stepCount).toBe(2);
    expect(verification.computedRoot).toBe(verification.storedRoot);
  });
});

describe('CritiqueEngine Self-Reflection (V82.0.0)', () => {
  it('critiques ALP specification content and identifies defects', () => {
    const engine = new CritiqueEngine();
    const spec = `
!deprecated: "Use new policy structure"
@task id: "build"
  status: [!]
`;
    const result = engine.critique(spec, 'SPEC');
    expect(result.overallScore).toBeLessThan(1.0);
    expect(result.defects.length).toBeGreaterThan(0);
    expect(result.refinementSuggestions.length).toBeGreaterThan(0);
  });

  it('refines content automatically based on critique results', () => {
    const engine = new CritiqueEngine();
    const spec = `@task id: "build"\n  status: [!]`;
    const result = engine.critique(spec, 'SPEC');
    const refined = engine.refine(spec, result);

    expect(refined).toContain('[!] pending verification');
  });
});

describe('CrossAgentPlanner Negotiation (V82.0.0)', () => {
  it('resolves task allocation negotiation among agent bids', () => {
    const planner = new CrossAgentPlanner();

    planner.submitBid({
      agentId: 'agent-fast',
      nodeId: 'task-build',
      capabilityScore: 0.8,
      estimatedCost: 100,
      riskScore: 0.1,
    });

    planner.submitBid({
      agentId: 'agent-pro',
      nodeId: 'task-build',
      capabilityScore: 0.98,
      estimatedCost: 200,
      riskScore: 0.05,
    });

    const assignments = planner.resolveNegotiation(['task-build']);
    expect(assignments.length).toBe(1);
    expect(assignments[0].winningAgentId).toBe('agent-pro');
    expect(assignments[0].bidScore).toBeGreaterThan(0);
  });
});
