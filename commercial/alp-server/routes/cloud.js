const express = require('express');
const { CloudWorkspace } = require('../models/Models');
const { middleware } = require('../controllers/AuthController');
const asyncHandler = require('../middleware/asyncHandler');

const router = express.Router();
router.use(middleware.auth);

router.get('/', asyncHandler(async (req, res) => {
  const workspaces = await CloudWorkspace.find({ organization: req.orgId }).sort({ createdAt: -1 });
  res.json(workspaces);
}));

router.post('/', asyncHandler(async (req, res) => {
  const { name, runtime, region } = req.body;
  const workspace = await CloudWorkspace.create({
    organization: req.orgId,
    name,
    slug: name.toLowerCase().replace(/\s+/g, '-'),
    runtime: runtime || 'node',
    region: region || 'us-east-1',
    owner: req.userId,
  });
  res.status(201).json(workspace);
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const workspace = await CloudWorkspace.findOne({ _id: req.params.id, organization: req.orgId });
  if (!workspace) return res.status(404).json({ error: 'Workspace not found' });
  res.json(workspace);
}));

router.post('/:id/snapshots', asyncHandler(async (req, res) => {
  const workspace = await CloudWorkspace.findOne({ _id: req.params.id, organization: req.orgId });
  if (!workspace) return res.status(404).json({ error: 'Workspace not found' });
  const snapshotId = `snap-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const snapshot = {
    id: snapshotId,
    snapshotId,
    label: req.body.label || 'Manual Snapshot',
    sizeBytes: req.body.sizeBytes || 10240,
    createdAt: new Date(),
  };
  workspace.snapshots = workspace.snapshots || [];
  workspace.snapshots.push(snapshot);
  await workspace.save();
  res.status(201).json(snapshot);
}));

router.get('/:id/snapshots', asyncHandler(async (req, res) => {
  const workspace = await CloudWorkspace.findOne({ _id: req.params.id, organization: req.orgId });
  if (!workspace) return res.status(404).json({ error: 'Workspace not found' });
  res.json(workspace.snapshots || []);
}));

router.post('/:id/snapshots/:snapshotId/rollback', asyncHandler(async (req, res) => {
  const workspace = await CloudWorkspace.findOne({ _id: req.params.id, organization: req.orgId });
  if (!workspace) return res.status(404).json({ error: 'Workspace not found' });
  const snapshots = workspace.snapshots || [];
  const target = snapshots.find(s => s.snapshotId === req.params.snapshotId || s.id === req.params.snapshotId);
  if (!target) return res.status(404).json({ error: 'Snapshot not found' });
  workspace.activeSnapshot = target.snapshotId || target.id;
  await workspace.save();
  res.json({ ok: true, rolledBackTo: target.snapshotId || target.id, workspaceId: workspace._id });
}));

router.post('/:id/members', asyncHandler(async (req, res) => {
  const workspace = await CloudWorkspace.findOne({ _id: req.params.id, organization: req.orgId });
  if (!workspace) return res.status(404).json({ error: 'Workspace not found' });
  const { email, role } = req.body;
  const { User } = require('../models/Models');
  const member = await User.findOne({ email, organization: req.orgId });
  if (!member) return res.status(404).json({ error: 'User not found' });
  workspace.members = workspace.members || [];
  workspace.members.push(member._id);
  await workspace.save();
  res.json({ ok: true, memberId: member._id });
}));

module.exports = router;
