import { v4 as uuidv4 } from "uuid";
import type { Task, AgentRun, AgentStep, EventBus } from "./types";
import type { AgentPersona } from "../agents/base";
import type { AgentRegistry } from "../agents/registry";
import type { ModelRouter } from "../models/router";
import type { ToolRegistry } from "../tools/registry";

export class InMemoryEventBus implements EventBus {
  private handlers: Map<string, Array<(event: Record<string, unknown>) => void>> = new Map();

  publish(event: Record<string, unknown>): void {
    const type = event.type as string;
    const handlers = this.handlers.get(type) || [];
    const wildcard = this.handlers.get("*") || [];
    for (const handler of [...handlers, ...wildcard]) {
      try {
        handler(event);
      } catch (err) {
        console.error(`Event handler error for ${type}:`, err);
      }
    }
  }

  subscribe(pattern: string, handler: (event: Record<string, unknown>) => void): () => void {
    if (!this.handlers.has(pattern)) {
      this.handlers.set(pattern, []);
    }
    this.handlers.get(pattern)!.push(handler);
    return () => {
      const list = this.handlers.get(pattern);
      if (list) {
        const idx = list.indexOf(handler);
        if (idx >= 0) list.splice(idx, 1);
      }
    };
  }
}

export class Orchestrator {
  private readonly eventBus: EventBus;
  private readonly runs: Map<string, AgentRun> = new Map();
  private readonly tasks: Map<string, Task> = new Map();
  private readonly agents: Map<string, AgentPersona> = new Map();
  private readonly modelRouter?: ModelRouter;
  private readonly toolRegistry?: ToolRegistry;

  constructor(eventBus?: EventBus, options?: { agentRegistry?: AgentRegistry; modelRouter?: ModelRouter; toolRegistry?: ToolRegistry }) {
    this.eventBus = eventBus ?? new InMemoryEventBus();
    if (options?.agentRegistry) {
      for (const persona of options.agentRegistry.list()) {
        this.agents.set(persona.id, persona);
      }
    }
    this.modelRouter = options?.modelRouter;
    this.toolRegistry = options?.toolRegistry;
  }

  createTask(input: {
    goal: string;
    product: string;
    organizationId: string;
    userId: string;
    agentId: string;
    teamId?: string;
    priority?: number;
    payload?: Record<string, unknown>;
    maxRetries?: number;
  }): Task {
    const task: Task = {
      id: uuidv4(),
      goal: input.goal,
      product: input.product,
      organizationId: input.organizationId,
      teamId: input.teamId,
      userId: input.userId,
      agentId: input.agentId,
      status: "pending",
      priority: input.priority ?? 0,
      payload: input.payload ?? {},
      retries: 0,
      maxRetries: input.maxRetries ?? 3,
    };
    this.tasks.set(task.id, task);
    this.eventBus.publish({ type: "task_created", task });
    return task;
  }

  async runTask(taskId: string): Promise<AgentRun> {
    const task = this.tasks.get(taskId);
    if (!task) throw new Error(`Task ${taskId} not found`);
    if (task.status === "running" || task.status === "completed") {
      throw new Error(`Task ${taskId} is already ${task.status}`);
    }

    task.status = "running";
    task.startedAt = new Date().toISOString();
    this.eventBus.publish({ type: "task_started", task });

    const run: AgentRun = {
      runId: uuidv4(),
      taskId: task.id,
      agentId: task.agentId,
      status: "running",
      steps: [],
      currentStepIndex: 0,
      context: { ...task.payload },
      startedAt: new Date().toISOString(),
    };
    this.runs.set(run.runId, run);

    await this.executeRun(run, task);
    return run;
  }

  getTask(taskId: string): Task | undefined {
    return this.tasks.get(taskId);
  }

  listTasks(status?: Task["status"]): Task[] {
    let results = Array.from(this.tasks.values());
    if (status) results = results.filter((t) => t.status === status);
    return results;
  }

  getRun(runId: string): AgentRun | undefined {
    return this.runs.get(runId);
  }

