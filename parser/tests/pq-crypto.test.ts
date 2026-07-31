import { describe, it, expect } from 'vitest';
import { PQCryptoEngine } from '../src/pq-crypto';

describe('v54.0.0 PQCryptoEngine — Post-Quantum Cryptographic Trust Anchors', () => {
  it('generates a post-quantum key pair with valid algorithm header', () => {
    const engine = new PQCryptoEngine();
    const keyPair = engine.generateKeyPair('pqc-dilithium5');

    expect(keyPair.keyId).toBeDefined();
    expect(keyPair.algorithm).toBe('pqc-dilithium5');
    expect(keyPair.publicKey).toContain('BEGIN PQC-DILITHIUM5 PUBLIC KEY');
    expect(keyPair.privateKey).toContain('BEGIN PQC-DILITHIUM5 PRIVATE KEY');
  });

  it('signs and verifies a statement payload using post-quantum signatures', () => {
    const engine = new PQCryptoEngine();
    const keyPair = engine.generateKeyPair('pqc-falcon1024');

    const payload = 'deploy-production-swarm-agent-v54';
    const signature = engine.sign(payload, keyPair);

    expect(signature.signatureId).toBeDefined();
    expect(signature.algorithm).toBe('pqc-falcon1024');
    expect(signature.signature).toMatch(/^pq_sig_/);

    const isValid = engine.verify(payload, signature);
    expect(isValid).toBe(true);
  });

  it('rejects tampered payload statements during post-quantum signature verification', () => {
    const engine = new PQCryptoEngine();
    const keyPair = engine.generateKeyPair('pqc-dilithium5');

    const payload = 'valid-payload';
    const signature = engine.sign(payload, keyPair);

    const isTamperedValid = engine.verify('tampered-payload', signature);
    expect(isTamperedValid).toBe(false);
  });
});
