const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function startWithMemoryDB() {
  const mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();

  process.env.MONGO_URI = uri;
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'dev-jwt-secret';
  process.env.FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5174';

  await mongoose.connect(uri);
  console.log('Connected to in-memory MongoDB');

  const { Organization, User, Workspace } = require('../models/Models');

  await Organization.deleteMany({});
  await User.deleteMany({});
  await Workspace.deleteMany({});

  const org = await Organization.create({
    name: 'Acme Corp',
    slug: 'acme',
    plan: 'enterprise',
    seatCount: 20,
    billingEmail: 'billing@acme.com',
  });

  const password = await bcrypt.hash('demo123', 10);
  const user = await User.create({
    email: 'demo@alp-enterprise.com',
    name: 'Demo User',
    password,
    organization: org._id,
    role: 'owner',
  });

  await Workspace.create({
    organization: org._id,
    name: 'Acme Backend API',
    slug: 'acme-backend',
    description: 'Primary API service',
    gitUrl: 'https://github.com/acme/api',
    apiSpend: 156000,
    apiSavings: 122000,
    tasksTotal: 420,
    tasksCompleted: 415,
    tasksFailed: 5,
    lastActivity: new Date(),
  });

  await Workspace.create({
    organization: org._id,
    name: 'Acme Frontend App',
    slug: 'acme-frontend',
    description: 'Next.js frontend application',
    gitUrl: 'https://github.com/acme/frontend',
    apiSpend: 98000,
    apiSavings: 77000,
    tasksTotal: 380,
    tasksCompleted: 372,
    tasksFailed: 8,
    lastActivity: new Date(),
  });

  console.log('Seeded: demo@alp-enterprise.com / demo123');

  require('../server');

  process.on('SIGINT', async () => {
    await mongoose.disconnect();
    await mongod.stop();
    process.exit(0);
  });
}

startWithMemoryDB().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
