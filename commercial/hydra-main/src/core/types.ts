export interface Task {
  id: string;
  goal: string;
  product: string;
  organizationId: string;
  teamId?: string;
  userId: string;
  agentId: string;
  status: "pending" | "running" | "completed" | "failed" | "cancelled";
  priority: number;
  payload: Record<string, unknown>;
  result?: unknown;
  error?: string;
  startedAt?: string;
  completedAt?: string;
  tokensUsed?: number;
  costUsd?: number;
  retries: number;
  maxRetries: number;
}

export interface AgentRun {
  runId: string;
  taskId: string;
  agentId: string;
  status: "initializing" | "running" | "awaiting_approval" | "completed" | "failed" | "cancelled";
  steps: AgentStep[];
  currentStepIndex: number;
  context: Record<string, unknown>;
  startedAt: string;
  completedAt?: string;
}

export interface AgentStep {
  stepId: string;
  type: "tool_call" | "memory_lookup" | "agent_handoff" | "verification" | "human_approval";
  name: string;
  input: Record<string, unknown>;
  output?: unknown;
  status: "pending" | "running" | "completed" | "failed" | "awaiting_approval";
  startedAt?: string;
  completedAt?: string;
  error?: string;
}

export interface EventBus {
  publish(event: Record<string, unknown>): void;
  subscribe(pattern: string, handler: (event: Record<string, unknown>) => void): () => void;
}

export type OrchestratorEvents = {
  task_created: { task: Task };
  task_started: { task: Task };
  task_completed: { task: Task; result: unknown };
  task_failed: { task: Task; error: string };
  step_started: { run: AgentRun; step: AgentStep };
  step_completed: { run: AgentRun; step: AgentStep };
  step_failed: { run: AgentRun; step: AgentStep; error: string };
  approval_required: { run: AgentRun; step: AgentStep; reason: string };
};
