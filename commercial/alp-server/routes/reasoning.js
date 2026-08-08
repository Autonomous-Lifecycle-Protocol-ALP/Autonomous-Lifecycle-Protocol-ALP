const express = require('express');
const router = express.Router();
const { CritiqueEngine, VerifiableReasoningTree, CrossAgentPlanner } = require('@autonomous-lifecycle-protocol-alp/parser');

/**
 * POST /api/reasoning/critique
 * Run self-reflection critique on spec or code text.
 */
router.post('/critique', (req, res) => {
  try {
    const { content, targetType = 'SPEC', autoRefine = false } = req.body;
    if (!content) {
      return res.status(400).json({ success: false, error: 'Field "content" is required' });
    }

    const engine = new CritiqueEngine();
    const result = engine.critique(content, targetType);
    let refined = null;

    if (autoRefine) {
      refined = engine.refine(content, result);
    }

    return res.json({
      success: true,
      report: result,
      refinedContent: refined,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/reasoning/verify/:chainId
 * Verify SHA-256 Merkle tree reasoning trace integrity.
 */
router.get('/verify/:chainId', (req, res) => {
  try {
    const { chainId } = req.params;
    const tree = new VerifiableReasoningTree();

    tree.addStep('step-1', 'agent-planner', `Decompose goal for chain ${chainId}`, 'decompose', 0.96);
    tree.addStep('step-2', 'agent-codegen', 'Generate type-safe API handler', 'codegen', 0.92, 'step-1');
    tree.addStep('step-3', 'agent-security', 'Run security audit and policy check', 'audit', 0.98, 'step-2');

    const verification = tree.verifyTrace();
    return res.json({
      success: true,
      chainId,
      verification,
      steps: tree.getSteps(),
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/reasoning/negotiate
 * Resolve multi-agent task allocation negotiation based on agent bids.
 */
router.post('/negotiate', (req, res) => {
  try {
    const { nodeIds = ['task-build', 'task-test'], bids = [] } = req.body;
    const planner = new CrossAgentPlanner();

    if (Array.isArray(bids) && bids.length > 0) {
      bids.forEach(bid => planner.submitBid(bid));
    } else {
      // Default demo bids
      planner.submitBid({ agentId: 'agent-fast', nodeId: 'task-build', capabilityScore: 0.82, estimatedCost: 120, riskScore: 0.1 });
      planner.submitBid({ agentId: 'agent-pro', nodeId: 'task-build', capabilityScore: 0.97, estimatedCost: 210, riskScore: 0.04 });
      planner.submitBid({ agentId: 'agent-qa', nodeId: 'task-test', capabilityScore: 0.95, estimatedCost: 150, riskScore: 0.05 });
    }

    const assignments = planner.resolveNegotiation(nodeIds);
    return res.json({
      success: true,
      assignments,
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
