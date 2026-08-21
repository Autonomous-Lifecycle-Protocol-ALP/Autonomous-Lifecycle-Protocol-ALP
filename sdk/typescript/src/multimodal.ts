/**
 * MultiModalBridge — v82.0.0 Multi-Modal Runtime & VLA Agent Bridge
 *
 * Provides runtime asset resolution, vision token estimation, action execution safety
 * gating, and multimodal stream fusion for AI coding agents and autonomous workflows.
 */

import {
  AlpMultimodal,
  AlpActionSpace,
  AlpVisionModel,
  ActionDefinition,
  MultiModalAsset,
  MultiModalEngine,
} from '@autonomous-lifecycle-protocol-alp/parser';

export interface MultiModalExecutionResult {
  allowed: boolean;
  reason?: string;
  actionName: string;
  safetyLevel: string;
  executionTimestamp: number;
}

export interface ContextBudgetResult {
  totalTokens: number;
  maxContextTokens: number;
  budgetPercent: number;
  remainingTokens: number;
}

export class MultiModalBridge {
  private engine: MultiModalEngine;

  constructor() {
    this.engine = new MultiModalEngine();
  }

  /**
   * Estimate token context budget for a multimodal spec and vision model.
   */
  public estimateContextBudget(
    spec: AlpMultimodal,
    visionModel?: AlpVisionModel,
    maxContext: number = 8192
  ): ContextBudgetResult {
    const totalTokens = this.engine.estimateTokenCost(
      spec.modalities || [],
      spec.assets || [],
      visionModel
    );
    const maxContextTokens = visionModel?.context_tokens || maxContext;
    const budgetPercent = Math.min(100, (totalTokens / maxContextTokens) * 100);
    const remainingTokens = Math.max(0, maxContextTokens - totalTokens);

    return {
      totalTokens,
      maxContextTokens,
      budgetPercent,
      remainingTokens,
    };
  }

  /**
   * Validate whether an action in an action space can be safely executed.
   */
  public validateActionExecution(
    actionSpace: AlpActionSpace,
    actionName: string,
    params: Record<string, unknown> = {},
    confirmed: boolean = false
  ): MultiModalExecutionResult {
    const action = (actionSpace.actions || []).find((a: ActionDefinition) => a.name === actionName);

    if (!action) {
      return {
        allowed: false,
        reason: `Action '${actionName}' not defined in action space '${actionSpace.id}'.`,
        actionName,
        safetyLevel: 'unknown',
        executionTimestamp: Date.now(),
      };
    }

    // Check required parameters
    if (action.parameters) {
      for (const param of action.parameters) {
        if (param.required && (params[param.name] === undefined || params[param.name] === null)) {
          return {
            allowed: false,
            reason: `Required parameter '${param.name}' is missing for action '${actionName}'.`,
            actionName,
            safetyLevel: action.safety_level,
            executionTimestamp: Date.now(),
          };
        }
      }
    }

    // Check critical safety confirmation
    if (action.safety_level === 'critical' && action.requires_confirmation && !confirmed) {
      return {
        allowed: false,
        reason: `Action '${actionName}' is flagged CRITICAL and requires explicit human confirmation.`,
        actionName,
        safetyLevel: action.safety_level,
        executionTimestamp: Date.now(),
      };
    }

    return {
      allowed: true,
      actionName,
      safetyLevel: action.safety_level,
      executionTimestamp: Date.now(),
    };
  }

  /**
   * Fuse text and multimodal assets into a unified context payload for LLM/VLA models.
   */
  public fuseMultimodalStreams(
    textPrompt: string,
    assets: MultiModalAsset[] = []
  ): { promptPayload: string; totalAssets: number; modalities: string[] } {
    const modalities = new Set<string>(['text']);
    const assetHeaders: string[] = [];

    for (const a of assets) {
      modalities.add(a.type);
      assetHeaders.push(`[Asset: ${a.id} | Type: ${a.type} | URI: ${a.uri}${a.resolution ? ` | Res: ${a.resolution}` : ''}]`);
    }

    const promptPayload = [
      `=== MULTIMODAL VLA CONTEXT (${assets.length} ASSETS) ===`,
      ...assetHeaders,
      `=== PROMPT ===`,
      textPrompt,
    ].join('\n');

    return {
      promptPayload,
      totalAssets: assets.length,
      modalities: Array.from(modalities),
    };
  }
}
