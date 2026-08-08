import { LLMProviderConfig, LLMModelConfig, LLMAgentConfig } from "../types";
import { LLMProvider, ProviderCompletionResult, StreamCallback } from "./providers";

export interface ProviderHealth {
  providerId: string;
  healthy: boolean;
  latencyMs: number;
  lastChecked: string;
  error?: string;
}

export interface LLMCompletionOptions {
  stream?: boolean;
  temperature?: number;
  maxTokens?: number;
  failover?: boolean;
}

export interface LLMCompletionResult {
  text: string;
  provider: string;
  model: string;
  tokensUsed: number;
  costUsd: number;
  latencyMs: number;
}

export class LLMOrchestrator {
  private providers: Map<string, LLMProvider> = new Map();
  private agents: Map<string, LLMAgentConfig> = new Map();
  private readonly providerHealth = new Map<string, ProviderHealth>();

  registerProvider(provider: LLMProvider): void {
    this.providers.set(provider.id, provider);
    this.providerHealth.set(provider.id, {
      providerId: provider.id,
      healthy: provider.health.healthy,
      latencyMs: provider.health.latencyMs,
      lastChecked: provider.health.lastChecked,
      error: provider.health.error,
    });
  }

  registerAgent(agent: LLMAgentConfig): void {
    this.agents.set(agent.id, agent);
  }

  getProvider(id: string): LLMProvider | undefined {
    return this.providers.get(id);
  }

  listProviders(): LLMProvider[] {
    return Array.from(this.providers.values());
  }

  listAgents(): LLMAgentConfig[] {
    return Array.from(this.agents.values());
  }

  async complete(agentId: string, prompt: string, options: LLMCompletionOptions = {}): Promise<LLMCompletionResult | undefined> {
    const agent = this.agents.get(agentId);
    if (!agent) return undefined;

    const provider = this.providers.get(agent.provider);
    if (!provider) return undefined;

    const start = Date.now();
    let result: ProviderCompletionResult;
    try {
      result = await provider.complete(agent.model, prompt, {
        temperature: options.temperature ?? agent.temperature,
        maxTokens: options.maxTokens ?? agent.maxTokens,
        stream: options.stream,
        systemPrompt: agent.systemPrompt,
      });
    } catch (error) {
      this.markProviderUnhealthy(agent.provider, error instanceof Error ? error.message : "Unknown error");
      return undefined;
    }

    this.markProviderHealthy(agent.provider, Date.now() - start);
    const costUsd = this.estimateCost(agent.provider, agent.model, result.tokensUsed, 0) ?? 0;

    return {
      text: result.text,
      provider: agent.provider,
      model: agent.model,
      tokensUsed: result.tokensUsed,
      costUsd,
      latencyMs: Date.now() - start,
    };
  }

  async streamComplete(agentId: string, prompt: string, onChunk: StreamCallback, options: LLMCompletionOptions = {}): Promise<LLMCompletionResult | undefined> {
    const agent = this.agents.get(agentId);
    if (!agent) return undefined;

    const provider = this.providers.get(agent.provider);
    if (!provider) return undefined;

    if (!this.supportsStreaming(agent.provider, agent.model)) {
      const result = await this.complete(agentId, prompt, { ...options, stream: false });
      if (result) onChunk(result.text);
      return result;
    }

    const start = Date.now();
    let result: ProviderCompletionResult;
    try {
      result = await provider.complete(agent.model, prompt, {
        temperature: options.temperature ?? agent.temperature,
        maxTokens: options.maxTokens ?? agent.maxTokens,
        stream: true,
        onStreamChunk: onChunk,
        systemPrompt: agent.systemPrompt,
      });
    } catch (error) {
      this.markProviderUnhealthy(agent.provider, error instanceof Error ? error.message : "Unknown error");
      return undefined;
    }

    this.markProviderHealthy(agent.provider, Date.now() - start);
    const costUsd = this.estimateCost(agent.provider, agent.model, result.tokensUsed, 0) ?? 0;

    return {
      text: result.text,
      provider: agent.provider,
      model: agent.model,
      tokensUsed: result.tokensUsed,
      costUsd,
      latencyMs: Date.now() - start,
    };
  }

