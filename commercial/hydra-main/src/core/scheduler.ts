import { Orchestrator } from "./orchestrator";
import { Task } from "./types";

export interface SchedulerOptions {
  maxConcurrent: number;
  queueIntervalMs: number;
}

export class Scheduler {
  private readonly orchestrator: Orchestrator;
  private readonly maxConcurrent: number;
  private readonly queueIntervalMs: number;
  private running = 0;
  private timer?: NodeJS.Timeout;

  constructor(orchestrator: Orchestrator, options: SchedulerOptions = { maxConcurrent: 10, queueIntervalMs: 1000 }) {
    this.orchestrator = orchestrator;
    this.maxConcurrent = options.maxConcurrent;
    this.queueIntervalMs = options.queueIntervalMs;
  }

  start(): void {
    if (this.timer) return;
    this.timer = setInterval(() => this.tick(), this.queueIntervalMs);
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = undefined;
    }
  }

  getRunningCount(): number {
    return this.running;
  }

  private async tick(): Promise<void> {
    const pending = this.getPendingTasks().sort((a, b) => b.priority - a.priority);
    const available = this.maxConcurrent - this.running;
    const toRun = pending.slice(0, available);

    if (toRun.length === 0) return;

    for (const task of toRun) {
      this.running++;
      this.orchestrator.runTask(task.id).finally(() => {
        this.running--;
      });
    }
  }

  private getPendingTasks(): Task[] {
    return this.orchestrator.listTasks("pending");
  }
}
