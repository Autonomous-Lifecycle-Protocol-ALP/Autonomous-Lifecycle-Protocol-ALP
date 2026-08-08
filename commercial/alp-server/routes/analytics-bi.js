const express = require('express');
const router = express.Router();
const { AnalyticsDashboard, AnalyticsReport } = require('../models/Models');
const { middleware } = require('../controllers/AuthController');
const asyncHandler = require('../middleware/asyncHandler');

router.use(middleware.auth);

router.get('/dashboards', asyncHandler(async (req, res) => {
  const dashboards = await AnalyticsDashboard.find({ organization: req.orgId }).sort({ createdAt: -1 });
  res.json(dashboards);
}));

router.post('/dashboards', asyncHandler(async (req, res) => {
  const dashboard = await AnalyticsDashboard.create({ ...req.body, organization: req.orgId, owner: req.userId });
  res.status(201).json(dashboard);
}));

router.get('/dashboards/:id', asyncHandler(async (req, res) => {
  const dashboard = await AnalyticsDashboard.findOne({ _id: req.params.id, organization: req.orgId });
  if (!dashboard) return res.status(404).json({ error: 'Dashboard not found' });
  res.json(dashboard);
}));

router.put('/dashboards/:id', asyncHandler(async (req, res) => {
  const dashboard = await AnalyticsDashboard.findOneAndUpdate({ _id: req.params.id, organization: req.orgId }, req.body, { new: true });
  if (!dashboard) return res.status(404).json({ error: 'Dashboard not found' });
  res.json(dashboard);
}));

router.delete('/dashboards/:id', asyncHandler(async (req, res) => {
  const dashboard = await AnalyticsDashboard.findOneAndDelete({ _id: req.params.id, organization: req.orgId });
  if (!dashboard) return res.status(404).json({ error: 'Dashboard not found' });
  res.json({ message: 'Dashboard deleted' });
}));

router.post('/reports', asyncHandler(async (req, res) => {
  const report = await AnalyticsReport.create({ ...req.body, organization: req.orgId });
  res.status(201).json(report);
}));

router.get('/reports', asyncHandler(async (req, res) => {
  const reports = await AnalyticsReport.find({ organization: req.orgId }).sort({ createdAt: -1 });
  res.json(reports);
}));

module.exports = router;
