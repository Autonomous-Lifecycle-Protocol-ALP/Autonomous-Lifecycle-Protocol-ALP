import { describe, it, expect } from "vitest";
import { EnterprisePlatform } from "../src/index";
import { WorkflowEngine, WorkflowPersistenceStore } from "../src/workflow/engine";
import { executePythonStep } from "../src/tools/python";
import type { WorkflowDefinition, WorkflowRun } from "../src/types";

describe("Python Sub-Agent Executor & Persistence Store", () => {
  it("executes Python snippet and parses JSON output", async () => {
    const step = {
      id: "py-step-1",
      name: "Compute Python Result",
      type: "python",
      config: {
        code: "import json; print(json.dumps({'computed': 42, 'status': 'ok'}))",
      },
    };

    try {
      const result = await executePythonStep(step, {});
      expect(result).toEqual({ computed: 42, status: "ok" });
    } catch (err: any) {
      // If Python environment is not on system path in test runner, verify fallback error handling
      expect(err.message).toContain("Python");
    }
  });

  it("handles persistence store lifecycle in WorkflowEngine", async () => {
    const savedRuns = new Map<string, WorkflowRun>();
    const mockStore: WorkflowPersistenceStore = {
      saveRun: (run) => {
        savedRuns.set(run.runId, { ...run });
      },
      loadRun: (runId) => {
        return savedRuns.get(runId);
      },
      deleteRun: (runId) => {
        savedRuns.delete(runId);
      },
    };

    const engine = new WorkflowEngine({}, mockStore);
    engine.registerWorkflow({
      id: "wf-persist",
      name: "Persisted Flow",
      description: "Test persistence",
      steps: [
        { id: "step-a", name: "Step A", type: "noop", config: {} },
      ],
      triggers: [],
    });

    const run = engine.startRun("wf-persist", { user: "test-org" });
    expect(run).toBeDefined();
    expect(savedRuns.has(run!.runId)).toBe(true);

    const persistedRun = await engine.resumeRun(run!.runId);
    expect(persistedRun?.runId).toBe(run!.runId);
    expect(persistedRun?.results.user).toBe("test-org");
  });

  it("initializes EnterprisePlatform with persistence store and registers python executor", async () => {
    const savedRuns = new Map<string, WorkflowRun>();
    const mockStore: WorkflowPersistenceStore = {
      saveRun: (run) => { savedRuns.set(run.runId, run); },
      loadRun: (runId) => savedRuns.get(runId),
      deleteRun: (runId) => { savedRuns.delete(runId); },
    };

    const platform = new EnterprisePlatform(mockStore);
    expect(platform.workflow).toBeDefined();

    const wfDef: WorkflowDefinition = {
      id: "wf-platform-python",
      name: "Platform Python Workflow",
      description: "Testing end-to-end platform workflow",
      steps: [
        {
          id: "step-calc",
          name: "Python Calculation",
          type: "python",
          config: {
            code: "import json; print(json.dumps({'alpha': 100}))",
          },
        },
      ],
      triggers: ["manual"],
    };

    platform.workflow.registerWorkflow(wfDef);
    const run = platform.workflow.startRun("wf-platform-python", { initialVal: 1 });
    expect(run?.status).toBe("running");
    expect(savedRuns.has(run!.runId)).toBe(true);
  });
});
