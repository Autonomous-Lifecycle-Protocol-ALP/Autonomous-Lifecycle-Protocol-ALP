export interface CostBudget {
  id: string;
  taskId: string;
  maxTokens: number;
  maxCostUsd: number;
  usedTokens: number;
  usedCostUsd: number;
  provider: string;
  modelTier: string;
  createdAt: string;
}

export interface ModelCostEntry {
  provider: string;
  model: string;
  costPer1kInput: number;
  costPer1kOutput: number;
  contextWindow: number;
  tier: "budget" | "standard" | "premium" | "frontier";
}

export interface ModelSelectionResult {
  provider: string;
  model: string;
  estimatedCostPer1k: number;
  reason: string;
}

const DEFAULT_MODEL_COSTS: ModelCostEntry[] = [
  { provider: "openai", model: "gpt-4o-mini", costPer1kInput: 0.00015, costPer1kOutput: 0.0006, contextWindow: 128000, tier: "budget" },
  { provider: "openai", model: "gpt-5.5", costPer1kInput: 0.005, costPer1kOutput: 0.03, contextWindow: 1000000, tier: "frontier" },
  { provider: "openai", model: "gpt-5.5-instant", costPer1kInput: 0.005, costPer1kOutput: 0.03, contextWindow: 1000000, tier: "standard" },
  { provider: "anthropic", model: "claude-3-5-haiku", costPer1kInput: 0.0008, costPer1kOutput: 0.004, contextWindow: 200000, tier: "budget" },
  { provider: "anthropic", model: "claude-sonnet-4", costPer1kInput: 0.003, costPer1kOutput: 0.015, contextWindow: 1000000, tier: "standard" },
  { provider: "anthropic", model: "claude-opus-4.8", costPer1kInput: 0.005, costPer1kOutput: 0.025, contextWindow: 1000000, tier: "premium" },
  { provider: "ollama", model: "llama3.2-local", costPer1kInput: 0, costPer1kOutput: 0, contextWindow: 128000, tier: "budget" },
  { provider: "moonshot", model: "kimi-k2.6", costPer1kInput: 0.00095, costPer1kOutput: 0.004, contextWindow: 262144, tier: "standard" },
  { provider: "moonshot", model: "kimi-k3", costPer1kInput: 0.003, costPer1kOutput: 0.015, contextWindow: 1000000, tier: "premium" },
  { provider: "deepseek", model: "deepseek-v4", costPer1kInput: 0.0002, costPer1kOutput: 0.0008, contextWindow: 128000, tier: "budget" },
  { provider: "groq", model: "groq-fast", costPer1kInput: 0.0001, costPer1kOutput: 0.0005, contextWindow: 128000, tier: "budget" },
];

export class CostBudgetEngine {
  private readonly budgets = new Map<string, CostBudget>();
  private readonly modelCosts: ModelCostEntry[];

  constructor(modelCosts: ModelCostEntry[] = DEFAULT_MODEL_COSTS) {
    this.modelCosts = modelCosts;
  }

  createBudget(
    taskId: string,
    maxTokens: number,
    maxCostUsd: number,
    provider = "openai",
    modelTier = "standard",
  ): CostBudget {
    const budget: CostBudget = {
      id: `budget-${taskId}`,
      taskId,
      maxTokens,
      maxCostUsd,
      usedTokens: 0,
      usedCostUsd: 0,
      provider,
      modelTier,
      createdAt: new Date().toISOString(),
    };

    this.budgets.set(budget.id, budget);
    return budget;
  }

  trackUsage(budgetId: string, tokensUsed: number, costUsd: number): {
    remainingCostUsd: number;
    remainingTokens: number;
    isExceeded: boolean;
  } {
    const budget = this.budgets.get(budgetId);
    if (!budget) {
      return { remainingCostUsd: 0, remainingTokens: 0, isExceeded: true };
    }

    budget.usedTokens += tokensUsed;
    budget.usedCostUsd += costUsd;

    const remainingCost = Math.max(0, budget.maxCostUsd - budget.usedCostUsd);
    const remainingTokens = Math.max(0, budget.maxTokens - budget.usedTokens);
    const isExceeded = budget.usedCostUsd > budget.maxCostUsd || budget.usedTokens > budget.maxTokens;

    return { remainingCostUsd: remainingCost, remainingTokens: remainingTokens, isExceeded };
  }

  selectOptimalModel(
    taskComplexity: "low" | "medium" | "high",
    maxCostUsd: number,
    minContextWindow = 0,
  ): ModelSelectionResult {
    const candidates = this.modelCosts.filter((entry) => {
      if (minContextWindow > 0 && entry.contextWindow < minContextWindow) {
        return false;
      }
      return true;
    });

    if (taskComplexity === "high" && maxCostUsd >= 0.10) {
      const premium = candidates.filter((e) => e.tier === "frontier" || e.tier === "premium");
      const pick = premium[0] ?? candidates[0];
      return {
        provider: pick.provider,
        model: pick.model,
        estimatedCostPer1k: pick.costPer1kInput,
        reason: "High complexity task with sufficient budget for frontier model",
      };
    }

    if (taskComplexity === "medium" || maxCostUsd >= 0.02) {
      const standard = candidates.filter((e) => e.tier === "standard" || e.tier === "premium");
      const pick = standard[0] ?? candidates[0];
      return {
        provider: pick.provider,
        model: pick.model,
        estimatedCostPer1k: pick.costPer1kInput,
        reason: "Medium complexity or moderate budget; standard-tier model selected",
      };
    }

    const budget = candidates.filter((e) => e.tier === "budget");
    const pick = budget[0] ?? candidates[0];
    return {
      provider: pick.provider,
      model: pick.model,
      estimatedCostPer1k: pick.costPer1kInput,
      reason: "Low budget constraint; cheapest capable model selected",
    };
  }

  getBudget(budgetId: string): CostBudget | undefined {
    return this.budgets.get(budgetId);
  }

  getBudgetsByProvider(provider: string): CostBudget[] {
    return Array.from(this.budgets.values()).filter((b) => b.provider === provider);
  }

  getTotalSpend(): { totalCostUsd: number; totalTokens: number } {
    let totalCost = 0;
    let totalTokens = 0;
    for (const budget of this.budgets.values()) {
      totalCost += budget.usedCostUsd;
      totalTokens += budget.usedTokens;
    }
    return { totalCostUsd: totalCost, totalTokens };
  }
}
