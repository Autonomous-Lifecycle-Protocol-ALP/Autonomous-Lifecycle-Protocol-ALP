const express = require('express');
const router = express.Router();
const { DevOpsPipeline, DevOpsDeployment } = require('../models/Models');
const { middleware } = require('../controllers/AuthController');
const asyncHandler = require('../middleware/asyncHandler');

router.use(middleware.auth);

router.get('/pipelines', asyncHandler(async (req, res) => {
  const pipelines = await DevOpsPipeline.find({ organization: req.orgId }).sort({ createdAt: -1 });
  res.json(pipelines);
}));

router.post('/pipelines', asyncHandler(async (req, res) => {
  const pipeline = await DevOpsPipeline.create({ ...req.body, organization: req.orgId });
  res.status(201).json(pipeline);
}));

router.get('/pipelines/:id', asyncHandler(async (req, res) => {
  const pipeline = await DevOpsPipeline.findOne({ _id: req.params.id, organization: req.orgId });
  if (!pipeline) return res.status(404).json({ error: 'Pipeline not found' });
  res.json(pipeline);
}));

router.put('/pipelines/:id', asyncHandler(async (req, res) => {
  const pipeline = await DevOpsPipeline.findOneAndUpdate({ _id: req.params.id, organization: req.orgId }, req.body, { new: true });
  if (!pipeline) return res.status(404).json({ error: 'Pipeline not found' });
  res.json(pipeline);
}));

router.delete('/pipelines/:id', asyncHandler(async (req, res) => {
  const pipeline = await DevOpsPipeline.findOneAndDelete({ _id: req.params.id, organization: req.orgId });
  if (!pipeline) return res.status(404).json({ error: 'Pipeline not found' });
  res.json({ message: 'Pipeline deleted' });
}));

router.post('/pipelines/:id/deploy', asyncHandler(async (req, res) => {
  const deployment = await DevOpsDeployment.create({
    ...req.body,
    organization: req.orgId,
    pipelineId: req.params.id,
    status: 'deploying'
  });
  res.status(201).json(deployment);
}));

router.get('/deployments', asyncHandler(async (req, res) => {
  const deployments = await DevOpsDeployment.find({ organization: req.orgId }).sort({ createdAt: -1 });
  res.json(deployments);
}));

router.post('/deployments/:id/rollback', asyncHandler(async (req, res) => {
  const deployment = await DevOpsDeployment.findOneAndUpdate({ _id: req.params.id, organization: req.orgId }, { status: 'rolled_back', rolledBackAt: new Date() }, { new: true });
  if (!deployment) return res.status(404).json({ error: 'Deployment not found' });
  res.json(deployment);
}));

module.exports = router;
