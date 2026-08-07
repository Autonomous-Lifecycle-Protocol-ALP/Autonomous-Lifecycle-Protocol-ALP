import { describe, it, expect } from "vitest";
import { WorkflowEngine } from "../src/workflow/engine";
import type { WorkflowDefinition } from "../src/types";

describe("WorkflowEngine", () => {
  it("registers and retrieves workflows", () => {
    const engine = new WorkflowEngine();
    const workflow: WorkflowDefinition = {
      id: "wf-1",
      name: "Deploy pipeline",
      description: "Deploy to production",
      steps: [
        { id: "step-1", name: "Build", type: "task", config: {} },
        { id: "step-2", name: "Test", type: "task", config: {}, dependencies: ["step-1"] },
      ],
      triggers: ["push"],
    };

    engine.registerWorkflow(workflow);
    const retrieved = engine.getWorkflow("wf-1");
    expect(retrieved?.name).toBe("Deploy pipeline");
    expect(retrieved?.steps.length).toBe(2);
  });

  it("starts a workflow run", () => {
    const engine = new WorkflowEngine();
    engine.registerWorkflow({
      id: "wf-1",
      name: "Deploy",
      description: "Deploy",
      steps: [],
      triggers: [],
    });

    const run = engine.startRun("wf-1", { branch: "main" });
    expect(run?.status).toBe("running");
    expect(run?.workflowId).toBe("wf-1");
    expect(run?.results).toEqual({ branch: "main" });
  });

  it("completes a step", () => {
    const engine = new WorkflowEngine();
    engine.registerWorkflow({
      id: "wf-1",
      name: "Deploy",
      description: "Deploy",
      steps: [],
      triggers: [],
    });

    const run = engine.startRun("wf-1")!;
    const updated = engine.completeStep(run.runId, "step-1", { ok: true });
    expect(updated?.results["step-1"]).toEqual({ ok: true });
    expect(updated?.currentStep).toBe("step-1");
  });

  it("fails and cancels runs", () => {
    const engine = new WorkflowEngine();
    engine.registerWorkflow({
      id: "wf-1",
      name: "Deploy",
      description: "Deploy",
      steps: [],
      triggers: [],
    });

    const run = engine.startRun("wf-1")!;
    const failed = engine.failRun(run.runId, "Build error");
    expect(failed?.status).toBe("failed");
    expect(failed?.error).toBe("Build error");

    const cancelled = engine.cancelRun(run.runId);
    expect(cancelled).toBeUndefined();
  });

  it("lists all workflows", () => {
    const engine = new WorkflowEngine();
    engine.registerWorkflow({
      id: "wf-1",
      name: "Deploy",
      description: "Deploy",
      steps: [],
      triggers: [],
    });
    engine.registerWorkflow({
      id: "wf-2",
      name: "Test",
      description: "Test",
      steps: [],
      triggers: [],
    });

    const workflows = engine.listWorkflows();
    expect(workflows.length).toBe(2);
  });

  it("executes steps in dependency order", async () => {
    const engine = new WorkflowEngine();
    const executionOrder: string[] = [];

    engine.registerExecutor("task", async (step) => {
      executionOrder.push(step.id);
      return { done: true };
    });

    engine.registerWorkflow({
      id: "wf-ordered",
      name: "Ordered",
      description: "Dependency order",
      steps: [
        { id: "step-1", name: "First", type: "task", config: {} },
        { id: "step-2", name: "Second", type: "task", config: {}, dependencies: ["step-1"] },
        { id: "step-3", name: "Third", type: "task", config: {}, dependencies: ["step-2"] },
      ],
      triggers: [],
    });

    const run = engine.startRun("wf-ordered")!;
    await engine.executeAll(run.runId);

    expect(executionOrder).toEqual(["step-1", "step-2", "step-3"]);
    const finalRun = engine.getRun(run.runId);
    expect(finalRun?.status).toBe("completed");
  });

  it("retries failing steps", async () => {
    const engine = new WorkflowEngine();
    let attempts = 0;

    engine.registerExecutor("task", async () => {
      attempts++;
      if (attempts < 3) {
        throw new Error(`Attempt ${attempts} failed`);
      }
      return { done: true };
    });

    engine.registerWorkflow({
      id: "wf-retry",
      name: "Retry",
      description: "Retry on failure",
      steps: [
        { id: "step-1", name: "Flaky", type: "task", config: {}, retries: 2 },
      ],
      triggers: [],
    });

    const run = engine.startRun("wf-retry")!;
    await engine.executeAll(run.runId);

    expect(attempts).toBe(3);
    const finalRun = engine.getRun(run.runId);
    expect(finalRun?.status).toBe("completed");
  });

  it("fails after exhausting retries", async () => {
    const engine = new WorkflowEngine();

    engine.registerExecutor("task", async () => {
      throw new Error("always fails");
    });

    engine.registerWorkflow({
      id: "wf-retry-fail",
      name: "Retry Fail",
      description: "Fails after retries",
      steps: [
        { id: "step-1", name: "Flaky", type: "task", config: {}, retries: 1 },
      ],
      triggers: [],
    });

    const run = engine.startRun("wf-retry-fail")!;
    await engine.executeAll(run.runId);

    const finalRun = engine.getRun(run.runId);
    expect(finalRun?.status).toBe("failed");
    expect(finalRun?.error).toContain("always fails");
  });

  it("skips steps with unsatisfied dependencies", async () => {
    const engine = new WorkflowEngine();

    engine.registerExecutor("task", async (step) => {
      return { step: step.id };
    });

    engine.registerWorkflow({
      id: "wf-deps",
      name: "Deps",
      description: "Dependency check",
      steps: [
        { id: "step-1", name: "First", type: "task", config: {} },
        { id: "step-2", name: "Second", type: "task", config: {}, dependencies: ["step-1"] },
        { id: "step-3", name: "Third", type: "task", config: {} },
      ],
      triggers: [],
    });

    const run = engine.startRun("wf-deps")!;
    await engine.executeAll(run.runId);

    const finalRun = engine.getRun(run.runId);
    expect(finalRun?.status).toBe("completed");
    expect(finalRun?.results["step-1"]).toEqual({ step: "step-1" });
    expect(finalRun?.results["step-2"]).toEqual({ step: "step-2" });
    expect(finalRun?.results["step-3"]).toEqual({ step: "step-3" });
  });
});
