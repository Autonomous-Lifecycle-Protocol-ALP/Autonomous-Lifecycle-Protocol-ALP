import { describe, it, expect } from 'vitest';
import { ZKPolicyVerifier } from '../src/zk-proof-engine';
import { createHash } from 'crypto';

describe('ZKPolicyVerifier (v84.0.0)', () => {
  it('generates cryptographic ZK policy proof and verifies token', () => {
    const verifier = new ZKPolicyVerifier();
    const secret = 'my-secret-jwt-token';
    const expectedHash = createHash('sha256').update(secret).digest('hex');

    const proof = verifier.generateProof('auth-gate-policy', secret, expectedHash);
    expect(proof.verified).toBe(true);
    expect(proof.zkProofToken).toHaveLength(64);
    expect(verifier.verifyProof(proof)).toBe(true);
  });
});
