const express = require('express');
const router = express.Router();
const { MobileAppSession, MobilePushNotification } = require('../models/Models');
const { middleware } = require('../controllers/AuthController');
const asyncHandler = require('../middleware/asyncHandler');

router.use(middleware.auth);

router.get('/sessions', asyncHandler(async (req, res) => {
  const sessions = await MobileAppSession.find({ organization: req.orgId }).sort({ createdAt: -1 });
  res.json(sessions);
}));

router.post('/sessions', asyncHandler(async (req, res) => {
  const session = await MobileAppSession.create({ ...req.body, organization: req.orgId });
  res.status(201).json(session);
}));

router.get('/sessions/:id', asyncHandler(async (req, res) => {
  const session = await MobileAppSession.findOne({ _id: req.params.id, organization: req.orgId });
  if (!session) return res.status(404).json({ error: 'Session not found' });
  res.json(session);
}));

router.post('/sessions/:id/push', asyncHandler(async (req, res) => {
  const notification = await MobilePushNotification.create({ ...req.body, organization: req.orgId, sessionId: req.params.id });
  res.status(201).json(notification);
}));

router.get('/notifications', asyncHandler(async (req, res) => {
  const notifications = await MobilePushNotification.find({ organization: req.orgId }).sort({ createdAt: -1 });
  res.json(notifications);
}));

module.exports = router;
