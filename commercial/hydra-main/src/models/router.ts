export interface ModelProvider {
  id: string;
  name: string;
  type: "openai" | "anthropic" | "ollama" | "azure" | "aws" | "gcp" | "local";
  models: ModelConfig[];
  defaultModel: string;
  healthy: boolean;
  latencyMs: number;
  lastChecked: string;
}

export interface ModelConfig {
  id: string;
  name: string;
  contextWindow: number;
  maxOutput: number;
  costPer1kInput: number;
  costPer1kOutput: number;
  supportsTools: boolean;
  supportsVision: boolean;
  supportsStreaming: boolean;
  tier: "budget" | "standard" | "premium" | "frontier";
  capabilities?: string[];
}

export interface ModelSelection {
  provider: string;
  model: string;
  reason: string;
  estimatedCostPer1k: number;
  latencyMs: number;
}

export interface CompletionRequest {
  prompt: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  onStreamChunk?: (chunk: string) => void;
}

export interface CompletionResult {
  text: string;
  tokensUsed: number;
  finishReason?: string;
}

export type TaskType = "simple" | "coding" | "reasoning" | "vision" | "security" | "quantum" | "eda";

export interface ModelSelectOptions {
  taskType: TaskType;
  contextSize: number;
  budgetUsdPer1k?: number;
  latencyTargetMs?: number;
  preferredProvider?: string;
  requireTools?: boolean;
  requireVision?: boolean;
}

interface TaskTypeConfig {
  requiresTools: boolean;
  requiresVision: boolean;
  minTier: "budget" | "standard" | "premium" | "frontier";
  preferredProviders: string[];
  minContextWindow: number;
}

const TASK_TYPE_CONFIGS: Record<TaskType, TaskTypeConfig> = {
  simple: { requiresTools: false, requiresVision: false, minTier: "standard", preferredProviders: ["openai", "anthropic"], minContextWindow: 4096 },
  coding: { requiresTools: true, requiresVision: false, minTier: "standard", preferredProviders: ["openai", "anthropic", "local"], minContextWindow: 16384 },
  reasoning: { requiresTools: false, requiresVision: false, minTier: "premium", preferredProviders: ["openai", "anthropic"], minContextWindow: 128000 },
  vision: { requiresTools: false, requiresVision: true, minTier: "standard", preferredProviders: ["openai", "anthropic"], minContextWindow: 32768 },
  security: { requiresTools: true, requiresVision: false, minTier: "standard", preferredProviders: ["openai", "anthropic"], minContextWindow: 16384 },
  quantum: { requiresTools: false, requiresVision: false, minTier: "premium", preferredProviders: ["openai", "anthropic"], minContextWindow: 128000 },
  eda: { requiresTools: false, requiresVision: false, minTier: "standard", preferredProviders: ["openai", "anthropic"], minContextWindow: 65536 },
};

const TIER_RANK: Record<string, number> = { budget: 1, standard: 2, premium: 3, frontier: 4 };

function modelSupportsTask(model: ModelConfig, config: TaskTypeConfig): boolean {
  if (config.requiresTools && !model.supportsTools) return false;
  if (config.requiresVision && !model.supportsVision) return false;
  if (model.contextWindow < config.minContextWindow) return false;
  return true;
}

import { DEFAULT_PROVIDERS } from "./providers";
import { executeOpenAI, executeAnthropic, executeAzureOpenAI, executeAWSBedrock, executeGCPVertex, executeOllama, executeLocal } from "./adapters";

export class ModelRouter {
  private readonly providers: Map<string, ModelProvider> = new Map();
  private readonly providerConfigs = new Map<string, Record<string, unknown>>();
  private readonly failureCounts = new Map<string, number>();
  private readonly MAX_FAILURES = 3;

  constructor() {
    for (const provider of DEFAULT_PROVIDERS) {
      this.registerProvider(provider);
    }
  }

  configureProvider(id: string, config: Record<string, unknown>): void {
    this.providerConfigs.set(id, config);
  }

  registerProvider(provider: ModelProvider): void {
    this.providers.set(provider.id, provider);
  }

  getProvider(id: string): ModelProvider | undefined {
    return this.providers.get(id);
  }

  listProviders(): ModelProvider[] {
    return Array.from(this.providers.values());
  }

  select(options: ModelSelectOptions): ModelSelection {
    const config = TASK_TYPE_CONFIGS[options.taskType];
    const candidates = this.getCandidates(options.taskType, options);
    if (candidates.length === 0) {
      return {
        provider: "openai",
        model: "gpt-4o",
        reason: "fallback-default",
        estimatedCostPer1k: 0.03,
        latencyMs: 450,
      };
    }

    let best = candidates[0];
    let bestScore = this.scoreCandidate(best, options, config);

    for (let i = 1; i < candidates.length; i++) {
      const score = this.scoreCandidate(candidates[i], options, config);
      if (score > bestScore) {
        best = candidates[i];
        bestScore = score;
      }
    }

    const defaultModel = best.models.find((m) => m.id === best.defaultModel) ?? best.models[0];
    return {
      provider: best.id,
      model: best.defaultModel,
      reason: `optimal-${options.taskType}`,
      estimatedCostPer1k: defaultModel?.costPer1kInput ?? 0.03,
      latencyMs: best.latencyMs,
    };
  }

