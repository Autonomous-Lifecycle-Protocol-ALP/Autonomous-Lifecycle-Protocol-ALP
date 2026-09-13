/**
 * ModelHubEngine — ALP AI Model Hub
 *
 * Curated marketplace of ALP-optimized AI models for code review,
 * test generation, and general-purpose tasks with benchmarking and A/B testing.
 */

// ── Types ────────────────────────────────────────────────────────────────────

export type ModelTask = 'code-review' | 'code-gen' | 'test-gen' | 'refactor' | 'doc-gen' | 'security-scan' | 'general' | string;

export type ModelProvider = 'openai' | 'anthropic' | 'google' | 'alp' | 'alp-native' | 'meta' | 'mistral' | 'cohere' | string;

export interface HubModel {
  modelId: string;
  name: string;
  provider: ModelProvider;
  task: ModelTask;
  version: string;
  description: string;
  contextWindow: number;
  costPer1kTokens: number;
  latencyP50Ms: number;
  latencyP99Ms: number;
  accuracy: number;         // 0.0 – 1.0
  totalInvocations: number;
  rating: number;           // 0.0 – 5.0
  tags: string[];
  registeredAt: string;
}

export interface ModelBenchmark {
  modelId: string;
  task: ModelTask;
  accuracy: number;
  latencyP50Ms: number;
  latencyP99Ms: number;
  throughputRps: number;
  costPer1kTokens: number;
  score: number;            // composite 0 – 100
  rankedAt: string;
  testedAt?: string;
}

export interface ABTestResult {
  modelA: { modelId: string; result?: ModelInvocationResult };
  modelB: { modelId: string; result?: ModelInvocationResult };
  input: string;
  resultA: ModelInvocationResult;
  resultB: ModelInvocationResult;
  winner: string;
  marginPercent: number;
  metricsComparison: {
    latencyDiffMs: number;
    scoreDiff: number;
  };
}

export interface TokenUsageDetails {
  prompt: number;
  completion: number;
  total: number;
  valueOf(): number;
}

export interface ModelInvocationResult {
  modelId: string;
  input: string;
  output: string;
  content: string;
  tokensUsed: number & TokenUsageDetails;
  latencyMs: number;
  cost: number;
  costUsd: number;
  timestamp: string;
}

export interface ModelUsageRecord {
  modelId: string;
  totalInvocations: number;
  totalTokens: number;
  totalCost: number;
  avgLatencyMs: number;
  period: string;
}

export type ModelUsageReport = ModelUsageRecord[] & {
  invocations: number;
  totalTokens: number;
  totalCostUsd: number;
  totalCost: number;
  records: ModelUsageRecord[];
};

// ── Engine ───────────────────────────────────────────────────────────────────

export class ModelHubEngine {
  private models: Map<string, HubModel> = new Map();
  private invocations: ModelInvocationResult[] = [];

