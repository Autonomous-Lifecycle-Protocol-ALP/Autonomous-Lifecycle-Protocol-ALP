import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const app = express();
app.use(express.json());

const JWT_SECRET = 'dev-jwt-secret';
const MOCK_USERS = [
  {
    _id: '65f1a2b3c4d5e6f7a8b9c0d1',
    email: 'demo@alp-enterprise.com',
    name: 'Demo User',
    password: bcrypt.hashSync('demo123', 10),
    role: 'owner',
    organization: {
      _id: '65f1a2b3c4d5e6f7a8b9c0d2',
      name: 'Acme Corp',
      slug: 'acme',
      plan: 'enterprise',
    },
  },
];

const MOCK_ORGANIZATIONS = [
  { _id: '65f1a2b3c4d5e6f7a8b9c0d2', name: 'Acme Corp', slug: 'acme', plan: 'enterprise' },
];

const STORE = {
  pipelines: [],
  deployments: [],
  dashboards: [],
  reports: [],
  workflows: [],
  scans: [],
};

function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'No token provided' });
  try {
    const decoded = jwt.verify(auth.split(' ')[1], JWT_SECRET);
    req.userId = decoded.userId;
    req.orgId = decoded.orgId;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const user = MOCK_USERS.find((u) => u.email === email);
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const token = jwt.sign(
    { userId: user._id, orgId: user.organization._id },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
  res.json({
    token,
    user: {
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      organization: user.organization,
    },
  });
});

app.post('/api/auth/register', (req, res) => {
  const { email, name, password, organizationName } = req.body;
  const hashed = bcrypt.hashSync(password, 10);
  const orgSlug = organizationName.toLowerCase().replace(/\s/g, '-');
  let org = MOCK_ORGANIZATIONS.find((o) => o.slug === orgSlug);
  if (!org) {
    org = { _id: `org-${Date.now()}`, name: organizationName, slug: orgSlug, plan: 'community' };
    MOCK_ORGANIZATIONS.push(org);
  }
  const user = {
    _id: `user-${Date.now()}`,
    email,
    name,
    password: hashed,
    organization: org,
    role: 'owner',
  };
  MOCK_USERS.push(user);
  const token = jwt.sign({ userId: user._id, orgId: org._id }, JWT_SECRET, { expiresIn: '7d' });
  res.json({
    token,
    user: { id: user._id, email: user.email, name: user.name, role: user.role, organization: org },
  });
});

app.get('/api/auth/profile', authMiddleware, (req, res) => {
  const user = MOCK_USERS.find((u) => u._id === req.userId);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ user: { id: user._id, email: user.email, name: user.name, role: user.role, organization: user.organization } });
});

app.get('/api/auth/me', authMiddleware, (req, res) => {
  const user = MOCK_USERS.find((u) => u._id === req.userId);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ user: { id: user._id, email: user.email, name: user.name, role: user.role, organization: user.organization } });
});

app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

app.get('/api/metrics/savings', authMiddleware, (req, res) => {
  res.json({
    totalApiSavings: 278000,
    tasksTotal: 420,
    tasksCompleted: 415,
    tasksFailed: 5,
    savingsPerDev: 18420,
    meetsThreshold: true,
    breakdown: {
      apiSavings: 156000,
      timeSavings: 89000,
      reworkAvoidance: 33000,
    },
  });
});

app.get('/api/analytics-bi/dashboards', authMiddleware, (req, res) => {
  res.json(STORE.dashboards);
});

app.post('/api/analytics-bi/dashboards', authMiddleware, (req, res) => {
  const item = { _id: `db-${Date.now()}`, ...req.body, createdAt: new Date() };
  STORE.dashboards.push(item);
  res.json(item);
});

app.get('/api/analytics-bi/reports', authMiddleware, (req, res) => {
  res.json(STORE.reports);
});

app.post('/api/analytics-bi/reports', authMiddleware, (req, res) => {
  const item = { _id: `rpt-${Date.now()}`, ...req.body, createdAt: new Date() };
  STORE.reports.push(item);
  res.json(item);
});

app.get('/api/devops/pipelines', authMiddleware, (req, res) => {
  res.json(STORE.pipelines);
});

app.get('/api/devops/deployments', authMiddleware, (req, res) => {
  res.json(STORE.deployments);
});

app.post('/api/devops/pipelines', authMiddleware, (req, res) => {
  const item = { _id: `pipe-${Date.now()}`, ...req.body, createdAt: new Date(), lastRunStatus: 'pending' };
  STORE.pipelines.push(item);
  res.json(item);
});

app.get('/api/agent-studio/workflows', authMiddleware, (req, res) => {
  res.json(STORE.workflows);
});

app.post('/api/agent-studio/workflows', authMiddleware, (req, res) => {
  const item = { _id: `wf-${Date.now()}`, ...req.body, createdAt: new Date() };
  STORE.workflows.push(item);
  res.json(item);
});

app.get('/api/security/scans', authMiddleware, (req, res) => {
  res.json(STORE.scans);
});

app.post('/api/security/scans', authMiddleware, (req, res) => {
  const item = { _id: `scan-${Date.now()}`, ...req.body, createdAt: new Date() };
  STORE.scans.push(item);
  res.json(item);
});

app.get('/api/workspaces', authMiddleware, (req, res) => {
  res.json([]);
});

app.get('/api/analytics/summary', authMiddleware, (req, res) => {
  res.json({});
});

app.get('/api/analytics/events', authMiddleware, (req, res) => {
  res.json([]);
});

app.use((req, res) => {
  res.status(404).json({ error: 'Not found (mock server)' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Mock ALP server running on port ${PORT}`));
