const express = require('express');
const router = express.Router();
const { HardwareProject, SimulationJob } = require('../models/Models');
const { middleware } = require('../controllers/AuthController');
const asyncHandler = require('../middleware/asyncHandler');

router.use(middleware.auth);

router.get('/projects', asyncHandler(async (req, res) => {
  const projects = await HardwareProject.find({ organization: req.orgId }).sort({ createdAt: -1 });
  res.json(projects);
}));

router.post('/projects', asyncHandler(async (req, res) => {
  const project = await HardwareProject.create({ ...req.body, organization: req.orgId });
  res.status(201).json(project);
}));

router.get('/projects/:id', asyncHandler(async (req, res) => {
  const project = await HardwareProject.findOne({ _id: req.params.id, organization: req.orgId });
  if (!project) return res.status(404).json({ error: 'Project not found' });
  res.json(project);
}));

router.put('/projects/:id', asyncHandler(async (req, res) => {
  const project = await HardwareProject.findOneAndUpdate({ _id: req.params.id, organization: req.orgId }, req.body, { new: true });
  if (!project) return res.status(404).json({ error: 'Project not found' });
  res.json(project);
}));

router.post('/projects/:id/simulate', asyncHandler(async (req, res) => {
  const job = await SimulationJob.create({ projectId: req.params.id, organization: req.orgId, ...req.body, status: 'queued' });
  res.status(201).json(job);
}));

router.get('/simulations', asyncHandler(async (req, res) => {
  const jobs = await SimulationJob.find({ organization: req.orgId }).sort({ createdAt: -1 });
  res.json(jobs);
}));

module.exports = router;
