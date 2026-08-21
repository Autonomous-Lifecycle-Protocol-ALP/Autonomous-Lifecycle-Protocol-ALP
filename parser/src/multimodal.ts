/**
 * MultiModalEngine — v82.0.0 Multi-Modal Protocol Specifications & VLA Engine
 *
 * Provides parser validation, token estimation, and action space safety
 * verification for vision, audio, sensor, and robotic agent primitives.
 */

export interface MultiModalAsset {
  id: string;
  name?: string;
  type: 'image' | 'video' | 'audio' | 'sensor' | 'point_cloud' | 'spatial';
  uri: string;
  format?: string;
  resolution?: string;
  hash?: string;
  size_bytes?: number;
}

export interface AlpMultimodal {
  _type?: 'multimodal';
  id: string;
  modalities: ('vision' | 'audio' | 'sensor' | 'text' | 'spatial')[];
  assets?: MultiModalAsset[];
  resolution?: string;
  fps?: number;
  sample_rate_hz?: number;
  embedding_dim?: number;
  metadata?: Record<string, unknown>;
}

export interface ActionParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  required?: boolean;
  description?: string;
  default?: unknown;
}

export interface ActionDefinition {
  name: string;
  type: 'digital' | 'physical' | 'api' | 'rpc' | 'actuator';
  parameters?: ActionParameter[];
  safety_level: 'low' | 'medium' | 'high' | 'critical';
  latency_budget_ms?: number;
  requires_confirmation?: boolean;
}

export interface AlpActionSpace {
  _type?: 'action_space';
  id: string;
  agent?: string;
  actions: ActionDefinition[];
  safety_guards?: string[];
  domain?: 'browser' | 'robotics' | 'desktop' | 'cloud' | 'embedded';
  max_concurrency?: number;
}

export interface AlpVisionModel {
  _type?: 'vision_model';
  id: string;
  backbone: 'clip' | 'siglip' | 'gpt-4o-vision' | 'gemini-vision' | 'claude-vision' | 'custom' | string;
  embedding_dim?: number;
  max_resolution?: string;
  context_tokens?: number;
  latency_p95_ms?: number;
}

export interface MultiModalValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  totalTokensEstimate: number;
  safetyScore: number;
}

export class MultiModalEngine {
  /**
   * Validate a @multimodal specification.
   */
  public validateMultimodal(spec: AlpMultimodal): MultiModalValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!spec.id || typeof spec.id !== 'string') {
      errors.push('Multimodal spec requires a valid non-empty id.');
    }

    if (!spec.modalities || !Array.isArray(spec.modalities) || spec.modalities.length === 0) {
      errors.push('Multimodal spec must declare at least one modality in `modalities`.');
    }

    const assets = spec.assets || [];
    for (let i = 0; i < assets.length; i++) {
      const a = assets[i];
      if (!a.id) errors.push(`Asset at index ${i} is missing an id.`);
      if (!a.uri) errors.push(`Asset '${a.id || i}' is missing a uri.`);
      if (!a.type) warnings.push(`Asset '${a.id || i}' has no explicit media type.`);
    }

    const totalTokensEstimate = this.estimateTokenCost(spec.modalities || [], assets);

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      totalTokensEstimate,
      safetyScore: 100 - errors.length * 20 - warnings.length * 5,
    };
  }

  /**
   * Validate an @action_space specification.
   */
  public validateActionSpace(spec: AlpActionSpace): {
    valid: boolean;
    errors: string[];
    warnings: string[];
    criticalActionCount: number;
  } {
    const errors: string[] = [];
    const warnings: string[] = [];
    let criticalActionCount = 0;

    if (!spec.id || typeof spec.id !== 'string') {
      errors.push('ActionSpace requires a valid non-empty id.');
    }

    if (!spec.actions || !Array.isArray(spec.actions) || spec.actions.length === 0) {
      errors.push('ActionSpace must declare at least one action in `actions`.');
    } else {
      for (const action of spec.actions) {
        if (!action.name) errors.push('Action definition missing name.');
        if (action.safety_level === 'critical') {
          criticalActionCount++;
          if (!action.requires_confirmation) {
            warnings.push(
              `Critical action '${action.name}' does not require explicit confirmation (requires_confirmation: true recommended).`
            );
          }
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      criticalActionCount,
    };
  }

  /**
   * Validate a @vision_model specification.
   */
  public validateVisionModel(spec: AlpVisionModel): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (!spec.id) errors.push('VisionModel requires an id.');
    if (!spec.backbone) errors.push('VisionModel requires a backbone definition.');
    return { valid: errors.length === 0, errors };
  }

  /**
   * Estimate context tokens for multimodal assets.
   */
  public estimateTokenCost(
    modalities: string[],
    assets: MultiModalAsset[] = [],
    visionModel?: AlpVisionModel
  ): number {
    let tokenEstimate = 0;

    for (const m of modalities) {
      if (m === 'text') tokenEstimate += 256;
      if (m === 'sensor') tokenEstimate += 128;
    }

    for (const asset of assets) {
      switch (asset.type) {
        case 'image':
          // Standard high-res image token cost
          tokenEstimate += 768;
          break;
        case 'video':
          // Estimated ~1000 tokens per video clip
          tokenEstimate += 1600;
          break;
        case 'audio':
          tokenEstimate += 320;
          break;
        case 'point_cloud':
        case 'spatial':
          tokenEstimate += 1024;
          break;
        default:
          tokenEstimate += 200;
          break;
      }
    }

    if (visionModel?.context_tokens && tokenEstimate > visionModel.context_tokens) {
      tokenEstimate = visionModel.context_tokens;
    }

    return tokenEstimate;
  }

  /**
   * Verify whether an action is allowed given active safety guards.
   */
  public verifySafetyGuards(
    actionSpace: AlpActionSpace,
    activeGuards: string[] = []
  ): { allowed: boolean; blockedActions: string[] } {
    const blockedActions: string[] = [];
    const guardSet = new Set(activeGuards.map((g) => g.toLowerCase()));

    for (const action of actionSpace.actions) {
      if (action.safety_level === 'critical') {
        const hasGuard =
          guardSet.has('enforce-human-in-the-loop') ||
          guardSet.has('strict-boundary') ||
          guardSet.has(action.name.toLowerCase());
        if (!hasGuard && !action.requires_confirmation) {
          blockedActions.push(action.name);
        }
      }
    }

    return {
      allowed: blockedActions.length === 0,
      blockedActions,
    };
  }
}