  async resolveProviderWithFailover(
    agentId: string,
    options: LLMCompletionOptions = {},
  ): Promise<{ provider: LLMProvider; model: { id: string; name: string; contextWindow: number; maxOutput: number } } | undefined> {
    const agent = this.agents.get(agentId);
    if (!agent) return undefined;

    const candidates: LLMProvider[] = [];
    const primary = this.providers.get(agent.provider);
    if (primary) candidates.push(primary);
    for (const fallback of agent.fallbackProviders ?? []) {
      const provider = this.providers.get(fallback.provider);
      if (provider) candidates.push(provider);
    }

    const sorted = options.failover
      ? candidates.sort((a, b) => {
          const healthA = this.providerHealth.get(a.id)?.healthy ?? false;
          const healthB = this.providerHealth.get(b.id)?.healthy ?? false;
          if (healthA && !healthB) return -1;
          if (!healthA && healthB) return 1;
          return 0;
        })
      : candidates;

    for (const provider of sorted) {
      const isHealthy = this.providerHealth.get(provider.id)?.healthy ?? true;
      const model = provider.models.find((m) => m.id === agent.model);
      if (model && (options.failover ? isHealthy : true)) {
        return { provider, model };
      }
    }

    for (const provider of sorted) {
      const isHealthy = this.providerHealth.get(provider.id)?.healthy ?? true;
      if (options.failover && !isHealthy) continue;
      const fallbackModel = provider.models[0];
      if (fallbackModel) {
        return { provider, model: fallbackModel };
      }
    }

    return undefined;
  }

  supportsStreaming(providerId: string, modelId: string): boolean {
    const provider = this.providers.get(providerId);
    if (!provider) return false;
    return provider.supportsStreaming(modelId);
  }

  markProviderUnhealthy(providerId: string, error: string): void {
    const health = this.providerHealth.get(providerId);
    const provider = this.providers.get(providerId);
    if (health) {
      health.healthy = false;
      health.error = error;
      health.lastChecked = new Date().toISOString();
    }
    if (provider) {
      provider.health.healthy = false;
      provider.health.error = error;
      provider.health.lastChecked = new Date().toISOString();
    }
  }

  markProviderHealthy(providerId: string, latencyMs: number): void {
    const health = this.providerHealth.get(providerId);
    const provider = this.providers.get(providerId);
    if (health) {
      health.healthy = true;
      health.latencyMs = latencyMs;
      health.lastChecked = new Date().toISOString();
      health.error = undefined;
    }
    if (provider) {
      provider.health.healthy = true;
      provider.health.latencyMs = latencyMs;
      provider.health.lastChecked = new Date().toISOString();
      provider.health.error = undefined;
    }
  }

  getProviderHealth(providerId: string): ProviderHealth | undefined {
    return this.providerHealth.get(providerId);
  }

  listProviderHealth(): ProviderHealth[] {
    return Array.from(this.providerHealth.values());
  }

  estimateCost(providerId: string, modelId: string, inputTokens: number, outputTokens: number): number | undefined {
    const provider = this.providers.get(providerId);
    if (!provider) return undefined;
    const model = provider.models.find((m) => m.id === modelId);
    if (!model) return undefined;
    const inputCost = inputTokens * 0.001;
    const outputCost = outputTokens * 0.004;
    return inputCost + outputCost;
  }

  getAgentModel(agentId: string): { provider: LLMProvider; model: { id: string; name: string; contextWindow: number; maxOutput: number } } | undefined {
    const agent = this.agents.get(agentId);
    if (!agent) return undefined;
    const provider = this.providers.get(agent.provider);
    if (!provider) return undefined;
    const model = provider.models.find((m) => m.id === agent.model);
    if (!model) return undefined;
    return { provider, model };
  }
}