  constructor() {
    // Seed built-in models
    const builtins: Omit<HubModel, 'registeredAt'>[] = [
      { modelId: 'alp-coder-v3', name: 'ALP Coder v3', provider: 'alp-native', task: 'code-gen', version: '3.0.0', description: 'Next-gen autonomous coding agent model', contextWindow: 128000, costPer1kTokens: 0.003, latencyP50Ms: 160, latencyP99Ms: 400, accuracy: 0.95, totalInvocations: 45000, rating: 4.9, tags: ['code', 'coder', 'alp'] },
      { modelId: 'alp/code-review-v2', name: 'ALP Code Review v2', provider: 'alp', task: 'code-review', version: '2.1.0', description: 'High-accuracy code review with security and style analysis', contextWindow: 128000, costPer1kTokens: 0.003, latencyP50Ms: 180, latencyP99Ms: 450, accuracy: 0.94, totalInvocations: 48200, rating: 4.8, tags: ['review', 'security', 'style'] },
      { modelId: 'alp/code-review-v1', name: 'ALP Code Review v1', provider: 'alp', task: 'code-review', version: '1.0.0', description: 'First-gen code review model', contextWindow: 32000, costPer1kTokens: 0.002, latencyP50Ms: 120, latencyP99Ms: 300, accuracy: 0.87, totalInvocations: 125000, rating: 4.3, tags: ['review', 'legacy'] },
      { modelId: 'alp/test-gen-v1', name: 'ALP Test Generator v1', provider: 'alp', task: 'test-gen', version: '1.2.0', description: 'Generate comprehensive unit and integration tests', contextWindow: 64000, costPer1kTokens: 0.004, latencyP50Ms: 250, latencyP99Ms: 600, accuracy: 0.91, totalInvocations: 32100, rating: 4.6, tags: ['test', 'unit', 'integration'] },
      { modelId: 'openai/gpt-4o', name: 'GPT-4o', provider: 'openai', task: 'general', version: '2024-08-06', description: 'OpenAI flagship multimodal model', contextWindow: 128000, costPer1kTokens: 0.005, latencyP50Ms: 200, latencyP99Ms: 800, accuracy: 0.92, totalInvocations: 500000, rating: 4.7, tags: ['general', 'multimodal', 'gpt-4o'] },
      { modelId: 'anthropic/claude-4-sonnet', name: 'Claude 4 Sonnet', provider: 'anthropic', task: 'code-gen', version: '2026-05-14', description: 'Anthropic flagship coding model with extended thinking', contextWindow: 200000, costPer1kTokens: 0.003, latencyP50Ms: 150, latencyP99Ms: 500, accuracy: 0.95, totalInvocations: 380000, rating: 4.9, tags: ['code', 'reasoning', 'sonnet'] },
      { modelId: 'claude-3-5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'anthropic', task: 'code-gen', version: '2024-10-22', description: 'Anthropic flagship coding model with exceptional reasoning', contextWindow: 200000, costPer1kTokens: 0.003, latencyP50Ms: 160, latencyP99Ms: 520, accuracy: 0.94, totalInvocations: 310000, rating: 4.9, tags: ['code', 'sonnet', 'reasoning'] },
      { modelId: 'google/gemini-3', name: 'Gemini 3', provider: 'google', task: 'general', version: '2026-03-25', description: 'Google DeepMind next-gen model with massive context', contextWindow: 1000000, costPer1kTokens: 0.0035, latencyP50Ms: 170, latencyP99Ms: 550, accuracy: 0.93, totalInvocations: 290000, rating: 4.7, tags: ['general', 'long-context', 'gemini'] },
      { modelId: 'gemini-1-5-pro', name: 'Gemini 1.5 Pro', provider: 'google', task: 'general', version: '002', description: 'Google DeepMind flagship multimodal model', contextWindow: 1000000, costPer1kTokens: 0.0035, latencyP50Ms: 180, latencyP99Ms: 580, accuracy: 0.93, totalInvocations: 250000, rating: 4.8, tags: ['general', 'gemini', 'multimodal'] },
      { modelId: 'alp/security-scan-v1', name: 'ALP Security Scanner v1', provider: 'alp', task: 'security-scan', version: '1.0.0', description: 'SAST/DAST vulnerability detection model', contextWindow: 64000, costPer1kTokens: 0.006, latencyP50Ms: 300, latencyP99Ms: 900, accuracy: 0.96, totalInvocations: 18500, rating: 4.9, tags: ['security', 'sast', 'dast'] },
      { modelId: 'alp/doc-gen-v1', name: 'ALP Doc Generator v1', provider: 'alp', task: 'doc-gen', version: '1.0.0', description: 'Generate API documentation and architecture diagrams', contextWindow: 64000, costPer1kTokens: 0.002, latencyP50Ms: 140, latencyP99Ms: 350, accuracy: 0.89, totalInvocations: 9800, rating: 4.4, tags: ['docs', 'api', 'diagrams'] },
    ];

    for (const m of builtins) {
      this.models.set(m.modelId, { ...m, registeredAt: '2026-01-01T00:00:00Z' });
    }
  }

  /**
   * Register a new model in the hub.
   */
  public registerModel(
    modelId: string,
    name: string,
    task: ModelTask,
    provider: ModelProvider,
    config: Partial<Pick<HubModel, 'version' | 'description' | 'contextWindow' | 'costPer1kTokens' | 'tags'>> = {}
  ): HubModel {
    const model: HubModel = {
      modelId,
      name,
      provider,
      task,
      version: config.version ?? '1.0.0',
      description: config.description ?? `${name} — ${task} model by ${provider}`,
      contextWindow: config.contextWindow ?? 32000,
      costPer1kTokens: config.costPer1kTokens ?? 0.01,
      latencyP50Ms: 100 + Math.floor(Math.random() * 200),
      latencyP99Ms: 300 + Math.floor(Math.random() * 500),
      accuracy: 0.8 + Math.random() * 0.15,
      totalInvocations: 0,
      rating: 4.0 + Math.random() * 1.0,
      tags: config.tags ?? [task],
      registeredAt: new Date().toISOString(),
    };
    this.models.set(modelId, model);
    return model;
  }

  /**
   * Search/filter models.
   */
  public searchModels(query?: string, task?: ModelTask, provider?: ModelProvider): HubModel[] {
    let results = [...this.models.values()];

    if (task) {
      const tNorm = task.toLowerCase().replace(/[_-]/g, '');
      results = results.filter(m => m.task.toLowerCase().replace(/[_-]/g, '') === tNorm);
    }
    if (provider) {
      const pNorm = provider.toLowerCase();
      results = results.filter(m => {
        const mp = m.provider.toLowerCase();
        if (mp === pNorm) return true;
        if (pNorm === 'alp-native' && (mp === 'alp' || mp === 'alp-native')) return true;
        if (pNorm === 'alp' && (mp === 'alp-native' || mp === 'alp')) return true;
        return false;
      });
    }
    if (query) {
      const q = query.toLowerCase();
      results = results.filter(m =>
        m.modelId.toLowerCase().includes(q) ||
        m.name.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q) ||
        m.tags.some(t => t.toLowerCase().includes(q))
      );
    }

    return results.sort((a, b) => b.rating - a.rating);
  }

