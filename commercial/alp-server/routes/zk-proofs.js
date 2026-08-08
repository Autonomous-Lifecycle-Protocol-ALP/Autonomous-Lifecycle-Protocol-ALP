const express = require('express');
const router = express.Router();
const { ZKPolicyVerifier } = require('@autonomous-lifecycle-protocol-alp/parser');
const { createHash } = require('crypto');

const verifier = new ZKPolicyVerifier();

/**
 * POST /api/zk-proofs/generate
 */
router.post('/generate', (req, res) => {
  try {
    const { policyId, secretValue } = req.body;
    const secret = secretValue || 'my-secret-jwt-token';
    const expectedHash = createHash('sha256').update(secret).digest('hex');

    const proof = verifier.generateProof(
      policyId || 'auth-gate-policy',
      secret,
      expectedHash
    );

    return res.json({ success: true, proof });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/zk-proofs/verify
 */
router.post('/verify', (req, res) => {
  try {
    const { proof } = req.body;
    const isValid = verifier.verifyProof(proof || {});
    return res.json({ success: true, verified: isValid });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
