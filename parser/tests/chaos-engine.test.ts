import { describe, it, expect } from 'vitest';
import { ChaosEngine } from '../src/chaos-engine';

describe('ChaosEngine (v72.0.0)', () => {
  it('creates and runs a latency chaos experiment', () => {
    const engine = new ChaosEngine();
    const exp = engine.createExperiment('Latency Storm', 'LATENCY', 'agent-executor-1', {
      durationMs: 3000,
      intensity: 0.7,
      latencyMs: 500,
      blastRadius: 'SINGLE',
    });

    expect(exp.experimentId).toMatch(/^chaos-/);
    expect(exp.status).toBe('PENDING');
    expect(exp.type).toBe('LATENCY');
    expect(exp.config.latencyMs).toBe(500);

    const result = engine.runExperiment(exp.experimentId);
    expect(result.status).toBe('COMPLETED');
    expect(result.result).toBeDefined();
    expect(result.result!.injectedFaults).toBeGreaterThan(0);
    expect(result.result!.resilienceScore).toBeGreaterThanOrEqual(0);
    expect(result.result!.resilienceScore).toBeLessThanOrEqual(100);
    expect(result.result!.observations.length).toBeGreaterThan(0);
  });

  it('supports all experiment types and blast radii', () => {
    const engine = new ChaosEngine();
    const types: Array<'LATENCY' | 'ERROR' | 'RESOURCE_EXHAUSTION' | 'PARTITION' | 'KILL_AGENT'> = [
      'LATENCY', 'ERROR', 'RESOURCE_EXHAUSTION', 'PARTITION', 'KILL_AGENT'
    ];

    for (const type of types) {
      const exp = engine.createExperiment(`Test ${type}`, type, 'agent-1', {
        blastRadius: 'WORKFLOW',
      });
      const result = engine.runExperiment(exp.experimentId);
      expect(result.status).toBe('COMPLETED');
      expect(result.result!.observations.length).toBeGreaterThanOrEqual(2);
    }

    expect(engine.getExperiments()).toHaveLength(5);
  });

  it('validates steady-state hypotheses and aborts experiments', () => {
    const engine = new ChaosEngine();
    const exp = engine.createExperiment('Error Injection', 'ERROR', 'agent-2', {
      errorCode: 503,
    });

    engine.defineSteadyState(exp.experimentId, [
      { metric: 'error_rate', operator: 'LT', threshold: 5.0 },
      { metric: 'latency_p99', operator: 'LTE', threshold: 200 },
    ]);

    const validated = engine.validateSteadyState(exp.experimentId);
    expect(validated).toHaveLength(2);
    expect(validated[0].actual).toBeDefined();
    expect(typeof validated[0].passed).toBe('boolean');

    // Test abort
    const exp2 = engine.createExperiment('Kill Test', 'KILL_AGENT', 'agent-3');
    const aborted = engine.abortExperiment(exp2.experimentId);
    expect(aborted.status).toBe('ABORTED');
  });
});
