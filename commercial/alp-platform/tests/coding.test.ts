import { describe, it, expect } from "vitest";
import { CodingAgent } from "../src/agents/coding-agent";
import fs from "fs";
import path from "path";
import os from "os";

describe("CodingAgent", () => {
  it("creates a coding task", () => {
    const agent = new CodingAgent({ workspaceRoot: "/tmp" });
    const task = agent.createTask("Add authentication", ["Tests pass", "Coverage > 80%"]);
    expect(task.status).toBe("pending");
    expect(task.goal).toBe("Add authentication");
    expect(task.successCriteria).toEqual(["Tests pass", "Coverage > 80%"]);
  });

  it("executes a task through full lifecycle", async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "coding-agent-test-"));
    const readme = path.join(tmpDir, "README.md");
    fs.writeFileSync(readme, "# Test Project\n");

    const agent = new CodingAgent({ workspaceRoot: tmpDir });
    const task = agent.createTask("Add authentication");
    const result = await agent.execute(task.taskId);

    expect(result?.status).toBe("completed");
    expect(result?.plan?.length).toBeGreaterThan(0);
    expect(result?.changes?.length).toBeGreaterThan(0);
    expect(result?.testResults?.passed).toBeGreaterThanOrEqual(0);
  });

  it("returns undefined for unknown task", async () => {
    const agent = new CodingAgent({ workspaceRoot: "/tmp" });
    const result = await agent.execute("unknown");
    expect(result).toBeUndefined();
  });

  it("tracks active tasks", async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "coding-agent-test-"));
    const readme = path.join(tmpDir, "README.md");
    fs.writeFileSync(readme, "# Test Project\n");

    const agent = new CodingAgent({ workspaceRoot: tmpDir });
    const task = agent.createTask("Add authentication");
    await agent.execute(task.taskId);

    const active = agent.getActiveTasks();
    expect(active.length).toBe(0);
  });

  it("returns a specific task by id", () => {
    const agent = new CodingAgent({ workspaceRoot: "/tmp" });
    const task = agent.createTask("Add authentication");
    const retrieved = agent.getTask(task.taskId);
    expect(retrieved?.taskId).toBe(task.taskId);
  });
});
