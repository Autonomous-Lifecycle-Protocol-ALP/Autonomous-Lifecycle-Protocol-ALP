const express = require('express');
const router = express.Router();
const { TrustIdentity } = require('../models/Models');
const { middleware } = require('../controllers/AuthController');
const asyncHandler = require('../middleware/asyncHandler');

router.use(middleware.auth);

router.get('/identities', asyncHandler(async (req, res) => {
  const identities = await TrustIdentity.find({ organization: req.orgId }).sort({ createdAt: -1 });
  res.json(identities);
}));

router.post('/identities', asyncHandler(async (req, res) => {
  const identity = await TrustIdentity.create({ ...req.body, organization: req.orgId });
  res.status(201).json(identity);
}));

router.get('/identities/:id', asyncHandler(async (req, res) => {
  const identity = await TrustIdentity.findOne({ _id: req.params.id, organization: req.orgId });
  if (!identity) return res.status(404).json({ error: 'Identity not found' });
  res.json(identity);
}));

router.put('/identities/:id', asyncHandler(async (req, res) => {
  const identity = await TrustIdentity.findOneAndUpdate({ _id: req.params.id, organization: req.orgId }, req.body, { new: true });
  if (!identity) return res.status(404).json({ error: 'Identity not found' });
  res.json(identity);
}));

router.post('/identities/:id/authenticate', asyncHandler(async (req, res) => {
  const identity = await TrustIdentity.findOneAndUpdate({ _id: req.params.id, organization: req.orgId }, { lastAuthenticatedAt: new Date() }, { new: true });
  if (!identity) return res.status(404).json({ error: 'Identity not found' });
  res.json(identity);
}));

module.exports = router;
