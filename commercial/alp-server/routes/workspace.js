const express = require('express');
const { Workspace, Organization } = require('../models/Models');
const { middleware } = require('../controllers/AuthController');
const asyncHandler = require('../middleware/asyncHandler');

const router = express.Router();

router.use(middleware.auth);

router.get('/', asyncHandler(async (req, res) => {
  const ws = await Workspace.find({ organization: req.orgId });
  res.json(ws);
}));

router.post('/', asyncHandler(async (req, res) => {
  const { name, description, gitUrl } = req.body;
  const ws = await Workspace.create({
    organization: req.orgId,
    name,
    slug: name.toLowerCase().replace(/\s/g, '-'),
    description,
    gitUrl,
  });
  req.app.locals.io.emit('workspace-created', ws);
  res.status(201).json(ws);
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const ws = await Workspace.findById(req.params.id);
  if (!ws) return res.status(404).json({ error: 'Not found' });
  res.json(ws);
}));

router.post('/:id/sync', asyncHandler(async (req, res) => {
  const ws = await Workspace.findById(req.params.id);
  if (!ws) return res.status(404).json({ error: 'Not found' });
  ws.lastActivity = new Date();
  await ws.save();
  res.json({ ok: true, message: 'Workspace synced' });
}));

module.exports = router;
