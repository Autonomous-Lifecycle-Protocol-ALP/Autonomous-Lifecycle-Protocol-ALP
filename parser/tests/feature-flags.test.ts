import { describe, it, expect } from 'vitest';
import { FeatureFlagEngine } from '../src/feature-flags';

describe('FeatureFlagEngine (v74.0.0)', () => {
  it('creates flags and evaluates enabled/disabled states', () => {
    const engine = new FeatureFlagEngine();

    const enabled = engine.createFlag('New Dashboard', 'Redesigned agent dashboard', { status: 'ENABLED' });
    const disabled = engine.createFlag('Beta API', 'Experimental API v2', { status: 'DISABLED' });

    expect(enabled.flagId).toMatch(/^flag-/);
    expect(enabled.status).toBe('ENABLED');

    const evalEnabled = engine.evaluate(enabled.flagId, 'agent-1');
    expect(evalEnabled.enabled).toBe(true);
    expect(evalEnabled.reason).toBe('FLAG_ENABLED');

    const evalDisabled = engine.evaluate(disabled.flagId, 'agent-1');
    expect(evalDisabled.enabled).toBe(false);
    expect(evalDisabled.reason).toBe('FLAG_DISABLED');
  });

  it('supports rollout percentages and agent targeting', () => {
    const engine = new FeatureFlagEngine();

    const flag = engine.createFlag('Gradual Feature', 'Rolling out gradually', {
      status: 'ROLLOUT',
      rolloutPercentage: 50,
      targetAgents: ['agent-alpha', 'agent-beta'],
    });

    // Agent in target list — may or may not be in rollout percentage
    const eval1 = engine.evaluate(flag.flagId, 'agent-alpha');
    expect(['ROLLOUT_INCLUDED', 'ROLLOUT_EXCLUDED']).toContain(eval1.reason);

    // Agent NOT in target list — always excluded
    const eval2 = engine.evaluate(flag.flagId, 'agent-gamma');
    expect(eval2.enabled).toBe(false);
    expect(eval2.reason).toBe('AGENT_EXCLUDED');
  });

  it('handles kill switch, variants, environment targeting, and audit log', () => {
    const engine = new FeatureFlagEngine();

    const flag = engine.createFlag('AB Test', 'A/B testing new workflow', {
      status: 'EXPERIMENT',
      targetEnvironments: ['staging'],
      variants: [
        { variantId: 'control', name: 'Control', weight: 50, payload: { version: 'v1' } },
        { variantId: 'treatment', name: 'Treatment', weight: 50, payload: { version: 'v2' } },
      ],
    });

    // Evaluate in correct environment
    const evalStaging = engine.evaluate(flag.flagId, 'agent-1', 'staging');
    expect(evalStaging.enabled).toBe(true);
    expect(evalStaging.variant).toBeDefined();
    expect(['control', 'treatment']).toContain(evalStaging.variant!.variantId);

    // Evaluate in wrong environment
    const evalProd = engine.evaluate(flag.flagId, 'agent-1', 'production');
    expect(evalProd.enabled).toBe(false);
    expect(evalProd.reason).toBe('ENVIRONMENT_EXCLUDED');

    // Kill switch
    engine.killFlag(flag.flagId);
    const evalKilled = engine.evaluate(flag.flagId, 'agent-1', 'staging');
    expect(evalKilled.enabled).toBe(false);
    expect(evalKilled.reason).toBe('KILL_SWITCH');

    // Audit log
    const audit = engine.getAuditLog();
    expect(audit.length).toBeGreaterThanOrEqual(3);
    expect(audit.some(a => a.action === 'KILLED')).toBe(true);
  });
});
