const express = require('express');
const { NeuromorphicSpikeMesh, AdaptiveSynapseOptimizer } = require('../../../parser/dist/neuromorphic-engine');

const router = express.Router();
const meshEngine = new NeuromorphicSpikeMesh();

/**
 * GET /api/neuromorphic/mesh
 * Returns active neuromorphic mesh topology, membrane potentials, and synapse weights.
 */
router.get('/mesh', (req, res) => {
  try {
    const state = meshEngine.getMeshState();
    res.json({ success: true, state });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/neuromorphic/spike
 * Propagates a spike impulse across the neural swarm mesh.
 */
router.post('/spike', (req, res) => {
  try {
    const { sourceNodeId = 'node_sensory_0', amplitude = 1.2 } = req.body;
    const result = meshEngine.propagateSpike(sourceNodeId, Number(amplitude));
    const updatedState = meshEngine.getMeshState();
    res.json({
      success: true,
      impulse: { sourceNodeId, amplitude },
      firedSpikes: result.firedSpikes,
      meshState: updatedState,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/neuromorphic/tune
 * Tunes a synapse weight between source and target nodes.
 */
router.post('/tune', (req, res) => {
  try {
    const { sourceId, targetId, weight } = req.body;
    const updatedNode = meshEngine.tuneSynapseWeight(sourceId, targetId, Number(weight));
    res.json({ success: true, node: updatedNode });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
