import { describe, it, expect } from 'vitest';
import {
  MultiModalEngine,
  AlpMultimodal,
  AlpActionSpace,
  AlpVisionModel,
} from '@autonomous-lifecycle-protocol-alp/parser';
import { MultiModalBridge } from '@autonomous-lifecycle-protocol-alp/sdk';

describe('CLI multimodal — MultiModalEngine validation', () => {
  const engine = new MultiModalEngine();

  it('validates a well-formed multimodal spec', () => {
    const spec: AlpMultimodal = {
      id: 'mm-factory-floor',
      modalities: ['vision', 'sensor', 'audio'],
      assets: [
        { id: 'cam-1', type: 'image', uri: 's3://bucket/cam-1.png' },
        { id: 'mic-1', type: 'audio', uri: 's3://bucket/mic-1.wav' },
      ],
    };

    const result = engine.validateMultimodal(spec);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.totalTokensEstimate).toBeGreaterThan(0);
    expect(result.safetyScore).toBeGreaterThanOrEqual(80);
  });

  it('rejects multimodal spec without modalities', () => {
    const spec: AlpMultimodal = {
      id: 'mm-broken',
      modalities: [],
    };

    const result = engine.validateMultimodal(spec);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('rejects multimodal spec missing id', () => {
    const result = engine.validateMultimodal({ modalities: ['vision'] } as any);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Multimodal spec requires a valid non-empty id.');
  });

  it('rejects multimodal spec with asset missing uri', () => {
    const result = engine.validateMultimodal({
      id: 'mm-asset-err',
      modalities: ['vision'],
      assets: [{ id: 'a', type: 'image' }],
    });
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('missing a uri'))).toBe(true);
  });

  it('validates action space and counts critical actions', () => {
    const actionSpace: AlpActionSpace = {
      id: 'as-drone-pilot',
      domain: 'robotics',
      actions: [
        { name: 'takeoff', type: 'physical', safety_level: 'medium' },
        { name: 'land', type: 'physical', safety_level: 'low' },
        { name: 'self_destruct', type: 'actuator', safety_level: 'critical', requires_confirmation: true },
      ],
    };

    const result = engine.validateActionSpace(actionSpace);
    expect(result.valid).toBe(true);
    expect(result.criticalActionCount).toBe(1);
  });

  it('blocks critical actions without safety guards', () => {
    const actionSpace: AlpActionSpace = {
      id: 'as-unsafeguarded',
      actions: [
        { name: 'wipe_database', type: 'api', safety_level: 'critical', requires_confirmation: false },
      ],
    };

    const guardCheck = engine.verifySafetyGuards(actionSpace, []);
    expect(guardCheck.allowed).toBe(false);
    expect(guardCheck.blockedActions).toContain('wipe_database');
  });

  it('passes safety guards when enforce-human-in-the-loop is active', () => {
    const actionSpace: AlpActionSpace = {
      id: 'as-guarded',
      actions: [
        { name: 'wipe_database', type: 'api', safety_level: 'critical', requires_confirmation: false },
      ],
    };

    const guardCheck = engine.verifySafetyGuards(actionSpace, ['enforce-human-in-the-loop']);
    expect(guardCheck.allowed).toBe(true);
    expect(guardCheck.blockedActions).toHaveLength(0);
  });

  it('blocks critical action via specific guard name match', () => {
    const actionSpace: AlpActionSpace = {
      id: 'as-name-guard',
      actions: [
        { name: 'admin_call', type: 'rpc', safety_level: 'critical', requires_confirmation: false },
      ],
    };
    const result = engine.verifySafetyGuards(actionSpace, ['admin_call']);
    expect(result.allowed).toBe(true);
  });

  it('rejects action space with empty actions', () => {
    const result = engine.validateActionSpace({ id: 'as-empty' });
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('ActionSpace must declare at least one action in `actions`.');
  });

  it('rejects action space missing id', () => {
    const result = engine.validateActionSpace({ actions: [] } as any);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('ActionSpace requires a valid non-empty id.');
  });
});