  selectAll(options: ModelSelectOptions): ModelSelection[] {
    const config = TASK_TYPE_CONFIGS[options.taskType];
    const candidates = this.getCandidates(options.taskType, options);
    if (candidates.length === 0) {
      return [{
        provider: "openai",
        model: "gpt-4o",
        reason: "fallback-default",
        estimatedCostPer1k: 0.03,
        latencyMs: 450,
      }];
    }

    return candidates
      .map((p) => {
        const model = p.models.find((m) => m.id === p.defaultModel) ?? p.models[0];
        return {
          provider: p.id,
          model: p.defaultModel,
          reason: `candidate-${options.taskType}`,
          estimatedCostPer1k: model?.costPer1kInput ?? 0.03,
          latencyMs: p.latencyMs,
        };
      })
      .sort((a, b) => this.scoreCandidate(this.providers.get(b.provider)!, options, config) - this.scoreCandidate(this.providers.get(a.provider)!, options, config));
  }

  async complete(providerId: string, modelId: string, request: CompletionRequest): Promise<CompletionResult> {
    const provider = this.providers.get(providerId);
    if (!provider) throw new Error(`Provider ${providerId} not found`);

    const model = provider.models.find((m) => m.id === modelId) ?? provider.models[0];
    if (!model) throw new Error(`Model ${modelId} not found`);

    const config = this.providerConfigs.get(providerId) ?? {};
    const start = Date.now();

    const result = await this.executeOnProvider(provider, model, request, config);

    const latencyMs = Date.now() - start;
    provider.latencyMs = latencyMs;
    provider.lastChecked = new Date().toISOString();
    provider.healthy = true;
    this.failureCounts.delete(providerId);

    return result;
  }

  async completeWithFallback(options: ModelSelectOptions, request: CompletionRequest): Promise<{ result: CompletionResult; provider: string; model: string }> {
    const selections = this.selectAll(options);
    for (const selection of selections) {
      if (!this.providerConfigs.has(selection.provider)) continue;
      try {
        const result = await this.complete(selection.provider, selection.model, request);
        return { result, provider: selection.provider, model: selection.model };
      } catch {
        const fails = (this.failureCounts.get(selection.provider) ?? 0) + 1;
        this.failureCounts.set(selection.provider, fails);
        const provider = this.providers.get(selection.provider);
        if (provider && fails >= this.MAX_FAILURES) {
          provider.healthy = false;
        }
        if (fails >= this.MAX_FAILURES) continue;
      }
    }
    throw new Error("All model providers failed");
  }

  private async executeOnProvider(
    provider: ModelProvider,
    model: ModelConfig,
    request: CompletionRequest,
    config: Record<string, unknown>,
  ): Promise<CompletionResult> {
    switch (provider.type) {
      case "openai":
        return executeOpenAI(model, request, config as { apiKey?: string; baseUrl?: string });
      case "anthropic":
        return executeAnthropic(model, request, config as { apiKey?: string; baseUrl?: string });
      case "azure":
        return executeAzureOpenAI(model, request, config as { apiKey?: string; endpoint?: string; deployment?: string });
      case "aws":
        return executeAWSBedrock(model, request, config as { region?: string; accessKeyId?: string; secretAccessKey?: string });
      case "gcp":
        return executeGCPVertex(model, request, config as { projectId?: string; region?: string; accessToken?: string });
      case "ollama":
        return executeOllama(model, request, config as { endpoint?: string });
      case "local":
      default:
        return executeLocal(model, request);
    }
  }

  private getCandidates(taskType: string, _options: ModelSelectOptions): ModelProvider[] {
    const config = TASK_TYPE_CONFIGS[taskType as TaskType] ?? TASK_TYPE_CONFIGS.simple;
    return Array.from(this.providers.values()).filter((p) => {
      if (!p.healthy) return false;
      const fails = this.failureCounts.get(p.id) ?? 0;
      if (fails >= this.MAX_FAILURES) return false;
      const defaultModel = p.models.find((m) => m.id === p.defaultModel) ?? p.models[0];
      if (!defaultModel) return false;
      return modelSupportsTask(defaultModel, config);
    });
  }

  private scoreCandidate(provider: ModelProvider, options: ModelSelectOptions, config: TaskTypeConfig): number {
    let score = 100;

    const defaultModel = provider.models.find((m) => m.id === provider.defaultModel) ?? provider.models[0];
    if (!defaultModel) return -1;

    const fails = this.failureCounts.get(provider.id) ?? 0;
    if (fails > 0) {
      score -= fails * 15;
    }

    if (options.budgetUsdPer1k && defaultModel.costPer1kInput > options.budgetUsdPer1k) {
      score -= 50;
    }

    if (options.latencyTargetMs && provider.latencyMs > options.latencyTargetMs) {
      score -= 30;
    } else if (options.latencyTargetMs && provider.latencyMs <= options.latencyTargetMs) {
      score += 10;
    }

    if (options.preferredProvider && provider.id === options.preferredProvider) {
      score += 20;
    }

    if (config.preferredProviders.includes(provider.id)) {
      score += 15;
    }

    if (defaultModel.tier === config.minTier) {
      score += 5;
    } else if (TIER_RANK[defaultModel.tier] > TIER_RANK[config.minTier]) {
      score -= 10;
    }

    const contextBuffer = defaultModel.contextWindow - options.contextSize;
    if (contextBuffer < options.contextSize * 0.25) {
      score -= 20;
    }

    if (provider.latencyMs < 200) {
      score += 5;
    } else if (provider.latencyMs > 1000) {
      score -= 5;
    }

    return score;
  }
}
