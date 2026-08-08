const express = require('express');
const router = express.Router();
const { DataPipeline, PipelineRun } = require('../models/Models');
const { middleware } = require('../controllers/AuthController');
const asyncHandler = require('../middleware/asyncHandler');

router.use(middleware.auth);

router.get('/pipelines', asyncHandler(async (req, res) => {
  const pipelines = await DataPipeline.find({ organization: req.orgId }).sort({ createdAt: -1 });
  res.json(pipelines);
}));

router.post('/pipelines', asyncHandler(async (req, res) => {
  const pipeline = await DataPipeline.create({ ...req.body, organization: req.orgId, owner: req.userId });
  res.status(201).json(pipeline);
}));

router.get('/pipelines/:id', asyncHandler(async (req, res) => {
  const pipeline = await DataPipeline.findOne({ _id: req.params.id, organization: req.orgId });
  if (!pipeline) return res.status(404).json({ error: 'Pipeline not found' });
  res.json(pipeline);
}));

router.put('/pipelines/:id', asyncHandler(async (req, res) => {
  const pipeline = await DataPipeline.findOneAndUpdate({ _id: req.params.id, organization: req.orgId }, req.body, { new: true });
  if (!pipeline) return res.status(404).json({ error: 'Pipeline not found' });
  res.json(pipeline);
}));

router.delete('/pipelines/:id', asyncHandler(async (req, res) => {
  const pipeline = await DataPipeline.findOneAndDelete({ _id: req.params.id, organization: req.orgId });
  if (!pipeline) return res.status(404).json({ error: 'Pipeline not found' });
  res.json({ message: 'Pipeline deleted' });
}));

router.post('/pipelines/:id/run', asyncHandler(async (req, res) => {
  const run = await PipelineRun.create({ pipelineId: req.params.id, organization: req.orgId, status: 'queued' });
  res.status(201).json(run);
}));

router.get('/runs', asyncHandler(async (req, res) => {
  const runs = await PipelineRun.find({ organization: req.orgId }).sort({ createdAt: -1 });
  res.json(runs);
}));

module.exports = router;
