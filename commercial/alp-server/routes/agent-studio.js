const express = require('express');
const { AgentWorkflow } = require('../models/Models');
const { middleware } = require('../controllers/AuthController');
const asyncHandler = require('../middleware/asyncHandler');

const router = express.Router();
router.use(middleware.auth);

router.get('/', asyncHandler(async (req, res) => {
  const workflows = await AgentWorkflow.find({ organization: req.orgId }).sort({ createdAt: -1 });
  res.json(workflows);
}));

router.post('/', asyncHandler(async (req, res) => {
  const { name, description, graph, modelRouting, budget } = req.body;
  const workflow = await AgentWorkflow.create({
    organization: req.orgId,
    name,
    description,
    graph: graph || { nodes: [], edges: [] },
    modelRouting: modelRouting || {},
    budget: budget || {},
    createdBy: req.userId,
  });
  res.status(201).json(workflow);
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const workflow = await AgentWorkflow.findOne({ _id: req.params.id, organization: req.orgId });
  if (!workflow) return res.status(404).json({ error: 'Workflow not found' });
  res.json(workflow);
}));

router.post('/:id/versions', asyncHandler(async (req, res) => {
  const workflow = await AgentWorkflow.findOne({ _id: req.params.id, organization: req.orgId });
  if (!workflow) return res.status(404).json({ error: 'Workflow not found' });
  workflow.versions = workflow.versions || [];
  workflow.versions.push({
    version: (workflow.versions.length + 1),
    graph: workflow.graph,
    createdAt: new Date(),
  });
  await workflow.save();
  res.status(201).json({ version: workflow.versions.length });
}));

router.get('/:id/versions/:versionId', asyncHandler(async (req, res) => {
  const workflow = await AgentWorkflow.findOne({ _id: req.params.id, organization: req.orgId });
  if (!workflow) return res.status(404).json({ error: 'Workflow not found' });
  const version = workflow.versions.find(v => v.version === Number(req.params.versionId));
  if (!version) return res.status(404).json({ error: 'Version not found' });
  res.json(version);
}));

router.post('/:id/simulate', asyncHandler(async (req, res) => {
  const workflow = await AgentWorkflow.findOne({ _id: req.params.id, organization: req.orgId });
  if (!workflow) return res.status(404).json({ error: 'Workflow not found' });
  const trace = {
    workflowId: workflow._id,
    status: 'completed',
    nodes: (workflow.graph.nodes || []).map(node => ({
      id: node.id,
      status: 'ok',
      latencyMs: Math.floor(Math.random() * 2000) + 100,
      estimatedCost: Number((Math.random() * 0.05).toFixed(4)),
    })),
    totalLatencyMs: 0,
    totalCost: 0,
  };
  trace.totalLatencyMs = trace.nodes.reduce((sum, n) => sum + n.latencyMs, 0);
  trace.totalCost = Number(trace.nodes.reduce((sum, n) => sum + n.estimatedCost, 0).toFixed(4));
  res.json(trace);
}));

module.exports = router;
