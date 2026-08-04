import { describe, it, expect } from 'vitest';
import { ExecutionQuotaEngine } from '../src/execution-quota';

describe('ExecutionQuotaEngine (v88.0.0)', () => {
  it('creates a quota and allows executions within limit', () => {
    const engine = new ExecutionQuotaEngine();
    const quota = engine.createQuota('q1', 3, 60000);
    expect(quota.maxExecutions).toBe(3);
    expect(quota.windowMs).toBe(60000);

    const first = engine.recordExecution('q1');
    expect(first.allowed).toBe(true);
    expect(first.remaining).toBe(2);

    const second = engine.recordExecution('q1');
    expect(second.allowed).toBe(true);
    expect(second.remaining).toBe(1);
  });

  it('blocks executions when quota is exhausted', () => {
    const engine = new ExecutionQuotaEngine();
    engine.createQuota('q2', 2, 60000);
    engine.recordExecution('q2');
    engine.recordExecution('q2');
    const blocked = engine.recordExecution('q2');
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
  });

  it('resets quota after explicit reset', () => {
    const engine = new ExecutionQuotaEngine();
    engine.createQuota('q3', 1, 60000);
    engine.recordExecution('q3');
    const blocked = engine.checkQuota('q3');
    expect(blocked.allowed).toBe(false);

    engine.resetQuota('q3');
    const afterReset = engine.checkQuota('q3');
    expect(afterReset.allowed).toBe(true);
    expect(afterReset.remaining).toBe(1);
  });

  it('checkQuota reports remaining count before execution', () => {
    const engine = new ExecutionQuotaEngine();
    engine.createQuota('q4', 5, 60000);
    const status = engine.checkQuota('q4');
    expect(status.allowed).toBe(true);
    expect(status.remaining).toBe(5);
  });

  it('returns undefined for missing quota', () => {
    const engine = new ExecutionQuotaEngine();
    expect(engine.getQuota('missing')).toBeUndefined();
    const status = engine.checkQuota('missing');
    expect(status.allowed).toBe(false);
  });
});
