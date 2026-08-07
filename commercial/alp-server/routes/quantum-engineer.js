const express = require('express');
const router = express.Router();
const { QuantumCircuit, QPUJob } = require('../models/Models');
const { middleware } = require('../controllers/AuthController');
const asyncHandler = require('../middleware/asyncHandler');

router.use(middleware.auth);

router.get('/circuits', asyncHandler(async (req, res) => {
  const circuits = await QuantumCircuit.find({ organization: req.orgId }).sort({ createdAt: -1 });
  res.json(circuits);
}));

router.post('/circuits', asyncHandler(async (req, res) => {
  const circuit = await QuantumCircuit.create({ ...req.body, organization: req.orgId });
  res.status(201).json(circuit);
}));

router.get('/circuits/:id', asyncHandler(async (req, res) => {
  const circuit = await QuantumCircuit.findOne({ _id: req.params.id, organization: req.orgId });
  if (!circuit) return res.status(404).json({ error: 'Circuit not found' });
  res.json(circuit);
}));

router.put('/circuits/:id', asyncHandler(async (req, res) => {
  const circuit = await QuantumCircuit.findOneAndUpdate({ _id: req.params.id, organization: req.orgId }, req.body, { new: true });
  if (!circuit) return res.status(404).json({ error: 'Circuit not found' });
  res.json(circuit);
}));

router.post('/circuits/:id/submit', asyncHandler(async (req, res) => {
  const circuit = await QuantumCircuit.findOne({ _id: req.params.id, organization: req.orgId });
  if (!circuit) return res.status(404).json({ error: 'Circuit not found' });
  const job = await QPUJob.create({ circuitId: circuit._id, organization: req.orgId, shots: req.body.shots || 1024 });
  circuit.status = 'submitted';
  await circuit.save();
  res.status(201).json(job);
}));

router.get('/jobs', asyncHandler(async (req, res) => {
  const jobs = await QPUJob.find({ organization: req.orgId }).sort({ createdAt: -1 });
  res.json(jobs);
}));

module.exports = router;
