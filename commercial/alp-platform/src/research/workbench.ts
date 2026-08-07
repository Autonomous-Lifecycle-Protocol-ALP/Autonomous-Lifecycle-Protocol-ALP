import type { ResearchTask } from "../types";

export interface ResearchWorkbenchOptions {
  maxConcurrentTasks?: number;
}

export class ResearchWorkbench {
  private readonly tasks = new Map<string, ResearchTask>();
  private readonly maxConcurrentTasks: number;

  constructor(options: ResearchWorkbenchOptions = {}) {
    this.maxConcurrentTasks = options.maxConcurrentTasks ?? 5;
  }

  createTask(type: ResearchTask["type"], query: string): ResearchTask {
    const id = `research-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const task: ResearchTask = {
      id,
      type,
      query,
      status: "pending",
      createdAt: new Date().toISOString(),
    };

    this.tasks.set(id, task);
    return task;
  }

  async execute(taskId: string): Promise<ResearchTask | undefined> {
    const task = this.tasks.get(taskId);
    if (!task) return undefined;

    task.status = "running";

    try {
      task.result = await this.runTask(task);
      task.status = "completed";
      task.completedAt = new Date().toISOString();
    } catch (error) {
      task.status = "failed";
      task.result = { error: (error as Error).message };
      task.completedAt = new Date().toISOString();
    }

    return task;
  }

  getTask(taskId: string): ResearchTask | undefined {
    return this.tasks.get(taskId);
  }

  listTasks(): ResearchTask[] {
    return Array.from(this.tasks.values());
  }

  private async runTask(task: ResearchTask): Promise<unknown> {
    switch (task.type) {
      case "literature_review":
        return { summary: `Literature review for: ${task.query}`, papers: [], keyFindings: [] };
      case "data_analysis":
        return { dataset: task.query, statistics: {}, plots: [] };
      case "hypothesis_test":
        return { hypothesis: task.query, pValue: 0.05, conclusion: "inconclusive" };
      case "figure_generation":
        return { figureType: "chart", data: task.query, format: "svg" };
      case "manuscript":
        return { title: task.query, sections: [], references: [] };
      default:
        return { message: "Unknown research task type" };
    }
  }
}
