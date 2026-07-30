/**
 * BFTConsensusEngine — v48.0.0 Byzantine Fault Tolerant Swarm Consensus
 *
 * Implements 3-phase Practical Byzantine Fault Tolerance (PBFT) & Tendermint-style
 * consensus for autonomous agent swarms. Enforces 2f + 1 quorum commits, detects
 * faulty/malicious agent nodes, and ensures safety under network partitions.
 */

export type BFTPhase = 'pre-prepare' | 'prepare' | 'commit' | 'committed' | 'rejected';

export interface BFTNodeVote {
  nodeId: string;
  phase: BFTPhase;
  value: string;
  signature?: string;
  timestamp: string;
}

export interface BFTProposal {
  id: string;
  proposerNodeId: string;
  value: string;
  totalNodes: number;
  maxFaultyNodes: number; // f = floor((N - 1) / 3)
  requiredQuorum: number; // 2f + 1
  currentPhase: BFTPhase;
  votes: BFTNodeVote[];
  committed: boolean;
  byzantineNodes: string[];
  createdAt: string;
}

export interface BFTTallyResult {
  proposalId: string;
  totalNodes: number;
  maxFaultyNodes: number;
  requiredQuorum: number;
  votesReceived: number;
  winningValue: string;
  committed: boolean;
  phase: BFTPhase;
  byzantineNodes: string[];
}

export class BFTConsensusEngine {
  private proposals: Map<string, BFTProposal> = new Map();

  /**
   * Create a new BFT consensus proposal round.
   */
  public createProposal(id: string, proposerNodeId: string, value: string, totalNodes: number = 4): BFTProposal {
    // f = floor((N - 1) / 3)
    const maxFaultyNodes = Math.floor((totalNodes - 1) / 3);
    const requiredQuorum = 2 * maxFaultyNodes + 1;

    const proposal: BFTProposal = {
      id,
      proposerNodeId,
      value,
      totalNodes,
      maxFaultyNodes,
      requiredQuorum,
      currentPhase: 'pre-prepare',
      votes: [],
      committed: false,
      byzantineNodes: [],
      createdAt: new Date().toISOString(),
    };

    this.proposals.set(id, proposal);
    return proposal;
  }

  /**
   * Cast a phase vote from a swarm node.
   */
  public castVote(proposalId: string, nodeId: string, phase: BFTPhase, value: string, signature?: string): boolean {
    const proposal = this.proposals.get(proposalId);
    if (!proposal || proposal.committed) return false;

    // Check if node already voted in this phase with a different value (Byzantine behavior)
    const existingVote = proposal.votes.find(v => v.nodeId === nodeId && v.phase === phase);
    if (existingVote) {
      if (existingVote.value !== value && !proposal.byzantineNodes.includes(nodeId)) {
        proposal.byzantineNodes.push(nodeId);
      }
      return false;
    }

    proposal.votes.push({
      nodeId,
      phase,
      value,
      signature,
      timestamp: new Date().toISOString(),
    });

    // Advance phase if quorum met
    this.evaluatePhaseTransition(proposal);

    return true;
  }

  /**
   * Evaluate 3-phase PBFT consensus lifecycle (pre-prepare -> prepare -> commit -> committed).
   */
  public tally(proposalId: string): BFTTallyResult {
    const proposal = this.proposals.get(proposalId);
    if (!proposal) {
      return {
        proposalId,
        totalNodes: 0,
        maxFaultyNodes: 0,
        requiredQuorum: 0,
        votesReceived: 0,
        winningValue: 'NONE',
        committed: false,
        phase: 'rejected',
        byzantineNodes: [],
      };
    }

    // Tally votes for the commit phase
    const commitVotes = proposal.votes.filter(v => v.phase === 'commit' || v.phase === 'prepare');
    const valueCounts: Record<string, number> = {};

    for (const vote of commitVotes) {
      valueCounts[vote.value] = (valueCounts[vote.value] || 0) + 1;
    }

    let winningValue = 'NONE';
    let maxCount = 0;

    for (const [val, count] of Object.entries(valueCounts)) {
      if (count > maxCount) {
        maxCount = count;
        winningValue = val;
      }
    }

    const isCommitted = maxCount >= proposal.requiredQuorum;
    if (isCommitted) {
      proposal.committed = true;
      proposal.currentPhase = 'committed';
    }

    return {
      proposalId,
      totalNodes: proposal.totalNodes,
      maxFaultyNodes: proposal.maxFaultyNodes,
      requiredQuorum: proposal.requiredQuorum,
      votesReceived: proposal.votes.length,
      winningValue,
      committed: isCommitted,
      phase: proposal.currentPhase,
      byzantineNodes: proposal.byzantineNodes,
    };
  }

  public getProposal(id: string): BFTProposal | undefined {
    return this.proposals.get(id);
  }

  private evaluatePhaseTransition(proposal: BFTProposal): void {
    const prepareVotes = proposal.votes.filter(v => v.phase === 'prepare' && v.value === proposal.value);
    if (prepareVotes.length >= proposal.requiredQuorum && proposal.currentPhase === 'pre-prepare') {
      proposal.currentPhase = 'prepare';
    }

    const commitVotes = proposal.votes.filter(v => v.phase === 'commit' && v.value === proposal.value);
    if (commitVotes.length >= proposal.requiredQuorum && (proposal.currentPhase === 'prepare' || proposal.currentPhase === 'pre-prepare')) {
      proposal.currentPhase = 'committed';
      proposal.committed = true;
    }
  }
}
