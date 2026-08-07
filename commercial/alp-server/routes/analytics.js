const express = require('express');
const { AnalyticsEvent } = require('../models/Models');
const { middleware } = require('../controllers/AuthController');
const asyncHandler = require('../middleware/asyncHandler');

const router = express.Router();

router.use(middleware.auth);

router.post('/events', asyncHandler(async (req, res) => {
  const { event, payload, path, referrer, productId, productName } = req.body;

  if (!event || typeof event !== 'string') {
    return res.status(400).json({ error: 'event is required and must be a string' });
  }

  const doc = await AnalyticsEvent.create({
    event,
    payload: payload || {},
    path: path || req.body.path || '',
    referrer: referrer || req.body.referrer || '',
    productId: productId || req.body.productId || '',
    productName: productName || req.body.productName || '',
    userId: req.userId,
    organization: req.orgId,
    ts: req.body.ts ? new Date(req.body.ts) : undefined
  });

  res.status(201).json({ id: doc._id, event: doc.event, ts: doc.ts });
}));

router.get('/events', asyncHandler(async (req, res) => {
  const { event, productId, start, end, limit } = req.query;
  const query = { organization: req.orgId };

  if (event) query.event = event;
  if (productId) query.productId = productId;
  if (start || end) {
    query.ts = {};
    if (start) query.ts.$gte = new Date(start);
    if (end) query.ts.$lte = new Date(end);
  }

  const events = await AnalyticsEvent.find(query)
    .sort({ ts: -1 })
    .limit(limit ? Math.min(Number(limit) || 100, 500) : 100)
    .lean();

  res.json({ events, count: events.length });
}));

router.get('/summary', asyncHandler(async (req, res) => {
  const { start, end } = req.query;
  const match = { organization: req.orgId };

  if (start || end) {
    match.ts = {};
    if (start) match.ts.$gte = new Date(start);
    if (end) match.ts.$lte = new Date(end);
  }

  const [topEvents, topProducts] = await Promise.all([
    AnalyticsEvent.aggregate([
      { $match: match },
      { $group: { _id: '$event', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]),
    AnalyticsEvent.aggregate([
      { $match: { ...match, productId: { $ne: '' } } },
      { $group: { _id: '$productId', count: { $sum: 1 }, productName: { $first: '$productName' } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ])
  ]);

  res.json({ topEvents, topProducts });
}));

module.exports = router;
