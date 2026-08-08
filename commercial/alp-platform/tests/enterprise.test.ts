import { describe, it, expect } from "vitest";
import { ResearchWorkbench } from "../src/research/workbench";
import { AuditLogger } from "../src/governance/audit-log";
import { CostManager } from "../src/governance/cost-manager";
import { VoiceMultimodalEngine } from "../src/multimodal/voice";
import { DistributedAgentNetwork } from "../src/distributed/network";
import { SelfImprovingCodebase } from "../src/self-improving/engine";

describe("ResearchWorkbench", () => {
  it("creates a research task", () => {
    const bench = new ResearchWorkbench();
    const task = bench.createTask("literature_review", "quantum computing");
    expect(task.type).toBe("literature_review");
    expect(task.status).toBe("pending");
  });

  it("executes a research task", async () => {
    const bench = new ResearchWorkbench();
    const task = bench.createTask("data_analysis", "climate data");
    const result = await bench.execute(task.id);
    expect(result?.status).toBe("completed");
    expect(result?.result).toBeDefined();
  });

  it("lists all tasks", async () => {
    const bench = new ResearchWorkbench();
    const task = bench.createTask("hypothesis_test", "gravity");
    await bench.execute(task.id);
    const tasks = bench.listTasks();
    expect(tasks.length).toBe(1);
    expect(tasks[0].id).toBe(task.id);
  });
});

describe("AuditLogger", () => {
  it("logs an entry", () => {
    const logger = new AuditLogger();
    const entry = logger.log({ actor: "user-1", action: "create_project", result: "success" });
    expect(entry.id).toBeDefined();
    expect(entry.timestamp).toBeDefined();
  });

  it("filters entries by actor", () => {
    const logger = new AuditLogger();
    logger.log({ actor: "user-1", action: "create_project", result: "success" });
    logger.log({ actor: "user-2", action: "delete_project", result: "failure" });
    const entries = logger.getEntries({ actor: "user-1" });
    expect(entries.length).toBe(1);
  });

  it("returns recent entries", () => {
    const logger = new AuditLogger();
    for (let i = 0; i < 5; i++) {
      logger.log({ actor: `user-${i}`, action: "test", result: "success" });
    }
    const recent = logger.getRecent(3);
    expect(recent.length).toBe(3);
  });

  it("enforces max entries", () => {
    const logger = new AuditLogger({ maxEntries: 10 });
    for (let i = 0; i < 15; i++) {
      logger.log({ actor: `user-${i}`, action: "test", result: "success" });
    }
    expect(logger.size).toBe(10);
  });
});

describe("CostManager", () => {
  it("creates and tracks a budget", () => {
    const manager = new CostManager();
    const budget = manager.createBudget("task-1", 1000, 5);
    expect(budget.maxTokens).toBe(1000);

    const usage = manager.trackUsage(budget.id, 100, 0.5);
    expect(usage.remainingTokens).toBe(900);
    expect(usage.remainingCostUsd).toBeCloseTo(4.5);
  });

  it("selects optimal model", () => {
    const manager = new CostManager();
    const result = manager.selectOptimalModel("low", 0.01);
    expect(result.provider).toBeDefined();
    expect(result.model).toBeDefined();
    expect(result.reason).toBeDefined();
  });

  it("returns total spend", () => {
    const manager = new CostManager();
    const budget = manager.createBudget("task-1", 1000, 5);
    manager.trackUsage(budget.id, 100, 0.5);
    const spend = manager.getTotalSpend();
    expect(spend.totalCostUsd).toBeCloseTo(0.5);
    expect(spend.totalTokens).toBe(100);
  });
});

describe("VoiceMultimodalEngine", () => {
  it("creates a voice session", () => {
    const engine = new VoiceMultimodalEngine();
    const session = engine.startSession({ language: "en" });
    expect(session.status).toBe("idle");
    expect(session.sessionId).toBeDefined();
  });

  it("processes text input", async () => {
    const engine = new VoiceMultimodalEngine();
    const session = engine.startSession();
    const result = await engine.processInput(session.sessionId, { type: "text", data: "Hello" });
    expect(result.transcript).toBe("Hello");
  });

  it("throws for unknown session", async () => {
    const engine = new VoiceMultimodalEngine();
    await expect(engine.processInput("unknown", { type: "text", data: "Hello" })).rejects.toThrow("Session not found");
  });

  it("ends session", () => {
    const engine = new VoiceMultimodalEngine();
    const session = engine.startSession();
    expect(engine.endSession(session.sessionId)).toBe(true);
    expect(engine.getSession(session.sessionId)).toBeUndefined();
  });
});