  /**
   * Get a single model by ID.
   */
  public getModel(modelId: string): HubModel | undefined {
    if (this.models.has(modelId)) return this.models.get(modelId);
    const normalized = modelId.toLowerCase();
    for (const m of this.models.values()) {
      if (m.modelId.toLowerCase() === normalized) return m;
      if (m.modelId.toLowerCase().endsWith('/' + normalized)) return m;
      if (m.name.toLowerCase() === normalized) return m;
      if (m.modelId.toLowerCase().replace(/[-_/]/g, '') === normalized.replace(/[-_/]/g, '')) return m;
    }
    return undefined;
  }

  /**
   * Simulate invoking a model.
   */
  public invokeModel(modelId: string, input: string): ModelInvocationResult {
    const model = this.getModel(modelId);
    if (!model) throw new Error(`Model '${modelId}' not found.`);

    const promptTokens = Math.max(20, Math.floor(input.length / 4));
    const completionTokens = Math.floor(Math.random() * 150) + 30;
    const totalTokens = promptTokens + completionTokens;
    const latencyMs = model.latencyP50Ms + Math.floor(Math.random() * (model.latencyP99Ms - model.latencyP50Ms));
    const cost = Math.round(((totalTokens / 1000) * model.costPer1kTokens) * 10000) / 10000;

    const tokensUsedObj = Object.assign(Number(totalTokens), {
      prompt: promptTokens,
      completion: completionTokens,
      total: totalTokens,
      valueOf: () => totalTokens,
      toString: () => String(totalTokens),
    });

    const outputText = `[${model.name}] Processed: "${input.substring(0, 60)}${input.length > 60 ? '...' : ''}" (${totalTokens} tokens)`;

    const result: ModelInvocationResult = {
      modelId: model.modelId,
      input,
      output: outputText,
      content: outputText,
      tokensUsed: tokensUsedObj as any,
      latencyMs,
      cost,
      costUsd: cost,
      timestamp: new Date().toISOString(),
    };

    this.invocations.push(result);
    model.totalInvocations++;
    return result;
  }