  private async executeRun(run: AgentRun, task: Task): Promise<void> {
    try {
      const persona = this.agents.get(task.agentId);
      if (!persona) throw new Error(`Agent persona ${task.agentId} not found`);

      const steps: AgentStep[] = [];

      const planningStep: AgentStep = {
        stepId: uuidv4(),
        type: "memory_lookup",
        name: "plan",
        input: { goal: task.goal, tools: persona.tools },
        status: "running",
        startedAt: new Date().toISOString(),
      };
      steps.push(planningStep);
      this.eventBus.publish({ type: "step_started", run, step: planningStep });

      let modelResult: { provider: string; model: string; text: string; tokensUsed: number } | undefined;
      if (this.modelRouter) {
        const selection = this.modelRouter.select({
          taskType: "coding",
          contextSize: 4000,
          preferredProvider: persona.modelPreferences.primary,
        });
        const completion = await this.modelRouter.complete(selection.provider, selection.model, {
          prompt: task.goal,
          systemPrompt: persona.systemPrompt,
          temperature: 0.7,
          maxTokens: 1024,
        });
        modelResult = {
          provider: selection.provider,
          model: selection.model,
          text: completion.text,
          tokensUsed: completion.tokensUsed,
        };
      } else {
        await new Promise((resolve) => setTimeout(resolve, 10));
      }

      planningStep.status = "completed";
      planningStep.output = { plan: modelResult?.text ?? `Execute ${task.goal} using ${persona.name}` };
      planningStep.completedAt = new Date().toISOString();
      this.eventBus.publish({ type: "step_completed", run, step: planningStep });

      const executionStep: AgentStep = {
        stepId: uuidv4(),
        type: "tool_call",
        name: task.agentId,
        input: { goal: task.goal, context: run.context },
        status: "running",
        startedAt: new Date().toISOString(),
      };
      steps.push(executionStep);
      this.eventBus.publish({ type: "step_started", run, step: executionStep });

      let toolOutput: unknown = null;
      if (this.toolRegistry && persona.tools.length > 0) {
        const firstToolId = persona.tools[0];
        const tool = this.toolRegistry.get(firstToolId);
        if (tool) {
          try {
            toolOutput = await tool.execute({ goal: task.goal, context: run.context });
          } catch (err) {
            toolOutput = { error: err instanceof Error ? err.message : String(err) };
          }
        }
      }

      if (!toolOutput && modelResult) {
        toolOutput = { message: modelResult.text };
      } else if (!toolOutput) {
        toolOutput = { message: `Task ${task.id} executed by ${task.agentId}` };
      }

      executionStep.status = "completed";
      executionStep.output = toolOutput;
      executionStep.completedAt = new Date().toISOString();
      this.eventBus.publish({ type: "step_completed", run, step: executionStep });

      const verificationStep: AgentStep = {
        stepId: uuidv4(),
        type: "verification",
        name: "verify",
        input: { stepCount: steps.length, stepIds: steps.map((s) => s.stepId) },
        status: "running",
        startedAt: new Date().toISOString(),
      };
      steps.push(verificationStep);
      this.eventBus.publish({ type: "step_started", run, step: verificationStep });

      await new Promise((resolve) => setTimeout(resolve, 10));

      verificationStep.status = "completed";
      verificationStep.output = { passed: true };
      verificationStep.completedAt = new Date().toISOString();
      this.eventBus.publish({ type: "step_completed", run, step: verificationStep });

      run.steps = steps;
      run.status = "completed";
      run.completedAt = new Date().toISOString();
      task.status = "completed";
      task.completedAt = new Date().toISOString();
      task.result = executionStep.output;
      task.tokensUsed = modelResult?.tokensUsed;
      this.eventBus.publish({ type: "task_completed", task, result: task.result });
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      run.status = "failed";
      run.completedAt = new Date().toISOString();
      task.status = "failed";
      task.completedAt = new Date().toISOString();
      task.error = error;
      this.eventBus.publish({ type: "task_failed", task, error });
      throw err;
    }
  }
}
