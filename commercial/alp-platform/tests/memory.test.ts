import { describe, it, expect } from "vitest";
import { MemoryManager } from "../src/memory/manager";

describe("MemoryManager", () => {
  it("stores and retrieves entries", async () => {
    const manager = new MemoryManager();
    const entry = manager.store({
      type: "preference",
      key: "theme",
      value: "dark",
      importance: "medium",
    });

    expect(entry.id).toBeDefined();
    expect(entry.createdAt).toBeDefined();

    const results = manager.retrieve({ type: "preference" });
    expect(results).toHaveLength(1);
    expect(results[0].value).toBe("dark");
  });

  it("filters by scope and importance", async () => {
    const manager = new MemoryManager();
    manager.store({ type: "context", key: "k1", value: "v1", importance: "low", scope: "project-a" });
    manager.store({ type: "context", key: "k2", value: "v2", importance: "high", scope: "project-b" });

    const scoped = manager.retrieve({ scope: "project-a" });
    expect(scoped).toHaveLength(1);
    expect(scoped[0].scope).toBe("project-a");

    const high = manager.retrieve({ importance: "high" });
    expect(high).toHaveLength(1);
    expect(high[0].importance).toBe("high");
  });

  it("estimates tokens", async () => {
    const manager = new MemoryManager();
    const entry = manager.store({ type: "note", key: "n1", value: "ABCD", importance: "low" });

    expect(entry.tokensEstimate).toBe(1);
  });

  it("respects context window limits", async () => {
    const manager = new MemoryManager({ maxTokens: 30, reservedSystemTokens: 0, reservedResponseTokens: 0 });
    manager.store({ type: "note", key: "n1", value: "A".repeat(80), importance: "low" });
    manager.store({ type: "note", key: "n2", value: "B".repeat(80), importance: "low" });

    const summary = manager.summarizeForContext();
    expect(summary.truncated).toBe(true);
    expect(summary.entries.length).toBeLessThan(2);
  });

  it("returns available tokens", async () => {
    const manager = new MemoryManager({ maxTokens: 1000, reservedSystemTokens: 100, reservedResponseTokens: 200 });
    expect(manager.getAvailableTokens()).toBe(700);
    expect(manager.getAvailableTokens(300)).toBe(400);
  });

  it("deletes entries", async () => {
    const manager = new MemoryManager();
    const entry = manager.store({ type: "note", key: "n1", value: "v1", importance: "low" });

    expect(manager.size).toBe(1);
    expect(manager.delete(entry.id)).toBe(true);
    expect(manager.size).toBe(0);
  });

  it("clears all entries", async () => {
    const manager = new MemoryManager();
    manager.store({ type: "note", key: "n1", value: "v1", importance: "low" });
    manager.store({ type: "note", key: "n2", value: "v2", importance: "low" });

    manager.clear();
    expect(manager.size).toBe(0);
  });

  it("returns context window config", async () => {
    const manager = new MemoryManager({ maxTokens: 500000, reservedSystemTokens: 10000, reservedResponseTokens: 20000 });
    const cw = manager.getContextWindow();

    expect(cw.maxTokens).toBe(500000);
    expect(cw.reservedSystemTokens).toBe(10000);
    expect(cw.reservedResponseTokens).toBe(20000);
  });
});
