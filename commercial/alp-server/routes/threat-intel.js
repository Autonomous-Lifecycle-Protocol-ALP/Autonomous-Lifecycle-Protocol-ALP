const express = require('express');
const router = express.Router();
const { ThreatIntelReport } = require('../models/Models');
const { middleware } = require('../controllers/AuthController');
const asyncHandler = require('../middleware/asyncHandler');

router.use(middleware.auth);

router.get('/reports', asyncHandler(async (req, res) => {
  const reports = await ThreatIntelReport.find({ organization: req.orgId }).sort({ createdAt: -1 });
  res.json(reports);
}));

router.post('/reports', asyncHandler(async (req, res) => {
  const report = await ThreatIntelReport.create({ ...req.body, organization: req.orgId });
  res.status(201).json(report);
}));

router.get('/reports/:id', asyncHandler(async (req, res) => {
  const report = await ThreatIntelReport.findOne({ _id: req.params.id, organization: req.orgId });
  if (!report) return res.status(404).json({ error: 'Report not found' });
  res.json(report);
}));

router.put('/reports/:id', asyncHandler(async (req, res) => {
  const report = await ThreatIntelReport.findOneAndUpdate({ _id: req.params.id, organization: req.orgId }, req.body, { new: true });
  if (!report) return res.status(404).json({ error: 'Report not found' });
  res.json(report);
}));

router.post('/reports/:id/publish', asyncHandler(async (req, res) => {
  const report = await ThreatIntelReport.findOneAndUpdate({ _id: req.params.id, organization: req.orgId }, { status: 'published', publishedAt: new Date() }, { new: true });
  if (!report) return res.status(404).json({ error: 'Report not found' });
  res.json(report);
}));

module.exports = router;
