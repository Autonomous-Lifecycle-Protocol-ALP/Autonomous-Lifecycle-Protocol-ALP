import fs from "fs";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export interface CodingAgentOptions {
  workspaceRoot: string;
  modelProvider?: string;
  modelId?: string;
  testCommand?: string;
  sandbox?: "none" | "filesystem" | "container" | "vm";
  allowedPaths?: string[];
  deniedPaths?: string[];
  maxFileSizeBytes?: number;
}

export interface CodingTask {
  taskId: string;
  goal: string;
  successCriteria?: string[];
  status: "pending" | "planning" | "executing" | "testing" | "completed" | "failed";
  plan?: string[];
  changes?: Array<{ file: string; description: string }>;
  testResults?: { passed: number; failed: number };
  error?: string;
  startedAt?: string;
  completedAt?: string;
}

export class CodingAgent {
  private readonly workspaceRoot: string;
  private readonly modelProvider: string;
  private readonly modelId: string;
  private readonly testCommand: string;
  private readonly sandbox: "none" | "filesystem" | "container" | "vm";
  private readonly allowedPaths: string[];
  private readonly deniedPaths: string[];
  private readonly maxFileSizeBytes: number;
  private readonly tasks = new Map<string, CodingTask>();

  constructor(options: CodingAgentOptions) {
    this.workspaceRoot = options.workspaceRoot;
    this.modelProvider = options.modelProvider ?? "openai";
    this.modelId = options.modelId ?? "gpt-5.5";
    this.testCommand = options.testCommand ?? "npm test";
    this.sandbox = options.sandbox ?? "filesystem";
    this.allowedPaths = options.allowedPaths ?? [this.workspaceRoot];
    this.deniedPaths = options.deniedPaths ?? ["/etc", "/sys", "/proc"];
    this.maxFileSizeBytes = options.maxFileSizeBytes ?? 10 * 1024 * 1024;
  }

  createTask(goal: string, successCriteria: string[] = []): CodingTask {
    const taskId = `code-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const task: CodingTask = {
      taskId,
      goal,
      successCriteria,
      status: "pending",
      startedAt: new Date().toISOString(),
    };

    this.tasks.set(taskId, task);
    return task;
  }

  async execute(taskId: string): Promise<CodingTask | undefined> {
    const task = this.tasks.get(taskId);
    if (!task) {
      return undefined;
    }

    try {
      task.status = "planning";
      task.plan = await this.plan(task);

      task.status = "executing";
      task.changes = await this.applyPlan(task);

      task.status = "testing";
      task.testResults = await this.runTests();

      task.status = "completed";
      task.completedAt = new Date().toISOString();
    } catch (error) {
      task.status = "failed";
      task.error = error instanceof Error ? error.message : String(error);
      task.completedAt = new Date().toISOString();
    }

    return task;
  }

  getTask(taskId: string): CodingTask | undefined {
    return this.tasks.get(taskId);
  }

  getActiveTasks(): CodingTask[] {
    return Array.from(this.tasks.values()).filter(
      (t) => t.status === "pending" || t.status === "planning" || t.status === "executing" || t.status === "testing",
    );
  }

  private isPathAllowed(targetPath: string): boolean {
    if (this.sandbox === "none") return true;

    const resolved = path.resolve(targetPath);
    for (const denied of this.deniedPaths) {
      const resolvedDenied = path.resolve(denied);
      if (resolved === resolvedDenied || resolved.startsWith(resolvedDenied + path.sep)) {
        return false;
      }
    }

    for (const allowed of this.allowedPaths) {
      const resolvedAllowed = path.resolve(allowed);
      if (resolved === resolvedAllowed || resolved.startsWith(resolvedAllowed + path.sep)) {
        return true;
      }
    }

    return false;
  }

  private isFileSizeAllowed(filePath: string): boolean {
    if (this.sandbox === "none") return true;
    try {
      const stats = fs.statSync(filePath);
      return stats.size <= this.maxFileSizeBytes;
    } catch {
      return true;
    }
  }

  private async plan(task: CodingTask): Promise<string[]> {
    return [
      `Analyze goal: ${task.goal}`,
      "Scan workspace for relevant files",
      "Identify files requiring modification",
      "Generate implementation plan",
      "Validate plan against success criteria",
    ];
  }

  private async applyPlan(task: CodingTask): Promise<Array<{ file: string; description: string }>> {
    const changes: Array<{ file: string; description: string }> = [];

    const targetFile = path.join(this.workspaceRoot, "README.md");
    if (fs.existsSync(targetFile)) {
      if (!this.isPathAllowed(targetFile)) {
        throw new Error(`Sandbox blocked write to ${targetFile}`);
      }
      if (!this.isFileSizeAllowed(targetFile)) {
        throw new Error(`File ${targetFile} exceeds max allowed size`);
      }

      const original = fs.readFileSync(targetFile, "utf8");
      const marker = "<!-- alp-generated-code -->";
      const timestamp = new Date().toISOString();

      const snippet = `${marker}\n<!--\n  Goal: ${task.goal}\n  Updated: ${timestamp}\n-->\n`;
      const updated = original.includes(marker) ? original.replace(new RegExp(`${marker}[\\s\\S]*`, "m"), snippet) : `${original}\n\n${snippet}`;

      fs.writeFileSync(targetFile, updated, "utf8");
      changes.push({ file: "README.md", description: `Applied generated update for: ${task.goal}` });
    }

    return changes;
  }

  private async runTests(): Promise<{ passed: number; failed: number }> {
    if (!fs.existsSync(this.workspaceRoot)) {
      return { passed: 0, failed: 1 };
    }

    try {
      const { stdout } = await execAsync(this.testCommand, {
        cwd: this.workspaceRoot,
        timeout: 120000,
        env: { ...process.env, CI: "true" },
      });

      const passedMatch = stdout.match(/(\d+)\s+passing/i) || stdout.match(/Tests\s+(\d+)\s+passed/i);
      const failedMatch = stdout.match(/(\d+)\s+failing/i) || stdout.match(/Tests\s+(\d+)\s+failed/i);

      return {
        passed: passedMatch ? Number(passedMatch[1]) : 0,
        failed: failedMatch ? Number(failedMatch[1]) : 0,
      };
    } catch (error) {
      const output = error instanceof Error ? error.message : String(error);
      const passedMatch = output.match(/(\d+)\s+passing/i);
      const failedMatch = output.match(/(\d+)\s+failing/i);

      return {
        passed: passedMatch ? Number(passedMatch[1]) : 0,
        failed: failedMatch ? Number(failedMatch[1]) : 1,
      };
    }
  }
}
