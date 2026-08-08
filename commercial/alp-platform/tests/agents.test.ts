import { describe, it, expect } from "vitest";
import { AgentOrchestrator } from "../src/agents/orchestrator";

describe("AgentOrchestrator", () => {
  it("starts a swarm run", async () => {
    const orchestrator = new AgentOrchestrator();
    const run = orchestrator.startSwarm("swarm-1", "Build a new API");

    expect(run.swarmId).toBe("swarm-1");
    expect(run.goal).toBe("Build a new API");
    expect(run.status).toBe("running");
    expect(run.tasks).toEqual([]);
    expect(run.startedAt).toBeDefined();
  });

  it("submits and completes a task", async () => {
    const orchestrator = new AgentOrchestrator();
    orchestrator.startSwarm("swarm-1", "Build a new API");

    const task = await orchestrator.submitTask("swarm-1", undefined, "coder", "Write tests");
    expect(task.role).toBe("coder");
    expect(task.status).toBe("pending");

    const completed = orchestrator.completeTask(task.id, { passed: 5 }, 100, 0.05);
    expect(completed?.status).toBe("completed");
    expect(completed?.result).toEqual({ passed: 5 });
    expect(completed?.tokensUsed).toBe(100);
    expect(completed?.costUsd).toBe(0.05);
  });

  it("fails a task", async () => {
    const orchestrator = new AgentOrchestrator();
    orchestrator.startSwarm("swarm-1", "Build a new API");

    const task = await orchestrator.submitTask("swarm-1", undefined, "coder", "Write tests");
    const failed = orchestrator.failTask(task.id, "Syntax error");
    expect(failed?.status).toBe("failed");
    expect(failed?.error).toBe("Syntax error");
  });

  it("proposes and approves an edit", async () => {
    const orchestrator = new AgentOrchestrator();
    orchestrator.startSwarm("swarm-1", "Build a new API");

    const proposal = orchestrator.proposeEdit("swarm-1", [{ op: "update", target: "name", value: "New API" }], "Rename project");
    expect(proposal?.status).toBe("pending");

    const approved = orchestrator.approveProposal(proposal!.proposalId);
    expect(approved?.status).toBe("approved");
    expect(approved?.reviewNote).toBe("approved");
  });

  it("denies and rolls back a proposal", async () => {
    const orchestrator = new AgentOrchestrator();
    orchestrator.startSwarm("swarm-1", "Build a new API");

    const proposal = orchestrator.proposeEdit("swarm-1", [{ op: "update", target: "name", value: "New API" }], "Rename project");
    orchestrator.approveProposal(proposal!.proposalId);
    const rolledBack = orchestrator.rollbackProposal(proposal!.proposalId);

    expect(rolledBack?.status).toBe("rolled_back");
    expect(rolledBack?.reviewNote).toBe("rolled back");
  });

  it("records decisions", async () => {
    const orchestrator = new AgentOrchestrator();
    orchestrator.startSwarm("swarm-1", "Build a new API");

    const proposal = orchestrator.proposeEdit("swarm-1", [{ op: "update" }], "Test");
    orchestrator.approveProposal(proposal!.proposalId);

    const decisions = orchestrator.getDecisions("swarm-1");
    expect(decisions.length).toBeGreaterThanOrEqual(2);
    expect(decisions[0].kind).toBe("mutation_proposed");
    expect(decisions[1].kind).toBe("mutation_approved");
  });

  it("observes adaptive signals", async () => {
    const orchestrator = new AgentOrchestrator();

    orchestrator.observeSignal({ kind: "latency", value: 250, observedAt: new Date().toISOString() });
    orchestrator.observeSignal({ kind: "error_rate", value: 0.05, observedAt: new Date().toISOString() });

    // No assertion on internal state, just ensure no throw
    expect(orchestrator.activeRuns).toEqual([]);
  });

  it("cancels a swarm", async () => {
    const orchestrator = new AgentOrchestrator();
    orchestrator.startSwarm("swarm-1", "Build a new API");

    const cancelled = orchestrator.cancelSwarm("swarm-1");
    expect(cancelled).toBe(true);

    const run = orchestrator.getRun("swarm-1");
    expect(run?.status).toBe("cancelled");
  });

  it("returns undefined for unknown swarm", async () => {
    const orchestrator = new AgentOrchestrator();

    expect(orchestrator.getRun("unknown")).toBeUndefined();
    expect(orchestrator.cancelSwarm("unknown")).toBe(false);
  });

  it("returns undefined for unknown proposal", async () => {
    const orchestrator = new AgentOrchestrator();

    expect(orchestrator.getProposal("unknown")).toBeUndefined();
    expect(orchestrator.approveProposal("unknown")).toBeUndefined();
  });
});
