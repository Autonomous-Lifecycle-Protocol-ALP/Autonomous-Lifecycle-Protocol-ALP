const express = require('express');
const router = express.Router();

// Mock telemetry event history
const telemetryEvents = [
  { id: 'evt-101', type: 'REASONING_VERIFIED', title: 'SHA-256 Merkle Trace Verified', detail: 'Chain #chain-v8200 integrity confirmed (3 steps)', timestamp: new Date(Date.now() - 1000 * 60 * 2).toISOString(), status: 'success' },
  { id: 'evt-102', type: 'POLICY_ENFORCED', title: 'Governance Guardrail Executed', detail: 'Policy "auth-security-gate" denied untrusted_exec payload', timestamp: new Date(Date.now() - 1000 * 60 * 8).toISOString(), status: 'warning' },
  { id: 'evt-103', type: 'AGENT_ASSIGNED', title: 'Cross-Agent Task Allocation', detail: 'Agent "agent-pro-omega" assigned to plan node #task-build', timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(), status: 'info' },
  { id: 'evt-104', type: 'CRITIQUE_COMPLETED', title: 'Self-Reflection Critique Passed', detail: 'Overall spec score 92% across Correctness, Security & Perf', timestamp: new Date(Date.now() - 1000 * 60 * 25).toISOString(), status: 'success' },
];

/**
 * GET /api/telemetry/stream
 * Returns live system health, active swarm roster, and recent telemetry events.
 */
router.get('/stream', (req, res) => {
  try {
    return res.json({
      success: true,
      systemHealth: {
        status: 'HEALTHY',
        uptimePercentage: 99.98,
        activeSwarms: 12,
        verifiedMerkleRoots: 1420,
        avgLatencyMs: 4.2,
      },
      events: telemetryEvents,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
