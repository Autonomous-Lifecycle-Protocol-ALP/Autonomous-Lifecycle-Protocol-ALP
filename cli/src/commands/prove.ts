import { Command } from 'commander';
import { ZKProofEngine } from '@autonomous-lifecycle-protocol-alp/parser';

export function registerProveCommand(program: Command) {
  program
    .command('prove')
    .description('Generate a zero-knowledge compliance proof commitment (v46.0.0)')
    .argument('<statement>', 'Compliance statement to prove (e.g. "vault-key-unsealed")')
    .argument('<secret>', 'Secret value used for commitment')
    .option('--id <id>', 'Proof object ID', 'zk-proof-v46')
    .action((statement, secret, options) => {
      const engine = new ZKProofEngine();
      const proof = engine.generateProof(options.id, statement, secret);

      console.log('\n🔒 Generated Zero-Knowledge Proof (v46.0.0)');
      console.log('==========================================');
      console.log(`  ID:          ${proof.id}`);
      console.log(`  Statement:   ${proof.statement}`);
      console.log(`  Commitment:  ${proof.commitment.slice(0, 16)}...`);
      console.log(`  Proof Hash:  ${proof.proofHash.slice(0, 16)}...`);
      console.log(`  Verified:    ${proof.verified ? '✅ YES' : '❌ NO'}\n`);
    });

  program
    .command('verify-proof')
    .description('Verify an offline zero-knowledge compliance proof hash (v46.0.0)')
    .argument('<statement>', 'Compliance statement')
    .argument('<commitment>', 'Commitment hash')
    .argument('<proofHash>', 'Combined proof hash')
    .action((statement, commitment, proofHash) => {
      const engine = new ZKProofEngine();
      const isValid = engine.verifyProof({
        id: 'zk-check-v46',
        statement,
        commitment,
        proofHash,
        verified: false,
        createdAt: new Date().toISOString(),
      });

      if (isValid) {
        console.log('\n✅ ZK-Proof Verified: Statement is valid without revealing secret!');
      } else {
        console.log('\n❌ ZK-Proof Failed: Invalid proof hash or commitment mismatch.');
        process.exitCode = 1;
      }
    });
}
