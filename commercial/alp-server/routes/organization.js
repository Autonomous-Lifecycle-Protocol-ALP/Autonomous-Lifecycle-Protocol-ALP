const express = require('express');
const { Organization, User } = require('../models/Models');
const { middleware } = require('../controllers/AuthController');
const asyncHandler = require('../middleware/asyncHandler');

const router = express.Router();

router.use(middleware.auth);

router.get('/', asyncHandler(async (req, res) => {
  const org = await Organization.findById(req.orgId);
  res.json(org);
}));

router.put('/', asyncHandler(async (req, res) => {
  const { name, billingEmail } = req.body;
  const org = await Organization.findByIdAndUpdate(req.orgId, { name, billingEmail, updatedAt: new Date() }, { new: true });
  res.json(org);
}));

router.get('/users', asyncHandler(async (req, res) => {
  const users = await User.find({ organization: req.orgId });
  res.json(users);
}));

module.exports = router;
