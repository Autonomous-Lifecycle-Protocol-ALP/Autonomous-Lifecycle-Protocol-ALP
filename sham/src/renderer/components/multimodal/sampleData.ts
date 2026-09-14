import {
  AlpMultimodal,
  AlpActionSpace,
  AlpVisionModel,
} from '@autonomous-lifecycle-protocol-alp/parser';

export const SAMPLE_MULTIMODAL: AlpMultimodal[] = [
  {
    id: 'mm-factory-inspection',
    modalities: ['vision', 'sensor', 'audio'],
    resolution: '1920x1080',
    fps: 30,
    assets: [
      { id: 'cam-front', type: 'image', uri: 's3://factory/cam-front.png', resolution: '1920x1080' },
      { id: 'cam-side', type: 'image', uri: 's3://factory/cam-side.png', resolution: '1280x720' },
      { id: 'mic-ambient', type: 'audio', uri: 's3://factory/mic.wav' },
      { id: 'lidar-scan', type: 'point_cloud', uri: 's3://factory/scan.pcd' },
    ],
  },
  {
    id: 'mm-drone-telemetry',
    modalities: ['vision', 'spatial'],
    assets: [
      { id: 'aerial-cam', type: 'video', uri: 's3://drone/aerial.mp4' },
      { id: 'gps-stream', type: 'sensor', uri: 'mqtt://drone/gps' },
    ],
  },
];

export const SAMPLE_ACTION_SPACES: AlpActionSpace[] = [
  {
    id: 'as-robotic-arm',
    agent: 'agent-manufacturing',
    domain: 'robotics',
    safety_guards: ['enforce-human-in-the-loop'],
    actions: [
      { name: 'move_joint', type: 'physical', safety_level: 'low', parameters: [{ name: 'angle', type: 'number', required: true }] },
      { name: 'grip_object', type: 'actuator', safety_level: 'medium' },
      { name: 'emergency_stop', type: 'physical', safety_level: 'critical', requires_confirmation: true },
      { name: 'override_safety', type: 'actuator', safety_level: 'critical', requires_confirmation: false },
    ],
  },
  {
    id: 'as-browser-agent',
    agent: 'agent-web-navigator',
    domain: 'browser',
    actions: [
      { name: 'navigate_url', type: 'api', safety_level: 'low' },
      { name: 'click_element', type: 'digital', safety_level: 'low' },
      { name: 'fill_form', type: 'digital', safety_level: 'medium' },
      { name: 'submit_payment', type: 'api', safety_level: 'critical', requires_confirmation: true },
    ],
  },
];

export const SAMPLE_VISION_MODELS: AlpVisionModel[] = [
  {
    id: 'vm-gemini-vision',
    backbone: 'gemini-vision',
    embedding_dim: 1024,
    max_resolution: '4096x4096',
    context_tokens: 32768,
    latency_p95_ms: 120,
  },
  {
    id: 'vm-siglip-base',
    backbone: 'siglip',
    embedding_dim: 768,
    max_resolution: '1024x1024',
    context_tokens: 4096,
  },
];
