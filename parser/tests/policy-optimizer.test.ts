import { describe, it, expect } from 'vitest';
import { PolicyOptimizer } from '../src/policy-optimizer';

describe('v52.0.0 PolicyOptimizer — Genetic Algorithm Policy Evolution', () => {
  it('evolves a candidate policy population across multiple generations', () => {
    const optimizer = new PolicyOptimizer();
    const result = optimizer.evolve(
      ['src/*', 'docs/*'],
      ['.env', 'secrets/*'],
      { allowedCount: 200, blockedCount: 4, falsePositiveCount: 1, securityViolationsPrevented: 12 },
      5
    );

    expect(result.generationsEvaluated).toBe(5);
    expect(result.bestPolicy).toBeDefined();
    expect(result.bestPolicy.fitnessScore).toBeGreaterThanOrEqual(0.5);
    expect(result.bestPolicy.allowPaths.length).toBeGreaterThanOrEqual(2);
  });

  it('calculates fitness score and reports positive optimization improvement', () => {
    const optimizer = new PolicyOptimizer();
    const result = optimizer.evolve();

    expect(result.fitnessImprovementPct).toBeGreaterThanOrEqual(0);
    expect(result.bestPolicy.allowCommands).toContain('npm test');
  });
});
