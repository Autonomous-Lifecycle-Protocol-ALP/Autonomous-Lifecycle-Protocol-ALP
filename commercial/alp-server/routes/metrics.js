const express = require('express');
const { Workspace } = require('../models/Models');
const { middleware } = require('../controllers/AuthController');
const asyncHandler = require('../middleware/asyncHandler');

const router = express.Router();

router.use(middleware.auth);

router.get('/savings', asyncHandler(async (req, res) => {
  const ws = await Workspace.find({ organization: req.orgId });
  const totalApiSpend = ws.reduce((sum, w) => sum + w.apiSpend, 0);
  const totalApiSavings = ws.reduce((sum, w) => sum + w.apiSavings, 0);
  const totalTasks = ws.reduce((sum, w) => sum + w.tasksTotal, 0);
  const failed = ws.reduce((sum, w) => sum + w.tasksFailed, 0);
  const successRate = totalTasks > 0 ? ((totalTasks - failed) / totalTasks) * 100 : 0;
  const savingsPerDev = totalApiSavings > 0 ? totalApiSavings / Math.max(1, ws.length) : 0;

  res.json({
    totalApiSpend,
    totalApiSavings,
    savingsPerDev: Math.max(0, savingsPerDev),
    tasksTotal: totalTasks,
    tasksCompleted: totalTasks - failed,
    taskSuccessRate: successRate,
    savingsThreshold: 1400,
    meetsThreshold: savingsPerDev >= 1400,
    breakdown: {
      apiSavings: totalApiSavings,
      timeSavings: ws.reduce((sum, w) => sum + (w.tasksTotal * 0.05 * 48), 0),
      reworkAvoidance: ws.reduce((sum, w) => sum + (w.tasksFailed * 4 * 48), 0),
    }
  });
}));

router.get('/workspace/:id/metrics', asyncHandler(async (req, res) => {
  const ws = await Workspace.findById(req.params.id);
  if (!ws) return res.status(404).json({ error: 'Not found' });
  res.json({
    contextSpeed: { before: 145, after: 1.8, speedup: 80.6 },
    tokenReduction: 78,
    tasksTotal: ws.tasksTotal,
    tasksCompleted: ws.tasksCompleted,
    tasksFailed: ws.tasksFailed,
    successRate: ws.tasksTotal > 0 ? ((ws.tasksTotal - ws.tasksFailed) / ws.tasksTotal) * 100 : 0
  });
}));

module.exports = router;
