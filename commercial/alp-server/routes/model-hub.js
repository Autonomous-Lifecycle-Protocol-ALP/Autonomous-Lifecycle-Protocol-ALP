const express = require('express');
const router = express.Router();
const { AIModel, ModelRoutingRule } = require('../models/Models');
const { middleware } = require('../controllers/AuthController');
const asyncHandler = require('../middleware/asyncHandler');

router.use(middleware.auth);

router.get('/models', asyncHandler(async (req, res) => {
  const models = await AIModel.find({ organization: req.orgId }).sort({ createdAt: -1 });
  res.json(models);
}));

router.post('/models', asyncHandler(async (req, res) => {
  const model = await AIModel.create({ ...req.body, organization: req.orgId });
  res.status(201).json(model);
}));

router.get('/models/:id', asyncHandler(async (req, res) => {
  const model = await AIModel.findOne({ _id: req.params.id, organization: req.orgId });
  if (!model) return res.status(404).json({ error: 'Model not found' });
  res.json(model);
}));

router.put('/models/:id', asyncHandler(async (req, res) => {
  const model = await AIModel.findOneAndUpdate({ _id: req.params.id, organization: req.orgId }, req.body, { new: true });
  if (!model) return res.status(404).json({ error: 'Model not found' });
  res.json(model);
}));

router.post('/models/:id/versions', asyncHandler(async (req, res) => {
  const model = await AIModel.findOne({ _id: req.params.id, organization: req.orgId });
  if (!model) return res.status(404).json({ error: 'Model not found' });
  const version = { version: (model.versions?.length || 0) + 1, ...req.body, createdAt: new Date() };
  model.versions = model.versions || [];
  model.versions.push(version);
  await model.save();
  res.status(201).json(version);
}));

router.get('/routing-rules', asyncHandler(async (req, res) => {
  const rules = await ModelRoutingRule.find({ organization: req.orgId }).sort({ createdAt: -1 });
  res.json(rules);
}));

router.post('/routing-rules', asyncHandler(async (req, res) => {
  const rule = await ModelRoutingRule.create({ ...req.body, organization: req.orgId });
  res.status(201).json(rule);
}));

module.exports = router;