describe("DistributedAgentNetwork", () => {
  it("registers and lists nodes", () => {
    const network = new DistributedAgentNetwork();
    network.registerNode({
      nodeId: "node-1",
      address: "http://192.168.1.1",
      capabilities: ["coding"],
      status: "online",
      lastSeen: new Date().toISOString(),
    });
    expect(network.listNodes().length).toBe(1);
  });

  it("dispatches tasks to online nodes", () => {
    const network = new DistributedAgentNetwork();
    network.registerNode({
      nodeId: "node-1",
      address: "http://192.168.1.1",
      capabilities: ["coding"],
      status: "online",
      lastSeen: new Date().toISOString(),
    });
    const task = network.dispatchTask({ taskId: "task-1", payload: {}, status: "pending", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    expect(task?.assignedNode).toBe("node-1");
    expect(task?.status).toBe("dispatched");
  });

  it("returns undefined when no nodes available", () => {
    const network = new DistributedAgentNetwork();
    const task = network.dispatchTask({ taskId: "task-1", payload: {}, status: "pending", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    expect(task).toBeUndefined();
  });

  it("enforces max nodes limit", () => {
    const network = new DistributedAgentNetwork({ maxNodes: 2 });
    network.registerNode({
      nodeId: "node-1",
      address: "http://192.168.1.1",
      capabilities: ["coding"],
      status: "online",
      lastSeen: new Date().toISOString(),
    });
    network.registerNode({
      nodeId: "node-2",
      address: "http://192.168.1.2",
      capabilities: ["coding"],
      status: "online",
      lastSeen: new Date().toISOString(),
    });
    expect(() => network.registerNode({
      nodeId: "node-3",
      address: "http://192.168.1.3",
      capabilities: ["coding"],
      status: "online",
      lastSeen: new Date().toISOString(),
    })).toThrow("Maximum node count reached");
  });

  it("routes tasks to nodes with matching capabilities", () => {
    const network = new DistributedAgentNetwork();
    network.registerNode({
      nodeId: "node-1",
      address: "http://192.168.1.1",
      capabilities: ["coding"],
      status: "online",
      lastSeen: new Date().toISOString(),
    });
    network.registerNode({
      nodeId: "node-2",
      address: "http://192.168.1.2",
      capabilities: ["testing", "deployment"],
      status: "online",
      lastSeen: new Date().toISOString(),
    });

    const task = network.dispatchTask({
      taskId: "task-cap",
      payload: { capabilities: ["testing"] },
      status: "pending",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    expect(task?.assignedNode).toBe("node-2");
  });

  it("prunes stale nodes after heartbeat timeout", async () => {
    const network = new DistributedAgentNetwork({ heartbeatIntervalMs: 200, heartbeatTimeoutMs: 1000 });
    network.registerNode({
      nodeId: "node-1",
      address: "http://192.168.1.1",
      capabilities: ["coding"],
      status: "online",
      lastSeen: new Date(Date.now() - 2000).toISOString(),
    });

    network.startHeartbeatLoop();
    await new Promise((resolve) => setTimeout(resolve, 1100));

    expect(network.getNode("node-1")?.status).toBe("offline");
    network.stopHeartbeatLoop();
  });
});

describe("SelfImprovingCodebase", () => {
  it("reviews code and detects console.log", () => {
    const engine = new SelfImprovingCodebase();
    const review = engine.review("app.js", "console.log('debug');");
    expect(review.issues.length).toBeGreaterThan(0);
    expect(review.issues[0].severity).toBe("warning");
  });

  it("generates test scaffolding", () => {
    const engine = new SelfImprovingCodebase();
    const tests = engine.generateTests("app.js", "");
    expect(tests.length).toBeGreaterThan(0);
    expect(tests[0]).toContain("describe");
  });

  it("analyzes performance", () => {
    const engine = new SelfImprovingCodebase();
    const longContent = Array(250).fill("const x = 1;").join("\n");
    const report = engine.analyzePerformance("app.js", longContent);
    expect(report.metrics.complexity).toBeGreaterThan(0);
    expect(report.metrics.suggestions.length).toBeGreaterThan(0);
  });

  it("auto-fixes console.log when enabled", () => {
    const engine = new SelfImprovingCodebase({ autoFix: true });
    const result = engine.improve("app.js", "console.log('debug');\nconst x = 1;");
    expect(result.changes).toContain("Removed console.log statements");
    expect(result.content).not.toContain("console.log");
  });
});