describe('CLI multimodal — MultiModalBridge context budget', () => {
  const bridge = new MultiModalBridge();

  it('estimates context budget with vision model cap', () => {
    const spec: AlpMultimodal = {
      id: 'mm-lidar-mesh',
      modalities: ['vision', 'spatial'],
      assets: [
        { id: 'lidar-1', type: 'point_cloud', uri: 's3://lidar/scan.pcd' },
        { id: 'cam-1', type: 'image', uri: 's3://lidar/cam.png' },
      ],
    };
    const model: AlpVisionModel = {
      id: 'vm-small',
      backbone: 'clip',
      context_tokens: 2048,
    };

    const budget = bridge.estimateContextBudget(spec, model);
    expect(budget.totalTokens).toBeGreaterThan(0);
    expect(budget.maxContextTokens).toBe(2048);
    expect(budget.budgetPercent).toBeGreaterThan(0);
    expect(budget.remainingTokens).toBeGreaterThanOrEqual(0);
  });

  it('caps totalTokens at vision model context_tokens', () => {
    const spec: AlpMultimodal = {
      id: 'mm-huge',
      modalities: ['vision', 'vision', 'vision'],
      assets: [
        { id: 'a', type: 'image', uri: 's3://a.png' },
        { id: 'b', type: 'video', uri: 's3://b.mp4' },
        { id: 'c', type: 'point_cloud', uri: 's3://c.pcd' },
      ],
    };
    const model: AlpVisionModel = { id: 'vm-tiny', backbone: 'clip', context_tokens: 100 };
    const budget = bridge.estimateContextBudget(spec, model);
    expect(budget.totalTokens).toBeLessThanOrEqual(100);
  });

  it('validates action execution with required parameters', () => {
    const actionSpace: AlpActionSpace = {
      id: 'as-param-test',
      actions: [
        {
          name: 'rotate',
          type: 'physical',
          safety_level: 'low',
          parameters: [{ name: 'degrees', type: 'number', required: true }],
        },
      ],
    };

    // Missing required parameter
    const fail = bridge.validateActionExecution(actionSpace, 'rotate', {});
    expect(fail.allowed).toBe(false);
    expect(fail.reason).toContain('degrees');

    // With required parameter
    const pass = bridge.validateActionExecution(actionSpace, 'rotate', { degrees: 90 });
    expect(pass.allowed).toBe(true);
  });

  it('returns not-found for undefined action', () => {
    const space: AlpActionSpace = {
      id: 'as-missing',
      actions: [{ name: 'real', type: 'digital', safety_level: 'low' }],
    };
    const result = bridge.validateActionExecution(space, 'ghost');
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('not defined');
  });

  it('fuses multimodal streams into context payload', () => {
    const result = bridge.fuseMultimodalStreams('Analyze defects', [
      { id: 'img-1', type: 'image', uri: 's3://img.png' },
      { id: 'audio-1', type: 'audio', uri: 's3://audio.wav' },
    ]);

    expect(result.totalAssets).toBe(2);
    expect(result.modalities).toContain('text');
    expect(result.modalities).toContain('image');
    expect(result.modalities).toContain('audio');
    expect(result.promptPayload).toContain('MULTIMODAL VLA CONTEXT');
    expect(result.promptPayload).toContain('Analyze defects');
  });

  it('fuses empty assets without asset headers', () => {
    const result = bridge.fuseMultimodalStreams('Hello', []);
    expect(result.totalAssets).toBe(0);
    expect(result.modalities).toEqual(['text']);
    expect(result.promptPayload).not.toContain('Asset:');
  });

  it('includes asset resolution in fused payload when present', () => {
    const result = bridge.fuseMultimodalStreams('Check', [
      { id: 'cam', type: 'image', uri: 's3://cam.png', resolution: '1920x1080' },
    ]);
    expect(result.promptPayload).toContain('Res: 1920x1080');
  });

  it('blocks critical action without confirmation in bridge', () => {
    const space: AlpActionSpace = {
      id: 'as-critical',
      actions: [
        { name: 'deploy', type: 'api', safety_level: 'critical', requires_confirmation: true },
      ],
    };
    const fail = bridge.validateActionExecution(space, 'deploy', {}, false);
    expect(fail.allowed).toBe(false);
    expect(fail.reason).toContain('requires explicit human confirmation');
  });

  it('allows critical action with confirmation in bridge', () => {
    const space: AlpActionSpace = {
      id: 'as-critical-ok',
      actions: [
        { name: 'deploy', type: 'api', safety_level: 'critical', requires_confirmation: true },
      ],
    };
    const pass = bridge.validateActionExecution(space, 'deploy', {}, true);
    expect(pass.allowed).toBe(true);
  });
});