  /**
   * Benchmark a model with standardized metrics.
   */
  public benchmarkModel(modelId: string): ModelBenchmark {
    const model = this.getModel(modelId);
    if (!model) throw new Error(`Model '${modelId}' not found.`);

    const throughputRps = Math.round(1000 / model.latencyP50Ms * 10) / 10;
    const accuracyScore = model.accuracy * 40;
    const latencyScore = Math.max(0, 30 - (model.latencyP50Ms / 20));
    const costScore = Math.max(0, 20 - (model.costPer1kTokens * 1000));
    const throughputScore = Math.min(10, throughputRps);
    const score = Math.round(accuracyScore + latencyScore + costScore + throughputScore);

    return {
      modelId: model.modelId,
      task: model.task,
      accuracy: model.accuracy,
      latencyP50Ms: model.latencyP50Ms,
      latencyP99Ms: model.latencyP99Ms,
      throughputRps,
      costPer1kTokens: model.costPer1kTokens,
      score,
      rankedAt: new Date().toISOString(),
      testedAt: new Date().toISOString(),
    };
  }

  /**
   * A/B test two models head-to-head on the same input.
   */
  public abTest(modelAId: string, modelBId: string, input: string): ABTestResult {
    const resultA = this.invokeModel(modelAId, input);
    const resultB = this.invokeModel(modelBId, input);

    const benchA = this.benchmarkModel(modelAId);
    const benchB = this.benchmarkModel(modelBId);

    let winner = 'TIE';
    if (benchA.score > benchB.score) winner = resultA.modelId;
    else if (benchB.score > benchA.score) winner = resultB.modelId;

    const margin = Math.abs(benchA.score - benchB.score);
    const marginPercent = Math.round((margin / Math.max(benchA.score, benchB.score)) * 10000) / 100;

    return {
      modelA: { modelId: resultA.modelId, result: resultA },
      modelB: { modelId: resultB.modelId, result: resultB },
      input,
      resultA,
      resultB,
      winner,
      marginPercent,
      metricsComparison: {
        latencyDiffMs: Math.abs(resultA.latencyMs - resultB.latencyMs),
        scoreDiff: Math.abs(benchA.score - benchB.score),
      },
    };
  }

  /**
   * Get usage report for a specific model or all models.
   */
  public getUsageReport(modelId?: string): ModelUsageReport {
    const grouped = new Map<string, ModelInvocationResult[]>();

    const targetModel = modelId ? this.getModel(modelId) : undefined;
    const filterId = targetModel ? targetModel.modelId : modelId;

    for (const inv of this.invocations) {
      if (filterId && inv.modelId !== filterId) continue;
      if (!grouped.has(inv.modelId)) grouped.set(inv.modelId, []);
      grouped.get(inv.modelId)!.push(inv);
    }

    const records: ModelUsageRecord[] = [];
    let sumTokens = 0;
    let sumCost = 0;
    let sumInvocations = 0;

    for (const [id, invs] of grouped) {
      const totalTokens = invs.reduce((s, i) => s + (typeof i.tokensUsed === 'number' ? i.tokensUsed : (i.tokensUsed as any).total || 0), 0);
      const totalCost = invs.reduce((s, i) => s + (i.cost || i.costUsd || 0), 0);
      const avgLatency = invs.reduce((s, i) => s + i.latencyMs, 0) / invs.length;

      sumTokens += totalTokens;
      sumCost += totalCost;
      sumInvocations += invs.length;

      records.push({
        modelId: id,
        totalInvocations: invs.length,
        totalTokens,
        totalCost: Math.round(totalCost * 10000) / 10000,
        avgLatencyMs: Math.round(avgLatency),
        period: 'current-session',
      });
    }

    const sorted = records.sort((a, b) => b.totalInvocations - a.totalInvocations);
    return Object.assign(sorted, {
      invocations: sumInvocations,
      totalTokens: sumTokens,
      totalCostUsd: Math.round(sumCost * 10000) / 10000,
      totalCost: Math.round(sumCost * 10000) / 10000,
      records: sorted,
    });
  }
}
