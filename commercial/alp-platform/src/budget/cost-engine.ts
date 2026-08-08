export interface CostBudget {
  id: string;
  taskId: string;
  maxTokens: number;
  maxCostUsd: number;
  usedTokens: number;
  usedCostUsd: number;
  provider: string;
  modelTier: string;
  department?: string;
  team?: string;
  thresholdAlerts?: number[];
  triggeredAlerts?: number[];
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
    options?: { department?: string; team?: string; thresholdAlerts?: number[] },
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
      department: options?.department,
      team: options?.team,
      thresholdAlerts: options?.thresholdAlerts ?? [50, 80, 100],
      triggeredAlerts: [],
      createdAt: new Date().toISOString(),
    };

    this.budgets.set(budget.id, budget);
    return budget;
  }

  trackUsage(budgetId: string, tokensUsed: number, costUsd: number): {
    remainingCostUsd: number;
    remainingTokens: number;
    isExceeded: boolean;
    alertsTriggered: number[];
  } {
    const budget = this.budgets.get(budgetId);
    if (!budget) {
      return { remainingCostUsd: 0, remainingTokens: 0, isExceeded: true, alertsTriggered: [] };
    }

    budget.usedTokens += tokensUsed;
    budget.usedCostUsd += costUsd;

    const remainingCost = Math.max(0, budget.maxCostUsd - budget.usedCostUsd);
    const remainingTokens = Math.max(0, budget.maxTokens - budget.usedTokens);
    const isExceeded = budget.usedCostUsd > budget.maxCostUsd || budget.usedTokens > budget.maxTokens;

    const percentageUsed = Math.min(100, Math.floor((budget.usedCostUsd / budget.maxCostUsd) * 100));
    const newAlerts: number[] = [];

    if (budget.thresholdAlerts) {
      for (const threshold of budget.thresholdAlerts) {
        if (percentageUsed >= threshold && !budget.triggeredAlerts?.includes(threshold)) {
          if (!budget.triggeredAlerts) budget.triggeredAlerts = [];
          budget.triggeredAlerts.push(threshold);
          newAlerts.push(threshold);
        }
      }
    }

    return {
      remainingCostUsd: remainingCost,
      remainingTokens: remainingTokens,
      isExceeded,
      alertsTriggered: newAlerts,
    };
  }

  calculateBurnRate(budgetId: string): {
    tokensPerMinute: number;
    costPerMinuteUsd: number;
    estimatedMinutesRemaining: number;
  } {
    const budget = this.budgets.get(budgetId);
    if (!budget) {
      return { tokensPerMinute: 0, costPerMinuteUsd: 0, estimatedMinutesRemaining: 0 };
    }

    const elapsedMs = Math.max(1000, Date.now() - new Date(budget.createdAt).getTime());
    const elapsedMinutes = elapsedMs / 60000;

    const tokensPerMinute = budget.usedTokens / elapsedMinutes;
    const costPerMinuteUsd = budget.usedCostUsd / elapsedMinutes;

    const remainingCost = Math.max(0, budget.maxCostUsd - budget.usedCostUsd);
    const estimatedMinutesRemaining = costPerMinuteUsd > 0 ? remainingCost / costPerMinuteUsd : Infinity;

    return {
      tokensPerMinute: Math.round(tokensPerMinute * 100) / 100,
      costPerMinuteUsd: Math.round(costPerMinuteUsd * 10000) / 10000,
      estimatedMinutesRemaining: Math.round(estimatedMinutesRemaining * 10) / 10,
    };
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

  getSpendByDepartment(department: string): { totalCostUsd: number; totalTokens: number } {
    let totalCost = 0;
    let totalTokens = 0;
    for (const budget of this.budgets.values()) {
      if (budget.department === department) {
        totalCost += budget.usedCostUsd;
        totalTokens += budget.usedTokens;
      }
    }
    return { totalCostUsd: totalCost, totalTokens };
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
