import { describe, test, expect } from "vitest";
import { CostBudgetEngine } from "../src/budget/cost-engine";

describe("CostBudgetEngine Threshold Alerts & Allocation", () => {
  test("triggers threshold alerts at configured percentage steps", () => {
    const engine = new CostBudgetEngine();
    const budget = engine.createBudget("task-alerts", 10000, 10.0, "openai", "standard", {
      department: "Engineering",
      team: "Backend",
      thresholdAlerts: [50, 80, 100],
    });

    expect(budget.department).toBe("Engineering");

    // Track 40% usage -> no alert
    let usage = engine.trackUsage(budget.id, 4000, 4.0);
    expect(usage.alertsTriggered).toEqual([]);

    // Track additional 20% usage -> triggers 50% alert
    usage = engine.trackUsage(budget.id, 2000, 2.0);
    expect(usage.alertsTriggered).toEqual([50]);

    // Track additional 30% usage -> triggers 80% alert
    usage = engine.trackUsage(budget.id, 3000, 3.0);
    expect(usage.alertsTriggered).toEqual([80]);

    // Alert for 50 and 80 should not re-trigger
    usage = engine.trackUsage(budget.id, 100, 0.1);
    expect(usage.alertsTriggered).toEqual([]);
  });

  test("calculates spend by department and burn rate", () => {
    const engine = new CostBudgetEngine();
    const b1 = engine.createBudget("t1", 5000, 5.0, "openai", "standard", { department: "Engineering" });
    const b2 = engine.createBudget("t2", 3000, 3.0, "anthropic", "standard", { department: "Marketing" });

    engine.trackUsage(b1.id, 2000, 2.0);
    engine.trackUsage(b2.id, 1000, 1.0);

    const engSpend = engine.getSpendByDepartment("Engineering");
    expect(engSpend.totalCostUsd).toBe(2.0);
    expect(engSpend.totalTokens).toBe(2000);

    const burnRate = engine.calculateBurnRate(b1.id);
    expect(burnRate.costPerMinuteUsd).toBeGreaterThanOrEqual(0);
    expect(burnRate.tokensPerMinute).toBeGreaterThanOrEqual(0);
  });
});
