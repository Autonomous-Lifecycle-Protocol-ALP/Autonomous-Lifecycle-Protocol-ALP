import { describe, it, expect } from 'vitest';
import {
  AlpParser,
  MultiModalEngine,
  AlpMultimodal,
  AlpActionSpace,
  AlpVisionModel,
} from '../src';

describe('MultiModalEngine — Protocol Multi-Modal & VLA Specifications', () => {
  const engine = new MultiModalEngine();

  it('parses @multimodal directives from ALP specification text', () => {
    const parser = new AlpParser();
    const alpText = `!alp-version: 3.0.0

@multimodal
  id: mm-vision-inspection
  modalities:
    - vision
    - sensor
  resolution: "1920x1080"
  fps: 30
`;

    const objects = parser.parse(alpText);
    expect(objects.length).toBe(1);
    expect(objects[0]._type).toBe('multimodal');
    expect(objects[0].id).toBe('mm-vision-inspection');
    expect(objects[0].modalities).toEqual(['vision', 'sensor']);
    expect(objects[0].resolution).toBe('1920x1080');
  });

  it('parses @vision_model and @action_space directives alongside @multimodal', () => {
    const parser = new AlpParser();
    const alpText = `!alp-version: 3.0.0

@vision_model
  id: model-clip
  backbone: clip
  context_tokens: 4096

@action_space
  id: act-browser
  domain: browser
  actions:
    - click
`;

    const objects = parser.parse(alpText);
    expect(objects.length).toBe(2);
    expect(objects[0]._type).toBe('vision_model');
    expect(objects[1]._type).toBe('action_space');
    expect(objects[1].actions).toEqual(['click']);
  });

  describe('validateMultimodal — edge cases', () => {
    it('rejects spec with missing id', () => {
      const result = engine.validateMultimodal({ modalities: ['vision'] } as any);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Multimodal spec requires a valid non-empty id.');
    });

    it('rejects spec with empty modalities array', () => {
      const result = engine.validateMultimodal({ id: 'mm-broken', modalities: [] });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Multimodal spec must declare at least one modality in `modalities`.');
    });

    it('rejects spec with modalities missing entirely', () => {
      const result = engine.validateMultimodal({ id: 'mm-broken' } as any);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Multimodal spec must declare at least one modality in `modalities`.');
    });

    it('warns when asset has no explicit type', () => {
      const result = engine.validateMultimodal({
        id: 'mm-asset-warn',
        modalities: ['vision'],
        assets: [{ id: 'asset-1', uri: 's3://bucket/thing' }],
      });
      expect(result.valid).toBe(true);
      expect(result.warnings).toContain("Asset 'asset-1' has no explicit media type.");
    });

    it('errors when asset is missing uri', () => {
      const result = engine.validateMultimodal({
        id: 'mm-asset-err',
        modalities: ['vision'],
        assets: [{ id: 'asset-1', type: 'image' }],
      });
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes("'asset-1' is missing a uri"))).toBe(true);
    });

    it('errors when asset at index has no id', () => {
      const result = engine.validateMultimodal({
        id: 'mm-asset-err2',
        modalities: ['vision'],
        assets: [{ type: 'image', uri: 's3://bucket/thing' }],
      });
      expect(result.valid).toBe(false);
      expect(result.errors.some((e) => e.includes('Asset at index 0 is missing an id'))).toBe(true);
    });

    it('validates a well-formed spec and estimates token costs', () => {
      const result = engine.validateMultimodal({
        id: 'mm-robot-telemetry',
        modalities: ['vision', 'sensor', 'text'],
        assets: [
          { id: 'img-1', type: 'image', uri: 's3://assets/cam-front.png' },
          { id: 'vid-1', type: 'video', uri: 's3://assets/feed.mp4' },
        ],
      });
      expect(result.valid).toBe(true);
      expect(result.errors.length).toBe(0);
      expect(result.totalTokensEstimate).toBeGreaterThan(2000);
    });

    it('returns safety score proportional to errors and warnings', () => {
      const perfect = engine.validateMultimodal({
        id: 'mm-perfect',
        modalities: ['vision'],
        assets: [{ id: 'a', type: 'image', uri: 's3://a.png' }],
      });
      expect(perfect.safetyScore).toBe(100);

      const withWarnings = engine.validateMultimodal({
        id: 'mm-warn',
        modalities: ['vision'],
        assets: [{ id: 'a', uri: 's3://a.png' }],
      });
      expect(withWarnings.safetyScore).toBeLessThan(perfect.safetyScore);
    });
  });

  describe('validateActionSpace — edge cases', () => {
    it('rejects action space with missing id', () => {
      const result = engine.validateActionSpace({ actions: [] } as any);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('ActionSpace requires a valid non-empty id.');
    });

    it('rejects action space with empty actions array', () => {
      const result = engine.validateActionSpace({ id: 'as-empty' });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('ActionSpace must declare at least one action in `actions`.');
    });

    it('rejects action space with actions missing entirely', () => {
      const result = engine.validateActionSpace({ id: 'as-no-actions' } as any);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('ActionSpace must declare at least one action in `actions`.');
    });

    it('errors when action definition is missing name', () => {
      const result = engine.validateActionSpace({
        id: 'as-no-name',
        actions: [{ safety_level: 'low' } as any],
      });
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Action definition missing name.');
    });

    it('counts critical actions correctly', () => {
      const result = engine.validateActionSpace({
        id: 'as-critical-test',
        actions: [
          { name: 'safe', type: 'digital', safety_level: 'low' },
          { name: 'danger1', type: 'api', safety_level: 'critical', requires_confirmation: true },
          { name: 'danger2', type: 'api', safety_level: 'critical', requires_confirmation: false },
        ],
      });
      expect(result.criticalActionCount).toBe(2);
    });

    it('warns when critical action lacks requires_confirmation', () => {
      const result = engine.validateActionSpace({
        id: 'as-warn-critical',
        actions: [
          { name: 'wipe_db', type: 'api', safety_level: 'critical', requires_confirmation: false },
        ],
      });
      expect(result.warnings.length).toBe(1);
      expect(result.warnings[0]).toContain('wipe_db');
    });

    it('does not warn when critical action has requires_confirmation', () => {
      const result = engine.validateActionSpace({
        id: 'as-ok-critical',
        actions: [
          { name: 'deploy', type: 'api', safety_level: 'critical', requires_confirmation: true },
        ],
      });
      expect(result.warnings.length).toBe(0);
    });

    it('validates action space with no critical actions', () => {
      const result = engine.validateActionSpace({
        id: 'as-safe',
        actions: [
          { name: 'click', type: 'digital', safety_level: 'low' },
          { name: 'type', type: 'digital', safety_level: 'medium' },
        ],
      });
      expect(result.valid).toBe(true);
      expect(result.criticalActionCount).toBe(0);
      expect(result.warnings.length).toBe(0);
    });
  });

  describe('validateVisionModel — edge cases', () => {
    it('rejects vision model with missing id', () => {
      const result = engine.validateVisionModel({ backbone: 'clip' } as any);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('VisionModel requires an id.');
    });

    it('rejects vision model with missing backbone', () => {
      const result = engine.validateVisionModel({ id: 'vm-broken' } as any);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('VisionModel requires a backbone definition.');
    });

    it('validates a well-formed vision model', () => {
      const result = engine.validateVisionModel({
        id: 'vm-siglip-base',
        backbone: 'siglip',
        embedding_dim: 768,
        max_resolution: '1024x1024',
        context_tokens: 4096,
      });
      expect(result.valid).toBe(true);
      expect(result.errors.length).toBe(0);
    });
  });

  describe('estimateTokenCost — edge cases', () => {
    it('returns base text/sensor token cost with no assets', () => {
      const tokens = engine.estimateTokenCost(['text', 'sensor'], []);
      expect(tokens).toBe(384); // 256 + 128
    });

    it('caps token estimate at vision model context_tokens', () => {
      const tokens = engine.estimateTokenCost(
        ['vision', 'vision', 'vision'],
        [
          { id: 'a', type: 'image', uri: 's3://a.png' },
          { id: 'b', type: 'video', uri: 's3://b.mp4' },
          { id: 'c', type: 'point_cloud', uri: 's3://c.pcd' },
        ],
        { context_tokens: 500 } as AlpVisionModel
      );
      expect(tokens).toBeLessThanOrEqual(500);
    });

    it('handles unknown asset type with default token cost', () => {
      const tokens = engine.estimateTokenCost(['vision'], [
        { id: 'a', type: 'unknown_type' as any, uri: 's3://a.bin' },
      ]);
      expect(tokens).toBeGreaterThan(0);
    });

    it('returns zero for empty modalities and no assets without vision model cap', () => {
      const tokens = engine.estimateTokenCost([], []);
      expect(tokens).toBe(0);
    });
  });

  describe('verifySafetyGuards — edge cases', () => {
    it('allows actions when no critical actions exist regardless of guards', () => {
      const space: AlpActionSpace = {
        id: 'as-safe',
        actions: [
          { name: 'click', type: 'digital', safety_level: 'low' },
          { name: 'type', type: 'digital', safety_level: 'medium' },
        ],
      };
      const result = engine.verifySafetyGuards(space, []);
      expect(result.allowed).toBe(true);
      expect(result.blockedActions).toHaveLength(0);
    });

    it('blocks all critical actions when no guards are active', () => {
      const space: AlpActionSpace = {
        id: 'as-unsafe',
        actions: [
          { name: 'a', type: 'api', safety_level: 'critical', requires_confirmation: false },
          { name: 'b', type: 'api', safety_level: 'critical', requires_confirmation: false },
        ],
      };
      const result = engine.verifySafetyGuards(space, []);
      expect(result.allowed).toBe(false);
      expect(result.blockedActions).toHaveLength(2);
    });

    it('allows actions when specific guard matches action name', () => {
      const space: AlpActionSpace = {
        id: 'as-guarded-by-name',
        actions: [
          { name: 'wipe_database', type: 'api', safety_level: 'critical', requires_confirmation: false },
        ],
      };
      const result = engine.verifySafetyGuards(space, ['wipe_database']);
      expect(result.allowed).toBe(true);
    });

    it('allows actions when strict-boundary guard is active', () => {
      const space: AlpActionSpace = {
        id: 'as-strict-boundary',
        actions: [
          { name: 'admin_call', type: 'rpc', safety_level: 'critical', requires_confirmation: false },
        ],
      };
      const result = engine.verifySafetyGuards(space, ['strict-boundary']);
      expect(result.allowed).toBe(true);
    });
  });

  describe('estimateTokenCost — edge cases', () => {
    it('returns base text/sensor token cost with no assets', () => {
      const tokens = engine.estimateTokenCost(['text', 'sensor'], []);
      expect(tokens).toBe(384); // 256 + 128
    });

    it('caps token estimate at vision model context_tokens', () => {
      const tokens = engine.estimateTokenCost(
        ['vision', 'vision', 'vision'],
        [
          { id: 'a', type: 'image', uri: 's3://a.png' },
          { id: 'b', type: 'video', uri: 's3://b.mp4' },
          { id: 'c', type: 'point_cloud', uri: 's3://c.pcd' },
        ],
        { context_tokens: 500 } as AlpVisionModel
      );
      expect(tokens).toBeLessThanOrEqual(500);
    });

    it('handles unknown asset type with default token cost', () => {
      const tokens = engine.estimateTokenCost(['vision'], [
        { id: 'a', type: 'unknown_type' as any, uri: 's3://a.bin' },
      ]);
      expect(tokens).toBeGreaterThan(0);
    });

    it('returns zero for empty modalities and no assets without vision model cap', () => {
      const tokens = engine.estimateTokenCost([], []);
      expect(tokens).toBe(0);
    });
  });
});
