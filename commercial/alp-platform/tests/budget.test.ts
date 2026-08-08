import { describe, it, expect } from "vitest";
import { CostBudgetEngine } from "../src/budget/cost-engine";

describe("CostBudgetEngine", () => {
  it("creates a budget with defaults", () => {
    const engine = new CostBudgetEngine();
    const budget = engine.createBudget("task-1", 1000, 0.05);

    expect(budget.id).toBe("budget-task-1");
    expect(budget.taskId).toBe("task-1");
    expect(budget.maxTokens).toBe(1000);
    expect(budget.maxCostUsd).toBe(0.05);
    expect(budget.usedTokens).toBe(0);
    expect(budget.usedCostUsd).toBe(0);
    expect(budget.provider).toBe("openai");
    expect(budget.modelTier).toBe("standard");
    expect(budget.createdAt).toBeDefined();
  });

  it("tracks usage and reports remaining", () => {
    const engine = new CostBudgetEngine();
    const budget = engine.createBudget("task-1", 1000, 0.05);

    const result = engine.trackUsage(budget.id, 300, 0.02);
    expect(result.remainingCostUsd).toBeCloseTo(0.03);
    expect(result.remainingTokens).toBe(700);
    expect(result.isExceeded).toBe(false);
  });

  it("flags exceeded budgets", () => {
    const engine = new CostBudgetEngine();
    const budget = engine.createBudget("task-1", 1000, 0.05);

    engine.trackUsage(budget.id, 500, 0.03);
    const result = engine.trackUsage(budget.id, 600, 0.03);

    expect(result.isExceeded).toBe(true);
    expect(result.remainingCostUsd).toBeCloseTo(0);
    expect(result.remainingTokens).toBeCloseTo(0);
  });

  it("returns empty result for unknown budget", () => {
    const engine = new CostBudgetEngine();

    const result = engine.trackUsage("unknown", 100, 0.01);
    expect(result).toEqual({ remainingCostUsd: 0, remainingTokens: 0, isExceeded: true, alertsTriggered: [] });
  });

  it("selects frontier model for high complexity and high budget", () => {
    const engine = new CostBudgetEngine();
    const result = engine.selectOptimalModel("high", 0.10);

    expect(["openai", "anthropic", "moonshot"]).toContain(result.provider);
    expect(result.estimatedCostPer1k).toBeGreaterThan(0);
    expect(result.reason).toBeDefined();
  });

  it("selects budget model for low budget", () => {
    const engine = new CostBudgetEngine();
    const result = engine.selectOptimalModel("low", 0.001);

    expect(result.provider).toBe("openai");
    expect(result.model).toBe("gpt-4o-mini");
    expect(result.estimatedCostPer1k).toBeGreaterThanOrEqual(0);
  });

  it("selects standard model for medium complexity", () => {
    const engine = new CostBudgetEngine();
    const result = engine.selectOptimalModel("medium", 0.02);

    expect(result.estimatedCostPer1k).toBeGreaterThan(0);
  });

  it("respects minimum context window", () => {
    const engine = new CostBudgetEngine();
    const result = engine.selectOptimalModel("medium", 0.02, 500000);

    expect(result.provider).not.toBe("ollama");
  });

  it("aggregates total spend", () => {
    const engine = new CostBudgetEngine();
    const b1 = engine.createBudget("task-1", 1000, 0.05);
    const b2 = engine.createBudget("task-2", 2000, 0.10);

    engine.trackUsage(b1.id, 100, 0.01);
    engine.trackUsage(b2.id, 500, 0.04);

    const totals = engine.getTotalSpend();
    expect(totals.totalCostUsd).toBeCloseTo(0.05);
    expect(totals.totalTokens).toBe(600);
  });

  it("filters budgets by provider", () => {
    const engine = new CostBudgetEngine();
    engine.createBudget("task-1", 1000, 0.05, "openai");
    engine.createBudget("task-2", 2000, 0.10, "anthropic");

    const openaiBudgets = engine.getBudgetsByProvider("openai");
    expect(openaiBudgets).toHaveLength(1);
    expect(openaiBudgets[0].provider).toBe("openai");
  });
});
