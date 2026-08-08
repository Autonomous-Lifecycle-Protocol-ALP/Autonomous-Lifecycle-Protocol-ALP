export interface WorkflowStep {
  id: string;
  name: string;
  type: "task" | "condition" | "parallel" | "sequence" | "delay";
  config: Record<string, unknown>;
  dependencies?: string[];
  retries?: number;
  backoffFactor?: number;
  maxRetryDelayMs?: number;
  timeoutMs?: number;
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
  triggers: string[];
}

export interface WorkflowStepEvent {
  stepId: string;
  timestamp: string;
  event: "start" | "success" | "failure" | "retry";
  attempt?: number;
  error?: string;
}

export interface WorkflowRun {
  runId: string;
  workflowId: string;
  status: "pending" | "running" | "completed" | "failed" | "cancelled";
  currentStep?: string;
  results: Record<string, unknown>;
  stepEvents?: WorkflowStepEvent[];
  startedAt?: string;
  completedAt?: string;
  error?: string;
}

export interface WorkflowEngineOptions {
  maxConcurrentRuns?: number;
  defaultTimeoutMs?: number;
}

export interface WorkflowPersistenceStore {
  saveRun(run: WorkflowRun): Promise<void> | void;
  loadRun(runId: string): Promise<WorkflowRun | undefined> | WorkflowRun | undefined;
  deleteRun(runId: string): Promise<void> | void;
}

export type StepExecutor = (step: WorkflowStep, context: Record<string, unknown>) => Promise<unknown>;

export class WorkflowEngine {
  private readonly definitions = new Map<string, WorkflowDefinition>();
  private readonly runs = new Map<string, WorkflowRun>();
  private readonly maxConcurrentRuns: number;
  private readonly defaultTimeoutMs: number;
  private readonly executors = new Map<string, StepExecutor>();
  private readonly pendingTimeouts = new Map<string, ReturnType<typeof setTimeout>>();
  private readonly persistenceStore?: WorkflowPersistenceStore;

  constructor(options: WorkflowEngineOptions = {}, persistenceStore?: WorkflowPersistenceStore) {
    this.maxConcurrentRuns = options.maxConcurrentRuns ?? 10;
    this.defaultTimeoutMs = options.defaultTimeoutMs ?? 300000;
    this.persistenceStore = persistenceStore;
  }

  private persistRun(run: WorkflowRun): void {
    const store = this.persistenceStore;
    if (!store) return;
    const result = store.saveRun(run);
    if (result && typeof result.then === "function") {
      result.catch(() => {});
    }
  }

  registerWorkflow(workflow: WorkflowDefinition): void {
    this.definitions.set(workflow.id, workflow);
  }

  registerExecutor(stepType: string, executor: StepExecutor): void {
    this.executors.set(stepType, executor);
  }

