import { describe, test, expect } from "vitest";
import { WorkflowEngine } from "../src/workflow/engine";

describe("WorkflowEngine Step Retries & Events", () => {
  test("executes step with retry and exponential backoff on transient errors", async () => {
    const engine = new WorkflowEngine();
    engine.registerWorkflow({
      id: "wf-retry",
      name: "Retry Workflow",
      description: "Test retry mechanism",
      steps: [
        {
          id: "step-flaky",
          name: "Flaky Step",
          type: "task",
          config: {},
          retries: 2,
          backoffFactor: 1.5,
          maxRetryDelayMs: 50,
        },
      ],
      triggers: ["manual"],
    });

    let attempts = 0;
    engine.registerExecutor("task", async () => {
      attempts++;
      if (attempts < 2) {
        throw new Error("Transient network failure");
      }
      return { success: true };
    });

    const run = engine.startRun("wf-retry");
    expect(run).toBeDefined();

    const result = await engine.executeAll(run!.runId);
    expect(result?.status).toBe("completed");
    expect(attempts).toBe(2);
    expect(result?.results["step-flaky"]).toEqual({ success: true });
    expect(result?.stepEvents).toBeDefined();
    expect(result?.stepEvents!.some((e) => e.event === "retry")).toBe(true);
  });

  test("logs failure step event when retries are exhausted", async () => {
    const engine = new WorkflowEngine();
    engine.registerWorkflow({
      id: "wf-fail",
      name: "Failing Workflow",
      description: "Test retry exhaustion",
      steps: [
        {
          id: "step-broken",
          name: "Broken Step",
          type: "task",
          config: {},
          retries: 1,
        },
      ],
      triggers: ["manual"],
    });

    engine.registerExecutor("task", async () => {
      throw new Error("Permanent error");
    });

    const run = engine.startRun("wf-fail");
    const result = await engine.executeAll(run!.runId);

    expect(result?.status).toBe("failed");
    expect(result?.error).toContain("failed after 1 retries");
    const failureEvent = result?.stepEvents?.find((e) => e.event === "failure");
    expect(failureEvent).toBeDefined();
  });
});
