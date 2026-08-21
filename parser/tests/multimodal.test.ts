import { describe, it, expect } from 'vitest';
import {
  AlpParser,
  MultiModalEngine,
  AlpMultimodal,
  AlpActionSpace,
  AlpVisionModel,
} from '../src';

describe('MultiModalEngine — Protocol Multi-Modal & VLA Specifications', () => {
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

  it('validates multimodal specs and estimates token costs', () => {
    const engine = new MultiModalEngine();
    const spec: AlpMultimodal = {
      id: 'mm-robot-telemetry',
      modalities: ['vision', 'sensor', 'text'],
      assets: [
        { id: 'img-1', type: 'image', uri: 's3://assets/cam-front.png' },
        { id: 'vid-1', type: 'video', uri: 's3://assets/feed.mp4' },
      ],
    };

    const result = engine.validateMultimodal(spec);
    expect(result.valid).toBe(true);
    expect(result.errors.length).toBe(0);
    expect(result.totalTokensEstimate).toBeGreaterThan(2000);
  });

  it('validates @action_space and verifies safety guards', () => {
    const engine = new MultiModalEngine();
    const actionSpace: AlpActionSpace = {
      id: 'as-robotic-arm',
      agent: 'agent-robotics',
      domain: 'robotics',
      actions: [
        {
          name: 'move_joint',
          type: 'physical',
          safety_level: 'low',
          parameters: [{ name: 'angle', type: 'number', required: true }],
        },
        {
          name: 'emergency_power_cut',
          type: 'physical',
          safety_level: 'critical',
          requires_confirmation: true,
        },
        {
          name: 'override_safety_lock',
          type: 'actuator',
          safety_level: 'critical',
          requires_confirmation: false,
        },
      ],
    };

    const valResult = engine.validateActionSpace(actionSpace);
    expect(valResult.valid).toBe(true);
    expect(valResult.criticalActionCount).toBe(2);
    expect(valResult.warnings.length).toBe(1);

    // Verify safety guards
    const guardCheck1 = engine.verifySafetyGuards(actionSpace, []);
    expect(guardCheck1.allowed).toBe(false);
    expect(guardCheck1.blockedActions).toContain('override_safety_lock');

    const guardCheck2 = engine.verifySafetyGuards(actionSpace, ['enforce-human-in-the-loop']);
    expect(guardCheck2.allowed).toBe(true);
  });

  it('validates @vision_model backbone specifications', () => {
    const engine = new MultiModalEngine();
    const model: AlpVisionModel = {
      id: 'vm-siglip-base',
      backbone: 'siglip',
      embedding_dim: 768,
      max_resolution: '1024x1024',
      context_tokens: 4096,
    };

    const res = engine.validateVisionModel(model);
    expect(res.valid).toBe(true);
    expect(res.errors.length).toBe(0);
  });
});
