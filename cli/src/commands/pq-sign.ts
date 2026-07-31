import { Command } from 'commander';
import { PQCryptoEngine, PQAlgorithm } from '@autonomous-lifecycle-protocol-alp/parser';

export function registerPQSignCommand(program: Command) {
  program
    .command('pq-sign')
    .description('Generate post-quantum lattice signatures for workspace payload statements (v54.0.0)')
    .argument('<statement>', 'Payload statement or artifact to sign')
    .option('--algo <algorithm>', 'PQC Algorithm: pqc-dilithium5, pqc-falcon1024', 'pqc-dilithium5')
    .action((statement, options) => {
      const engine = new PQCryptoEngine();
      const algo: PQAlgorithm = options.algo as PQAlgorithm;

      const keyPair = engine.generateKeyPair(algo);
      const signature = engine.sign(statement, keyPair);
      const verified = engine.verify(statement, signature);

      console.log('\n🔐 Quantum-Resistant Cryptographic Signature (v54.0.0)');
      console.log('========================================================');
      console.log(`  Statement:      "${statement}"`);
      console.log(`  Algorithm:      ${signature.algorithm}`);
      console.log(`  Key ID:         ${keyPair.keyId}`);
      console.log(`  Payload Hash:   ${signature.payloadHash.slice(0, 32)}...`);
      console.log(`  Signature:      ${signature.signature.slice(0, 40)}...`);
      console.log(`  Verification:   ${verified ? '✅ VALID (QUANTUM-SAFE)' : '❌ INVALID'}\n`);
    });
}
