const { Organization, User, Workspace } = require('../models/Models');
const bcrypt = require('bcryptjs');

async function seed() {
  try {
    await require('mongoose').connect(process.env.MONGO_URI || 'mongodb://localhost:27017/alp-enterprise');

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
    await User.create({
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
    await require('mongoose').disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
}

seed();
