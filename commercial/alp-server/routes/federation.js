const express = require('express');
const router = express.Router();
const { SwarmFederationMesh, MeshSelfHealingEngine } = require('@autonomous-lifecycle-protocol-alp/parser');

const mesh = new SwarmFederationMesh();
const healing = new MeshSelfHealingEngine();

// Seed initial mesh nodes
mesh.registerNode({
  nodeId: 'node-us-east',
  cluster: 'us-east-1',
  status: 'ONLINE',
  workloadCapacity: 100,
  activeTasks: 18,
  latencyMs: 14,
  lastHeartbeat: new Date().toISOString(),
});
mesh.registerNode({
  nodeId: 'node-eu-west',
  cluster: 'eu-west-1',
  status: 'ONLINE',
  workloadCapacity: 120,
  activeTasks: 12,
  latencyMs: 32,
  lastHeartbeat: new Date().toISOString(),
});

/**
 * GET /api/federation/mesh
 */
router.get('/mesh', (req, res) => {
  try {
    const activeNodes = mesh.getActiveNodes();
    const leader = mesh.electLeader();
    const digest = mesh.computeMeshDigest();
    return res.json({
      success: true,
      activeNodes,
      leaderNodeId: leader ? leader.nodeId : null,
      meshDigest: digest,
      diagnostics: healing.getDiagnostics(),
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/federation/healing/trigger
 */
router.post('/healing/trigger', (req, res) => {
  try {
    const { anomalyId, nodeId, traceText } = req.body;
    const diag = healing.analyzeErrorTrace(
      anomalyId || `anom-${Date.now()}`,
      nodeId || 'node-us-east',
      traceText || 'Error: ECONNREFUSED endpoint unreachable'
    );
    return res.json({ success: true, diagnostic: diag });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
