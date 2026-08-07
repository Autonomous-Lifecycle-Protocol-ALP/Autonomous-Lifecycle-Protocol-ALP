const express = require('express');
const router = express.Router();
const { ChipDesign } = require('../models/Models');
const { middleware } = require('../controllers/AuthController');
const asyncHandler = require('../middleware/asyncHandler');

router.use(middleware.auth);

router.get('/designs', asyncHandler(async (req, res) => {
  const designs = await ChipDesign.find({ organization: req.orgId }).sort({ createdAt: -1 });
  res.json(designs);
}));

router.post('/designs', asyncHandler(async (req, res) => {
  const design = await ChipDesign.create({ ...req.body, organization: req.orgId });
  res.status(201).json(design);
}));

router.get('/designs/:id', asyncHandler(async (req, res) => {
  const design = await ChipDesign.findOne({ _id: req.params.id, organization: req.orgId });
  if (!design) return res.status(404).json({ error: 'Design not found' });
  res.json(design);
}));

router.put('/designs/:id', asyncHandler(async (req, res) => {
  const design = await ChipDesign.findOneAndUpdate({ _id: req.params.id, organization: req.orgId }, req.body, { new: true });
  if (!design) return res.status(404).json({ error: 'Design not found' });
  res.json(design);
}));

router.post('/designs/:id/synthesize', asyncHandler(async (req, res) => {
  const design = await ChipDesign.findOne({ _id: req.params.id, organization: req.orgId });
  if (!design) return res.status(404).json({ error: 'Design not found' });
  design.status = 'synthesis';
  design.synthesis = { startedAt: new Date(), tool: req.body.tool || 'yosys' };
  await design.save();
  res.json(design);
}));

module.exports = router;
