import type { AgentRegistry } from "../agents/registry";
import type { ToolRegistry } from "../tools/registry";

export interface SkillCandidate {
  id: string;
  agentId: string;
  toolId: string;
  name: string;
  description: string;
  usageCount: number;
  successRate: number;
  averageLatencyMs: number;
  lastUsed: string;
  promoted: boolean;
}

export interface PerformanceMetrics {
  totalTasks: number;
  successfulTasks: number;
  averageLatencyMs: number;
  toolUsage: Record<string, { count: number; successes: number; failures: number }>;
}

export interface EvolutionConfig {
  promotionThreshold?: number;
  minUsageForPromotion?: number;
  retentionDays?: number;
}

export interface BenchmarkResult {
  candidateId: string;
  agentId: string;
  score: number;
  metrics: PerformanceMetrics;
  timestamp: string;
  passed: boolean;
}

function calculateScore(candidate: SkillCandidate): number {
  const successComponent = candidate.successRate * 0.5;
  const usageComponent = Math.min(candidate.usageCount / 20, 1.0) * 0.3;
  const latencyComponent =
    candidate.averageLatencyMs > 0
      ? Math.max(0, 1 - candidate.averageLatencyMs / 5000) * 0.2
      : 0.2;
  return successComponent + usageComponent + latencyComponent;
}

export class EvolutionEngine {
  private candidates: Map<string, SkillCandidate> = new Map();
  private benchmarks: BenchmarkResult[] = [];
  private readonly config: Required<EvolutionConfig>;
  private readonly agentRegistry: AgentRegistry;
  private readonly toolRegistry: ToolRegistry;

  constructor(
    agentRegistry: AgentRegistry,
    toolRegistry: ToolRegistry,
    config: EvolutionConfig = {},
  ) {
    this.agentRegistry = agentRegistry;
    this.toolRegistry = toolRegistry;
    this.config = {
      promotionThreshold: config.promotionThreshold ?? 0.8,
      minUsageForPromotion: config.minUsageForPromotion ?? 5,
      retentionDays: config.retentionDays ?? 30,
    };
  }

  recordSkillUsage(agentId: string, toolId: string, success: boolean, latencyMs: number): void {
    const existing = this.getCandidate(agentId, toolId);
    if (existing) {
      existing.usageCount += 1;
      existing.successRate =
        (existing.successRate * (existing.usageCount - 1) + (success ? 1 : 0)) / existing.usageCount;
      existing.averageLatencyMs =
        (existing.averageLatencyMs * (existing.usageCount - 1) + latencyMs) / existing.usageCount;
      existing.lastUsed = new Date().toISOString();
    } else {
      const tool = this.toolRegistry.get(toolId);
      const candidate: SkillCandidate = {
        id: `${agentId}:${toolId}`,
        agentId,
        toolId,
        name: tool?.name ?? toolId,
        description: tool?.description ?? "",
        usageCount: 1,
        successRate: success ? 1.0 : 0.0,
        averageLatencyMs: latencyMs,
        lastUsed: new Date().toISOString(),
        promoted: false,
      };
      this.candidates.set(candidate.id, candidate);
    }
  }

  private getCandidate(agentId: string, toolId: string): SkillCandidate | undefined {
    return this.candidates.get(`${agentId}:${toolId}`);
  }

  candidateScore(candidate: SkillCandidate): number {
    return calculateScore(candidate);
  }

  evaluateCandidates(): SkillCandidate[] {
    const promotable: SkillCandidate[] = [];
    for (const candidate of this.candidates.values()) {
      if (
        !candidate.promoted &&
        candidate.usageCount >= this.config.minUsageForPromotion &&
        candidate.successRate >= this.config.promotionThreshold
      ) {
        promotable.push(candidate);
      }
    }
    return promotable;
  }

  promoteCandidate(candidateId: string): boolean {
    const candidate = this.candidates.get(candidateId);
    if (!candidate || candidate.promoted) return false;

    candidate.promoted = true;

    const persona = this.agentRegistry.get(candidate.agentId);
    if (persona && !persona.tools.includes(candidate.toolId)) {
      persona.tools.push(candidate.toolId);
    }

    return true;
  }

  async benchmarkCandidate(candidateId: string): Promise<BenchmarkResult | null> {
    const candidate = this.candidates.get(candidateId);
    if (!candidate) return null;

    const metrics: PerformanceMetrics = {
      totalTasks: candidate.usageCount,
      successfulTasks: Math.round(candidate.usageCount * candidate.successRate),
      averageLatencyMs: candidate.averageLatencyMs,
      toolUsage: {},
    };

    const score = calculateScore(candidate);

    const result: BenchmarkResult = {
      candidateId: candidate.id,
      agentId: candidate.agentId,
      score,
      metrics,
      timestamp: new Date().toISOString(),
      passed: score >= this.config.promotionThreshold,
    };

    this.benchmarks.push(result);
    return result;
  }

  extractSkillsFromPersona(agentId: string): string[] {
    const persona = this.agentRegistry.get(agentId);
    if (!persona) return [];

    const promoted: string[] = [];
    for (const toolId of persona.tools) {
      const candidateId = `${agentId}:${toolId}`;
      const candidate = this.candidates.get(candidateId);
      if (candidate?.promoted) {
        promoted.push(toolId);
      }
    }
    return promoted;
  }

  getCandidates(agentId?: string): SkillCandidate[] {
    let results = Array.from(this.candidates.values());
    if (agentId) results = results.filter((c) => c.agentId === agentId);
    return results.sort((a, b) => this.candidateScore(b) - this.candidateScore(a));
  }

  getBenchmarks(): BenchmarkResult[] {
    return Array.from(this.benchmarks);
  }

  pruneOldCandidates(): number {
    const cutoff = Date.now() - this.config.retentionDays * 24 * 60 * 60 * 1000;
    let count = 0;
    for (const [id, candidate] of this.candidates.entries()) {
      if (!candidate.promoted && new Date(candidate.lastUsed).getTime() < cutoff) {
        this.candidates.delete(id);
        count++;
      }
    }
    return count;
  }
}
