import * as crypto from 'crypto';

/**
 * ALP V82.0.0 — Autonomous Reasoning Core Engine
 *
 * Provides verifiable chain-of-thought Merkle trees, self-reflection critique loops,
 * and multi-agent task negotiation.
 */

export interface ReasoningTreeNode {
  stepId: string;
  parentId?: string;
  agentId: string;
  thought: string;
  action: string;
  confidence: number;
  hash: string;
  timestamp: string;
}

export interface MerkleVerificationResult {
  valid: boolean;
  computedRoot: string;
  storedRoot: string;
  stepCount: number;
}

export class VerifiableReasoningTree {
  private steps: Map<string, ReasoningTreeNode> = new Map();
  private rootHash: string = '';

  /**
   * Add a reasoning step and compute its SHA-256 hash incorporating parent hash.
   */
  public addStep(
    stepId: string,
    agentId: string,
    thought: string,
    action: string,
    confidence: number = 0.9,
    parentId?: string
  ): ReasoningTreeNode {
    const parent = parentId ? this.steps.get(parentId) : undefined;
    const parentHash = parent ? parent.hash : 'GENESIS';
    const timestamp = new Date().toISOString();

    const payload = `${stepId}:${agentId}:${thought}:${action}:${confidence}:${parentHash}:${timestamp}`;
    const hash = crypto.createHash('sha256').update(payload).digest('hex');

    const node: ReasoningTreeNode = {
      stepId,
      parentId,
      agentId,
      thought,
      action,
      confidence,
      hash,
      timestamp,
    };

    this.steps.set(stepId, node);
    this.rootHash = this.computeMerkleRoot();
    return node;
  }

  /**
   * Compute Merkle root hash over all recorded reasoning steps.
   */
  public computeMerkleRoot(): string {
    const hashes = Array.from(this.steps.values()).map(s => s.hash);
    if (hashes.length === 0) return '';
    if (hashes.length === 1) return hashes[0];

    let currentLevel = [...hashes];
    while (currentLevel.length > 1) {
      const nextLevel: string[] = [];
      for (let i = 0; i < currentLevel.length; i += 2) {
        const left = currentLevel[i];
        const right = currentLevel[i + 1] ?? left;
        const combined = crypto.createHash('sha256').update(left + right).digest('hex');
        nextLevel.push(combined);
      }
      currentLevel = nextLevel;
    }
    return currentLevel[0];
  }

  /**
   * Verify Merkle tree integrity.
   */
  public verifyTrace(): MerkleVerificationResult {
    const computed = this.computeMerkleRoot();
    return {
      valid: computed === this.rootHash && this.steps.size > 0,
      computedRoot: computed,
      storedRoot: this.rootHash,
      stepCount: this.steps.size,
    };
  }

  /**
   * Get all reasoning steps in execution sequence.
   */
  public getSteps(): ReasoningTreeNode[] {
    return Array.from(this.steps.values());
  }
}

// ─── Self-Reflection & Critique Engine ───────────────────────────────────────

export interface CritiqueMetrics {
  correctness: number;
  security: number;
  performance: number;
}

export interface CritiqueResult {
  overallScore: number;
  metrics: CritiqueMetrics;
  defects: string[];
  refinementSuggestions: string[];
}

export class CritiqueEngine {
  /**
   * Run automated self-reflection critique on code or .alp spec content.
   */
  public critique(content: string, targetType: 'CODE' | 'SPEC' = 'SPEC'): CritiqueResult {
    const defects: string[] = [];
    const suggestions: string[] = [];
    let correctness = 0.9;
    let security = 0.95;
    let performance = 0.88;

    const lower = content.toLowerCase();

    if (targetType === 'SPEC') {
      if (!lower.includes('@task') && !lower.includes('@policy') && !lower.includes('@agent')) {
        defects.push('Spec lacks fundamental block markers (@task, @policy, or @agent)');
        correctness -= 0.3;
      }
      if (lower.includes('!deprecated')) {
        suggestions.push('Replace deprecated directives with modern v80+ block features');
      }
      if (lower.includes('[!]') && !lower.match(/\[\!\]\s+\S/)) {
        defects.push("Blocked status '[!]' requires an explicit reason string");
        security -= 0.2;
      }
    } else {
      if (lower.includes('eval(') || lower.includes('exec(')) {
        defects.push('Detected potential dynamic code execution vulnerability');
        security -= 0.4;
      }
      if (lower.includes('todo')) {
        suggestions.push('Complete inline TODO placeholder implementations');
      }
    }

    correctness = Math.max(0.1, Math.round(correctness * 100) / 100);
    security = Math.max(0.1, Math.round(security * 100) / 100);
    performance = Math.max(0.1, Math.round(performance * 100) / 100);
    const overallScore = Math.round(((correctness + security + performance) / 3) * 100) / 100;

    return {
      overallScore,
      metrics: { correctness, security, performance },
      defects,
      refinementSuggestions: suggestions,
    };
  }

  /**
   * Automatically refine content based on critique results.
   */
  public refine(content: string, critiqueResult: CritiqueResult): string {
    let refined = content;

    for (const defect of critiqueResult.defects) {
      if (defect.includes("Blocked status '[!]' requires an explicit reason")) {
        refined = refined.replace(/\[\!\](?!\s+\S)/g, '[!] pending verification');
      }
    }

    if (critiqueResult.refinementSuggestions.some(s => s.includes('modern v80+'))) {
      refined = `# Refined via ALP V82 Critique Engine\n` + refined;
    }

    return refined;
  }
}

// ─── Cross-Agent Task Negotiation ────────────────────────────────────────────

export interface AgentBid {
  agentId: string;
  nodeId: string;
  capabilityScore: number; // 0.0 - 1.0
  estimatedCost: number;   // Token / compute cost
  riskScore: number;       // 0.0 - 1.0
}

export interface NegotiationAssignment {
  nodeId: string;
  winningAgentId: string;
  bidScore: number;
}

export class CrossAgentPlanner {
  private bids: Map<string, AgentBid[]> = new Map();

  /**
   * Submit an agent bid to execute a specific plan node.
   */
  public submitBid(bid: AgentBid): void {
    const list = this.bids.get(bid.nodeId) || [];
    list.push(bid);
    this.bids.set(bid.nodeId, list);
  }

  /**
   * Resolve negotiation and assign nodes to highest-scoring agent bids.
   */
  public resolveNegotiation(nodeIds: string[]): NegotiationAssignment[] {
    const assignments: NegotiationAssignment[] = [];

    for (const nodeId of nodeIds) {
      const nodeBids = this.bids.get(nodeId) || [];
      if (nodeBids.length === 0) {
        assignments.push({
          nodeId,
          winningAgentId: 'unassigned',
          bidScore: 0,
        });
        continue;
      }

      let bestBid: AgentBid | null = null;
      let bestScore = -Infinity;

      for (const bid of nodeBids) {
        // Composite score: Capability (50%) - Cost (30%) - Risk (20%)
        const compositeScore = (bid.capabilityScore * 0.5) - (bid.estimatedCost * 0.001 * 0.3) - (bid.riskScore * 0.2);
        if (compositeScore > bestScore) {
          bestScore = compositeScore;
          bestBid = bid;
        }
      }

      assignments.push({
        nodeId,
        winningAgentId: bestBid!.agentId,
        bidScore: Math.round(bestScore * 1000) / 1000,
      });
    }

    return assignments;
  }
}
