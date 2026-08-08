require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const authRoutes = require('./routes/auth');
const organizationRoutes = require('./routes/organization');
const workspaceRoutes = require('./routes/workspace');
const billingRoutes = require('./routes/billing');
const metricsRoutes = require('./routes/metrics');
const ideRoutes = require('./routes/ide');
const platformRoutes = require('./routes/platform');
const analyticsRoutes = require('./routes/analytics');
const cloudRoutes = require('./routes/cloud');
const agentStudioRoutes = require('./routes/agent-studio');
const securityRoutes = require('./routes/security');
const mobileRoutes = require('./routes/mobile');
const analyticsBiRoutes = require('./routes/analytics-bi');
const devOpsRoutes = require('./routes/devops');
const modelHubRoutes = require('./routes/model-hub');
const dataPipelineRoutes = require('./routes/data-pipeline');
const hybridEngineerRoutes = require('./routes/hybrid-engineer');
const quantumEngineerRoutes = require('./routes/quantum-engineer');
const chipDesignRoutes = require('./routes/chip-design');
const socSentinelRoutes = require('./routes/soc-sentinel');
const threatIntelRoutes = require('./routes/threat-intel');
const zeroTrustRoutes = require('./routes/zero-trust');
const reasoningRoutes = require('./routes/reasoning');
const telemetryRoutes = require('./routes/telemetry');
const federationRoutes = require('./routes/federation');
const zkProofsRoutes = require('./routes/zk-proofs');
const digitalTwinRoutes = require('./routes/digital-twin');

const app = express();
const server = http.createServer(app);

const corsOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim())
  : [process.env.FRONTEND_URL || 'http://localhost:5174', 'http://localhost:5173', 'http://localhost:5175'];

app.use(cors({ origin: corsOrigins, credentials: true }));

app.use(express.json());

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/alp-enterprise')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

const io = new Server(server, {
  cors: { origin: corsOrigins, credentials: true }
});

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  socket.on('disconnect', () => console.log('Client disconnected:', socket.id));
});

app.locals.io = io;

app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));
app.use('/api/auth', authRoutes);
app.use('/api/organizations', organizationRoutes);
app.use('/api/workspaces', workspaceRoutes);
app.use('/api/billing', billingRoutes);
app.use('/api/metrics', metricsRoutes);
app.use('/api/ide', ideRoutes);
app.use('/api/platform', platformRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/cloud/workspaces', cloudRoutes);
app.use('/api/agent-studio/workflows', agentStudioRoutes);
app.use('/api/security', securityRoutes);
app.use('/api/mobile', mobileRoutes);
app.use('/api/analytics-bi', analyticsBiRoutes);
app.use('/api/devops', devOpsRoutes);
app.use('/api/model-hub', modelHubRoutes);
app.use('/api/data-pipeline', dataPipelineRoutes);
app.use('/api/hybrid-engineer', hybridEngineerRoutes);
app.use('/api/quantum-engineer', quantumEngineerRoutes);
app.use('/api/chip-design', chipDesignRoutes);
app.use('/api/soc-sentinel', socSentinelRoutes);
app.use('/api/threat-intel', threatIntelRoutes);
app.use('/api/zero-trust', zeroTrustRoutes);
app.use('/api/reasoning', reasoningRoutes);
app.use('/api/telemetry', telemetryRoutes);
app.use('/api/federation', federationRoutes);
app.use('/api/zk-proofs', zkProofsRoutes);
app.use('/api/digital-twin', digitalTwinRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
if (process.env.VITEST !== 'true') {
  server.listen(PORT, () => console.log('ALP Enterprise server running on port ' + PORT));
}

module.exports = app;
