import { EventEmitter } from "eventemitter3";
import type {
  AgentTask,
  AgentSwarmRun,
  EditProposal,
  AdaptiveSignal,
} from "../types";

export interface AgentOrchestratorOptions {
  maxConcurrent?: number;
}

export class AgentTaskResult {
  constructor(
    public readonly taskId: string,
    public readonly status: AgentTask["status"],
    public readonly result?: unknown,
    public readonly error?: string,
    public readonly tokensUsed?: number,
    public readonly costUsd?: number,
  ) {}
}

export class AgentOrchestrator extends EventEmitter {
  private readonly maxConcurrent: number;
  private readonly runs = new Map<string, AgentSwarmRun>();
  private readonly proposals = new Map<string, EditProposal>();
  private readonly signals: AdaptiveSignal[] = [];
  private readonly decisions: Array<Record<string, unknown>> = [];
  private running = false;

  constructor(options: AgentOrchestratorOptions = {}) {
    super();
    this.maxConcurrent = options.maxConcurrent ?? 8;
  }

  get activeRuns(): AgentSwarmRun[] {
    return Array.from(this.runs.values());
  }

  get proposalCount(): number {
    return this.proposals.size;
  }

  startSwarm(swarmId: string, goal: string): AgentSwarmRun {
    const run: AgentSwarmRun = {
      swarmId,
      goal,
      status: "running",
      maxConcurrent: this.maxConcurrent,
      tasks: [],
      decisions: [],
      startedAt: this.now(),
    };

    this.runs.set(swarmId, run);
    this.emit("swarm:started", run);
    return run;
  }

  proposeEdit(
    swarmId: string,
    edits: Array<Record<string, unknown>>,
    rationale: string,
  ): EditProposal | undefined {
    const run = this.runs.get(swarmId);
    if (!run) {
      return undefined;
    }

    const proposalId = `prop-${swarmId}-${this.proposals.size + 1}`;
    const proposal: EditProposal = {
      proposalId,
      swarmId,
      edits,
      rationale,
      status: "pending",
      createdAt: this.now(),
    };

    this.proposals.set(proposalId, proposal);
    this.recordDecision(run, {
      kind: "mutation_proposed",
      proposalId,
      rationale,
    });
    this.emit("proposal:created", proposal);
    return proposal;
  }

  approveProposal(proposalId: string): EditProposal | undefined {
    const proposal = this.proposals.get(proposalId);
    if (!proposal || proposal.status !== "pending") {
      return proposal;
    }

    proposal.status = "approved";
    proposal.reviewedAt = this.now();
    proposal.reviewNote = "approved";

    const run = this.runs.get(proposal.swarmId);
    if (run) {
      this.recordDecision(run, {
        kind: "mutation_approved",
        proposalId,
      });
    }

    this.emit("proposal:approved", proposal);
    return proposal;
  }

  denyProposal(proposalId: string, reason: string): EditProposal | undefined {
    const proposal = this.proposals.get(proposalId);
    if (!proposal || proposal.status !== "pending") {
      return proposal;
    }

    proposal.status = "denied";
    proposal.reviewedAt = this.now();
    proposal.reviewNote = reason;

    const run = this.runs.get(proposal.swarmId);
    if (run) {
      this.recordDecision(run, {
        kind: "mutation_denied",
        proposalId,
        reason,
      });
    }

    this.emit("proposal:denied", proposal);
    return proposal;
  }

  rollbackProposal(proposalId: string): EditProposal | undefined {
    const proposal = this.proposals.get(proposalId);
    if (!proposal || proposal.status !== "approved") {
      return proposal;
    }

    proposal.status = "rolled_back";
    proposal.reviewedAt = this.now();
    proposal.reviewNote = "rolled back";

    const run = this.runs.get(proposal.swarmId);
    if (run) {
      this.recordDecision(run, {
        kind: "mutation_rolled_back",
        proposalId,
      });
    }

    this.emit("proposal:rolled_back", proposal);
    return proposal;
  }

  async submitTask(
    swarmId: string,
    parentTaskId: string | undefined,
    role: AgentTask["role"],
    prompt: string,
  ): Promise<AgentTask> {
    const run = this.runs.get(swarmId);
    if (!run) {
      throw new Error(`Swarm '${swarmId}' not found`);
    }

    const taskId = `task-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const task: AgentTask = {
      id: taskId,
      swarmId,
      parentTaskId,
      role,
      prompt,
      status: "pending",
    };

    run.tasks.push(task);
    this.emit("task:created", task);

    return task;
  }

  completeTask(
    taskId: string,
    result: unknown,
    tokensUsed = 0,
    costUsd = 0,
  ): AgentTask | undefined {
    const task = this.findTask(taskId);
    if (!task) {
      return undefined;
    }

    task.status = "completed";
    task.result = result;
    task.tokensUsed = tokensUsed;
    task.costUsd = costUsd;
    task.completedAt = this.now();

    this.emit("task:completed", task);
    return task;
  }

  failTask(taskId: string, error: string): AgentTask | undefined {
    const task = this.findTask(taskId);
    if (!task) {
      return undefined;
    }

    task.status = "failed";
    task.error = error;
    task.completedAt = this.now();

    this.emit("task:failed", task);
    return task;
  }

  observeSignal(signal: AdaptiveSignal): void {
    this.signals.push(signal);
    this.emit("signal:observed", signal);
  }

  getDecisions(swarmId?: string): Array<Record<string, unknown>> {
    if (swarmId) {
      const run = this.runs.get(swarmId);
      return run ? [...run.decisions] : [];
    }
    return [...this.decisions];
  }

  getRun(swarmId: string): AgentSwarmRun | undefined {
    return this.runs.get(swarmId);
  }

  getProposal(proposalId: string): EditProposal | undefined {
    return this.proposals.get(proposalId);
  }

  cancelSwarm(swarmId: string): boolean {
    const run = this.runs.get(swarmId);
    if (!run) {
      return false;
    }

    run.status = "cancelled";
    run.completedAt = this.now();
    this.emit("swarm:cancelled", run);
    return true;
  }

  private findTask(taskId: string): AgentTask | undefined {
    for (const run of this.runs.values()) {
      const task = run.tasks.find((t) => t.id === taskId);
      if (task) {
        return task;
      }
    }
    return undefined;
  }

  private recordDecision(
    run: AgentSwarmRun,
    decision: Record<string, unknown>,
  ): void {
    decision.swarm_id = run.swarmId;
    decision.timestamp = this.now();
    run.decisions.push(decision);
    this.decisions.push(decision);
  }

  private now(): string {
    return new Date().toISOString();
  }
}
