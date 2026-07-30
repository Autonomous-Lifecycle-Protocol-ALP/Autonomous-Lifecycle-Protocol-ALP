import { describe, it, expect } from 'vitest';
import { BFTConsensusEngine } from '../src/bft-consensus';

describe('v48.0.0 BFTConsensusEngine — Byzantine Fault Tolerant Consensus', () => {
  it('creates proposal and calculates PBFT 2f+1 quorum thresholds', () => {
    const engine = new BFTConsensusEngine();
    // N = 4 -> f = floor(3/3) = 1 -> quorum = 2(1) + 1 = 3
    const proposal = engine.createProposal('bft-prop-1', 'node-1', 'approve-db-migration', 4);

    expect(proposal.id).toBe('bft-prop-1');
    expect(proposal.totalNodes).toBe(4);
    expect(proposal.maxFaultyNodes).toBe(1);
    expect(proposal.requiredQuorum).toBe(3);
    expect(proposal.committed).toBe(false);
  });

  it('reaches committed state when 2f+1 nodes cast commit votes', () => {
    const engine = new BFTConsensusEngine();
    engine.createProposal('bft-prop-2', 'node-1', 'deploy-prod', 4);

    // Cast votes from 3 nodes (meeting 2f+1 quorum of 3)
    engine.castVote('bft-prop-2', 'node-1', 'commit', 'deploy-prod');
    engine.castVote('bft-prop-2', 'node-2', 'commit', 'deploy-prod');
    engine.castVote('bft-prop-2', 'node-3', 'commit', 'deploy-prod');

    const tally = engine.tally('bft-prop-2');
    expect(tally.committed).toBe(true);
    expect(tally.winningValue).toBe('deploy-prod');
    expect(tally.votesReceived).toBe(3);
  });

  it('detects and flags Byzantine faulty nodes voting conflicting values in same phase', () => {
    const engine = new BFTConsensusEngine();
    engine.createProposal('bft-prop-3', 'node-1', 'upgrade-schema', 4);

    // Node 1 votes 'yes'
    engine.castVote('bft-prop-3', 'node-1', 'prepare', 'upgrade-schema');
    // Node 1 attempts conflicting vote 'no' in same phase (Byzantine behavior)
    const result = engine.castVote('bft-prop-3', 'node-1', 'prepare', 'reject-schema');

    expect(result).toBe(false);
    const proposal = engine.getProposal('bft-prop-3');
    expect(proposal?.byzantineNodes).toContain('node-1');
  });
});
