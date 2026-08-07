const express = require('express');
const router = express.Router();
const { SOCAlert } = require('../models/Models');
const { middleware } = require('../controllers/AuthController');
const asyncHandler = require('../middleware/asyncHandler');

router.use(middleware.auth);

router.get('/alerts', asyncHandler(async (req, res) => {
  const alerts = await SOCAlert.find({ organization: req.orgId }).sort({ createdAt: -1 });
  res.json(alerts);
}));

router.post('/alerts', asyncHandler(async (req, res) => {
  const alert = await SOCAlert.create({ ...req.body, organization: req.orgId });
  res.status(201).json(alert);
}));

router.get('/alerts/:id', asyncHandler(async (req, res) => {
  const alert = await SOCAlert.findOne({ _id: req.params.id, organization: req.orgId });
  if (!alert) return res.status(404).json({ error: 'Alert not found' });
  res.json(alert);
}));

router.put('/alerts/:id', asyncHandler(async (req, res) => {
  const alert = await SOCAlert.findOneAndUpdate({ _id: req.params.id, organization: req.orgId }, req.body, { new: true });
  if (!alert) return res.status(404).json({ error: 'Alert not found' });
  res.json(alert);
}));

router.post('/alerts/:id/resolve', asyncHandler(async (req, res) => {
  const alert = await SOCAlert.findOneAndUpdate({ _id: req.params.id, organization: req.orgId }, { status: 'resolved', resolvedAt: new Date() }, { new: true });
  if (!alert) return res.status(404).json({ error: 'Alert not found' });
  res.json(alert);
}));

module.exports = router;
