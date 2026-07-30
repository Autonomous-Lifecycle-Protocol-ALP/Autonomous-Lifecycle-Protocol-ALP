import { describe, it, expect } from 'vitest';
import { ZKProofEngine } from '@autonomous-lifecycle-protocol-alp/parser';

describe('v46.0.0 ZK Proof Commands & Engine', () => {
  it('generates a valid zero-knowledge commitment and proof hash', () => {
    const engine = new ZKProofEngine();
    const proof = engine.generateProof('zk-test-1', 'vault-unseal-key', 'secret-passphrase-123');

    expect(proof.id).toBe('zk-test-1');
    expect(proof.statement).toBe('vault-unseal-key');
    expect(proof.commitment).toBeDefined();
    expect(proof.proofHash).toBeDefined();
    expect(proof.verified).toBe(true);
  });

  it('verifies valid zero-knowledge proof commitment', () => {
    const engine = new ZKProofEngine();
    const proof = engine.generateProof('zk-test-2', 'policy-approval', 'admin-key-99');

    const isValid = engine.verifyProof({
      id: proof.id,
      statement: proof.statement,
      commitment: proof.commitment,
      proofHash: proof.proofHash,
      verified: false,
      createdAt: proof.createdAt,
    });

    expect(isValid).toBe(true);
  });

  it('rejects invalid or tampered zero-knowledge commitment', () => {
    const engine = new ZKProofEngine();
    const proof = engine.generateProof('zk-test-3', 'policy-approval', 'admin-key-99');

    const isValid = engine.verifyProof({
      id: proof.id,
      statement: proof.statement,
      commitment: 'tampered-commitment-hash',
      proofHash: proof.proofHash,
      verified: false,
      createdAt: proof.createdAt,
    });

    expect(isValid).toBe(false);
  });
});
