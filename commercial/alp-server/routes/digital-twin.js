const express = require('express');
const router = express.Router();
const { DigitalTwinSyncEngine, QuantumCircuitOptimizer } = require('@autonomous-lifecycle-protocol-alp/parser');

const twinEngine = new DigitalTwinSyncEngine();
const quantumOpt = new QuantumCircuitOptimizer();

// Seed initial telemetry
twinEngine.recordTelemetry({
  sensorId: 'sensor-temp-01',
  temperatureC: 72.4,
  vibrationHz: 14.2,
  pressureBar: 1.02,
  timestamp: new Date().toISOString(),
});

/**
 * GET /api/digital-twin/telemetry
 */
router.get('/telemetry', (req, res) => {
  try {
    const readings = twinEngine.getLatestReadings();
    const anomalies = twinEngine.detectAnomalyThresholds(70.0);
    return res.json({ success: true, readings, anomalies });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/digital-twin/quantum-optimizer
 */
router.post('/quantum-optimizer', (req, res) => {
  try {
    const { circuitId, qubitCount, originalDepth } = req.body;
    const spec = quantumOpt.optimizeCircuit(
      circuitId || 'vqe-ansatz-01',
      qubitCount || 8,
      originalDepth || 40
    );
    return res.json({ success: true, spec });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
