import { Command } from 'commander';
import { BFTConsensusEngine } from '@autonomous-lifecycle-protocol-alp/parser';

export function registerBFTVoteCommand(program: Command) {
  program
    .command('bft-vote')
    .description('Byzantine Fault Tolerant (BFT) swarm consensus round (v48.0.0)')
    .argument('<proposalId>', 'BFT Proposal ID')
    .argument('<nodeId>', 'Swarm Node ID')
    .argument('<value>', 'Proposed value or vote decision')
    .option('--nodes <count>', 'Total swarm nodes (N)', '4')
    .option('--phase <phase>', 'BFT phase: pre-prepare, prepare, commit', 'commit')
    .action((proposalId, nodeId, value, options) => {
      const engine = new BFTConsensusEngine();
      const totalNodes = parseInt(options.nodes, 10);

      engine.createProposal(proposalId, nodeId, value, totalNodes);
      engine.castVote(proposalId, nodeId, options.phase, value);

      const tally = engine.tally(proposalId);

      console.log('\n🛡️ BFT Swarm Consensus Round (v48.0.0)');
      console.log('=======================================');
      console.log(`  Proposal ID:    ${tally.proposalId}`);
      console.log(`  Phase:          ${tally.phase.toUpperCase()}`);
      console.log(`  Swarm Size (N): ${tally.totalNodes}`);
      console.log(`  Max Faulty (f): ${tally.maxFaultyNodes}`);
      console.log(`  Quorum (2f+1):  ${tally.requiredQuorum}`);
      console.log(`  Committed:      ${tally.committed ? '✅ YES' : '⏳ IN PROGRESS'}`);
      console.log(`  Winning Value:  ${tally.winningValue}\n`);
    });
}
