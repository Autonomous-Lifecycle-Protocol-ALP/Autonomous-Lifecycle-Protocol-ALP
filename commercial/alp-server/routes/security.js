const express = require('express');
const { SecurityScan, ComplianceReport } = require('../models/Models');
const { middleware } = require('../controllers/AuthController');
const asyncHandler = require('../middleware/asyncHandler');

const router = express.Router();
router.use(middleware.auth);

router.get('/scans', asyncHandler(async (req, res) => {
  const scans = await SecurityScan.find({ organization: req.orgId }).sort({ createdAt: -1 });
  res.json(scans);
}));

router.post('/scans', asyncHandler(async (req, res) => {
  const { projectId, scanType, target } = req.body;
  const scan = await SecurityScan.create({
    organization: req.orgId,
    projectId,
    scanType: scanType || 'sast',
    target,
    status: 'queued',
  });
  res.status(201).json(scan);
}));

router.get('/scans/:id', asyncHandler(async (req, res) => {
  const scan = await SecurityScan.findOne({ _id: req.params.id, organization: req.orgId });
  if (!scan) return res.status(404).json({ error: 'Scan not found' });
  res.json(scan);
}));

router.post('/scans/:id/run', asyncHandler(async (req, res) => {
  const scan = await SecurityScan.findOne({ _id: req.params.id, organization: req.orgId });
  if (!scan) return res.status(404).json({ error: 'Scan not found' });
  scan.status = 'running';
  scan.startedAt = new Date();
  await scan.save();
  res.json({ ok: true, message: 'Scan started' });
}));

router.post('/scans/:id/complete', asyncHandler(async (req, res) => {
  const scan = await SecurityScan.findOne({ _id: req.params.id, organization: req.orgId });
  if (!scan) return res.status(404).json({ error: 'Scan not found' });
  const { findings, summary } = req.body;
  scan.findings = findings || [];
  scan.summary = summary || {};
  scan.status = 'completed';
  scan.finishedAt = new Date();
  await scan.save();
  res.json(scan);
}));

router.get('/compliance/:framework', asyncHandler(async (req, res) => {
  const report = await ComplianceReport.findOne({ organization: req.orgId, framework: req.params.framework.toUpperCase() }).sort({ generatedAt: -1 });
  if (!report) return res.status(404).json({ error: 'Report not found' });
  res.json(report);
}));

router.post('/compliance/:framework', asyncHandler(async (req, res) => {
  const { rangeStart, rangeEnd, controls, evidenceLinks } = req.body;
  const report = await ComplianceReport.create({
    organization: req.orgId,
    framework: req.params.framework.toUpperCase(),
    rangeStart,
    rangeEnd,
    controls: controls || [],
    evidenceLinks: evidenceLinks || [],
  });
  res.status(201).json(report);
}));

module.exports = router;
