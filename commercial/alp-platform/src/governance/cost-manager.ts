import type { CostBudget, ModelSelectionResult } from "../types";
import { CostBudgetEngine } from "../budget/cost-engine";

export interface CostManagerOptions {
  defaultBudget?: Partial<CostBudget>;
}

export class CostManager {
  private readonly engine: CostBudgetEngine;
  private readonly defaultBudget: Partial<CostBudget>;

  constructor(options: CostManagerOptions = {}) {
    this.engine = new CostBudgetEngine();
    this.defaultBudget = options.defaultBudget ?? {};
  }

  createBudget(taskId: string, maxTokens: number, maxCostUsd: number, provider = "openai", modelTier = "standard"): CostBudget {
    return this.engine.createBudget(taskId, maxTokens, maxCostUsd, provider, modelTier);
  }

  trackUsage(budgetId: string, tokensUsed: number, costUsd: number) {
    return this.engine.trackUsage(budgetId, tokensUsed, costUsd);
  }

  selectOptimalModel(taskComplexity: "low" | "medium" | "high", maxCostUsd: number, minContextWindow = 0): ModelSelectionResult {
    return this.engine.selectOptimalModel(taskComplexity, maxCostUsd, minContextWindow);
  }

  getBudget(budgetId: string): CostBudget | undefined {
    return this.engine.getBudget(budgetId);
  }

  getTotalSpend() {
    return this.engine.getTotalSpend();
  }

  getBudgetsByProvider(provider: string): CostBudget[] {
    return this.engine.getBudgetsByProvider(provider);
  }
}