  startRun(workflowId: string, initialContext: Record<string, unknown> = {}): WorkflowRun | undefined {
    const workflow = this.definitions.get(workflowId);
    if (!workflow) return undefined;

    const runId = `run-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const run: WorkflowRun = {
      runId,
      workflowId,
      status: "running",
      results: { ...initialContext },
      stepEvents: [],
      startedAt: new Date().toISOString(),
    };

    this.runs.set(runId, run);
    this.persistRun(run);
    return run;
  }

  async resumeRun(runId: string): Promise<WorkflowRun | undefined> {
    if (this.runs.has(runId)) {
      return this.runs.get(runId);
    }

    const persisted = await this.persistenceStore?.loadRun(runId);
    if (!persisted) return undefined;

    if (persisted.status !== "running") return persisted;

    if (!persisted.stepEvents) persisted.stepEvents = [];
    this.runs.set(runId, persisted);
    return persisted;
  }

  async executeNextStep(runId: string): Promise<WorkflowRun | undefined> {
    const run = this.runs.get(runId);
    if (!run || run.status !== "running") return run;

    const workflow = this.definitions.get(run.workflowId);
    if (!workflow) return run;

    const nextStep = this.getNextRunnableStep(run, workflow);
    if (!nextStep) {
      run.status = "completed";
      run.completedAt = new Date().toISOString();
      this.persistRun(run);
      return run;
    }

    run.currentStep = nextStep.id;
    if (!run.stepEvents) run.stepEvents = [];

    const executor = this.executors.get(nextStep.type);
    if (!executor) {
      run.status = "failed";
      run.error = `No executor registered for step type '${nextStep.type}'`;
      run.completedAt = new Date().toISOString();
      run.stepEvents.push({
        stepId: nextStep.id,
        timestamp: new Date().toISOString(),
        event: "failure",
        error: run.error,
      });
      this.pendingTimeouts.delete(runId);
      this.persistRun(run);
      return run;
    }

    const timeout = nextStep.timeoutMs ?? this.defaultTimeoutMs;
    const timeoutHandle = setTimeout(() => {
      if (run.status === "running" && run.currentStep === nextStep.id) {
        run.status = "failed";
        run.error = `Step '${nextStep.id}' timed out after ${timeout}ms`;
        run.completedAt = new Date().toISOString();
        run.stepEvents?.push({
          stepId: nextStep.id,
          timestamp: new Date().toISOString(),
          event: "failure",
          error: run.error,
        });
        this.pendingTimeouts.delete(runId);
        this.persistRun(run);
      }
    }, timeout);
    this.pendingTimeouts.set(runId, timeoutHandle);

    try {
      const retries = nextStep.retries ?? 0;
      const backoffFactor = nextStep.backoffFactor ?? 2;
      const maxRetryDelayMs = nextStep.maxRetryDelayMs ?? 10000;
      let attempt = 0;
      let lastError: unknown;

      run.stepEvents.push({
        stepId: nextStep.id,
        timestamp: new Date().toISOString(),
        event: "start",
        attempt: 0,
      });

      while (attempt <= retries) {
        try {
          const result = await executor(nextStep, run.results);
          run.results[nextStep.id] = result;
          run.stepEvents.push({
            stepId: nextStep.id,
            timestamp: new Date().toISOString(),
            event: "success",
            attempt,
          });
          break;
        } catch (error) {
          lastError = error;
          attempt++;
          if (attempt > retries) {
            run.status = "failed";
            run.error = `Step '${nextStep.id}' failed after ${retries} retries: ${lastError instanceof Error ? lastError.message : String(lastError)}`;
            run.completedAt = new Date().toISOString();
            run.stepEvents.push({
              stepId: nextStep.id,
              timestamp: new Date().toISOString(),
              event: "failure",
              attempt,
              error: run.error,
            });
            this.pendingTimeouts.delete(runId);
            this.persistRun(run);
            return run;
          } else {
            const delayMs = Math.min(10 * Math.pow(backoffFactor, attempt - 1), maxRetryDelayMs);
            run.stepEvents.push({
              stepId: nextStep.id,
              timestamp: new Date().toISOString(),
              event: "retry",
              attempt,
              error: lastError instanceof Error ? lastError.message : String(lastError),
            });
            if (delayMs > 0) {
              await new Promise((resolve) => setTimeout(resolve, delayMs));
            }
          }
        }
      }
    } finally {
      clearTimeout(timeoutHandle);
      this.pendingTimeouts.delete(runId);
    }

    this.persistRun(run);
    return this.executeNextStep(runId);
  }

  async executeAll(runId: string): Promise<WorkflowRun | undefined> {
    let run = this.getRun(runId);
    while (run?.status === "running") {
      run = await this.executeNextStep(runId);
    }
    return run;
  }

  completeStep(runId: string, stepId: string, result: unknown): WorkflowRun | undefined {
    const run = this.runs.get(runId);
    if (!run || run.status !== "running") return undefined;

    run.results[stepId] = result;
    run.currentStep = stepId;
    this.persistRun(run);
    return run;
  }

  failRun(runId: string, error: string): WorkflowRun | undefined {
    const run = this.runs.get(runId);
    if (!run || run.status !== "running") return undefined;

    if (this.pendingTimeouts.has(runId)) {
      clearTimeout(this.pendingTimeouts.get(runId)!);
      this.pendingTimeouts.delete(runId);
    }

    run.status = "failed";
    run.error = error;
    run.completedAt = new Date().toISOString();
    this.persistRun(run);
    return run;
  }

  cancelRun(runId: string): WorkflowRun | undefined {
    const run = this.runs.get(runId);
    if (!run || run.status !== "running") return undefined;

    if (this.pendingTimeouts.has(runId)) {
      clearTimeout(this.pendingTimeouts.get(runId)!);
      this.pendingTimeouts.delete(runId);
    }

    run.status = "cancelled";
    run.completedAt = new Date().toISOString();
    this.persistRun(run);
    return run;
  }

  getRun(runId: string): WorkflowRun | undefined {
    return this.runs.get(runId);
  }

  getWorkflow(workflowId: string): WorkflowDefinition | undefined {
    return this.definitions.get(workflowId);
  }

  listWorkflows(): WorkflowDefinition[] {
    return Array.from(this.definitions.values());
  }

  private getNextRunnableStep(run: WorkflowRun, workflow: WorkflowDefinition): WorkflowStep | undefined {
    const completed = new Set(Object.keys(run.results));

    return workflow.steps.find((step) => {
      if (completed.has(step.id)) return false;
      const deps = step.dependencies ?? [];
      return deps.every((dep) => completed.has(dep));
    });
  }
}
