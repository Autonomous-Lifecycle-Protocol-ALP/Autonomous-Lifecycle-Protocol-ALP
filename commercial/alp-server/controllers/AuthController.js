const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { User, Organization } = require('../models/Models');

module.exports = {
  login: async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).populate('organization');
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const valid = await bcrypt.compare(password, user.password || '');
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ userId: user._id, orgId: user.organization?._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    await User.findByIdAndUpdate(user._id, { lastLogin: new Date() });
    res.json({ token, user: { id: user._id, email: user.email, name: user.name, role: user.role, organization: user.organization } });
  },

  register: async (req, res) => {
    const { email, name, password, organizationName } = req.body;
    let org = await Organization.findOne({ slug: organizationName.toLowerCase().replace(/\s/g, '-') });
    if (!org) {
      org = await Organization.create({ name: organizationName, slug: organizationName.toLowerCase().replace(/\s/g, '-'), plan: 'community' });
    }
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ email, name, password: hashed, organization: org._id, role: 'owner' });
    const token = jwt.sign({ userId: user._id, orgId: org._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, email: user.email, name: user.name, role: user.role, organization: org } });
  },

  getProfile: async (req, res) => {
    const user = await User.findById(req.userId).populate('organization');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user: { id: user._id, email: user.email, name: user.name, role: user.role, organization: user.organization } });
  }
};

module.exports.middleware = {
  auth: async (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token provided' });
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.userId = decoded.userId;
      req.orgId = decoded.orgId;
      next();
    } catch {
      res.status(401).json({ error: 'Invalid token' });
    }
  }
};
