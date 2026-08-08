const mongoose = require('mongoose');

const OrganizationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  plan: { type: String, enum: ['community', 'pro', 'enterprise'], default: 'community' },
  billingEmail: String,
  stripeCustomerId: String,
  seatCount: { type: Number, default: 1 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const WorkspaceSchema = new mongoose.Schema({
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  name: { type: String, required: true },
  slug: { type: String, required: true },
  description: String,
  gitUrl: String,
  alpVersion: { type: String, default: '80.0.0' },
  status: { type: String, enum: ['planned', 'active', 'blocked', 'completed'], default: 'active' },
  apiSpend: { type: Number, default: 0 },
  apiSavings: { type: Number, default: 0 },
  tasksTotal: { type: Number, default: 0 },
  tasksCompleted: { type: Number, default: 0 },
  tasksFailed: { type: Number, default: 0 },
  lastActivity: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  name: String,
  password: { type: String, required: true },
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
  role: { type: String, enum: ['owner', 'admin', 'member'], default: 'member' },
  lastLogin: Date,
  createdAt: { type: Date, default: Date.now }
});

const PlatformProjectSchema = new mongoose.Schema({
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  name: { type: String, required: true },
  description: String,
  owner: { type: String, required: true },
  framework: String,
  libraries: [String],
  milestones: [Object],
  resources: [Object],
  status: { type: String, enum: ['planned', 'active', 'blocked', 'completed'], default: 'planned' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const PlatformDeviceSchema = new mongoose.Schema({
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  name: { type: String, required: true },
  kind: { type: String, required: true },
  vendor: String,
  status: { type: String, enum: ['online', 'offline', 'error', 'provisioning'], default: 'offline' },
  specs: Object,
  sensors: [Object],
  location: Object,
  lastSeen: { type: Date, default: Date.now }
});

const PlatformPlanSchema = new mongoose.Schema({
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  name: { type: String, required: true },
  description: String,
  tier: { type: String, enum: ['community', 'pro', 'enterprise', 'custom'], default: 'community' },
  roadmap: [Object],
  dependencies: [String],
  estimatedCost: Object,
  targetLaunch: Date,
  status: { type: String, enum: ['draft', 'approved', 'in_progress', 'shipped'], default: 'draft' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const AnalyticsEventSchema = new mongoose.Schema({
  event: { type: String, required: true, index: true },
  payload: Object,
  path: String,
  referrer: String,
  productId: String,
  productName: String,
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization' },
  ts: { type: Date, default: Date.now, index: true }
});

const CloudWorkspaceSchema = new mongoose.Schema({
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  status: { type: String, enum: ['provisioning', 'active', 'stopped', 'error'], default: 'provisioning' },
  runtime: { type: String, enum: ['node', 'python', 'go', 'rust'], default: 'node' },
  region: { type: String, default: 'us-east-1' },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  containerId: String,
  endpoint: String,
  snapshots: [{ id: String, createdAt: { type: Date, default: Date.now } }],
  lastHealthCheck: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const AgentWorkflowSchema = new mongoose.Schema({
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  name: { type: String, required: true },
  description: String,
  status: { type: String, enum: ['draft', 'active', 'archived'], default: 'draft' },
  graph: Object,
  modelRouting: Object,
  budget: Object,
  versions: [{ version: Number, graph: Object, createdAt: { type: Date, default: Date.now } }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const SecurityScanSchema = new mongoose.Schema({
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  projectId: String,
  status: { type: String, enum: ['queued', 'running', 'completed', 'failed'], default: 'queued' },
  scanType: { type: String, enum: ['sast', 'dast', 'sca', 'iac'], default: 'sast' },
  target: String,
  findings: [Object],
  summary: Object,
  startedAt: Date,
  finishedAt: Date,
  createdAt: { type: Date, default: Date.now }
});

const ComplianceReportSchema = new mongoose.Schema({
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  framework: { type: String, enum: ['SOC2', 'ISO27001', 'GDPR', 'HIPAA'], required: true },
  rangeStart: Date,
  rangeEnd: Date,
  controls: [Object],
  evidenceLinks: [String],
  generatedAt: { type: Date, default: Date.now }
});

const MobileAppSessionSchema = new mongoose.Schema({
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  deviceId: String,
  platform: { type: String, enum: ['ios', 'android'], required: true },
  appVersion: String,
  pushToken: String,
  lastActiveAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now }
});

const MobilePushNotificationSchema = new mongoose.Schema({
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'MobileAppSession' },
  title: String,
  body: String,
  data: Object,
  status: { type: String, enum: ['queued', 'sent', 'delivered', 'failed'], default: 'queued' },
  sentAt: Date,
  deliveredAt: Date,
  createdAt: { type: Date, default: Date.now }
});

const AnalyticsDashboardSchema = new mongoose.Schema({
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  description: String,
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  widgets: [Object],
  filters: [Object],
  isPublic: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const AnalyticsReportSchema = new mongoose.Schema({
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  dashboardId: { type: mongoose.Schema.Types.ObjectId, ref: 'AnalyticsDashboard' },
  name: { type: String, required: true },
  type: { type: String, enum: ['scheduled', 'adhoc', 'export'], default: 'adhoc' },
  format: { type: String, enum: ['json', 'csv', 'pdf'], default: 'json' },
  parameters: Object,
  result: Object,
  generatedAt: { type: Date, default: Date.now }
});

const DevOpsPipelineSchema = new mongoose.Schema({
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  name: { type: String, required: true },
  provider: { type: String, enum: ['github', 'gitlab', 'circleci', 'jenkins', 'argocd'], required: true },
  config: Object,
  lastRunStatus: { type: String, enum: ['success', 'failed', 'running', 'pending'], default: 'pending' },
  lastRunAt: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const DevOpsDeploymentSchema = new mongoose.Schema({
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  pipelineId: { type: mongoose.Schema.Types.ObjectId, ref: 'DevOpsPipeline' },
  environment: { type: String, enum: ['dev', 'staging', 'prod'], required: true },
  status: { type: String, enum: ['pending', 'deploying', 'success', 'failed', 'rolled_back'], default: 'pending' },
  version: String,
  artifactUrl: String,
  deployedAt: Date,
  rolledBackAt: Date,
  createdAt: { type: Date, default: Date.now }
});

const AIModelSchema = new mongoose.Schema({
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  provider: { type: String, enum: ['openai', 'anthropic', 'google', 'azure', 'custom'], required: true },
  task: String,
  baseModel: String,
  fineTuned: { type: Boolean, default: false },
  endpoint: String,
  pricing: Object,
  metrics: Object,
  isPublic: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const ModelRoutingRuleSchema = new mongoose.Schema({
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  name: { type: String, required: true },
  task: String,
  models: [{ modelId: { type: mongoose.Schema.Types.ObjectId, ref: 'AIModel' }, weight: Number }],
  fallback: { type: mongoose.Schema.Types.ObjectId, ref: 'AIModel' },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

const DataPipelineSchema = new mongoose.Schema({
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  name: { type: String, required: true },
  description: String,
  graph: Object,
  schedule: String,
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['draft', 'active', 'paused', 'error'], default: 'draft' },
  lastRunAt: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const PipelineRunSchema = new mongoose.Schema({
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  pipelineId: { type: mongoose.Schema.Types.ObjectId, ref: 'DataPipeline', required: true },
  status: { type: String, enum: ['queued', 'running', 'success', 'failed'], default: 'queued' },
  startedAt: Date,
  finishedAt: Date,
  metrics: Object,
  logs: [String],
  createdAt: { type: Date, default: Date.now }
});

const HardwareProjectSchema = new mongoose.Schema({
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  name: { type: String, required: true },
  description: String,
  platform: { type: String, enum: ['stm32', 'esp32', 'arduino', 'custom'], required: true },
  firmware: Object,
  bom: [Object],
  status: { type: String, enum: ['draft', 'prototype', 'testing', 'production'], default: 'draft' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const SimulationJobSchema = new mongoose.Schema({
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'HardwareProject' },
  type: { type: String, enum: ['fea', 'cfd', 'thermal', 'vibration'], required: true },
  status: { type: String, enum: ['queued', 'running', 'completed', 'failed'], default: 'queued' },
  input: Object,
  result: Object,
  startedAt: Date,
  finishedAt: Date,
  createdAt: { type: Date, default: Date.now }
});

const QuantumCircuitSchema = new mongoose.Schema({
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  name: { type: String, required: true },
  qubits: { type: Number, required: true },
  gates: [Object],
  provider: { type: String, enum: ['ibm', 'rigetti', 'ionq', 'aws_braket'], required: true },
  status: { type: String, enum: ['draft', 'submitted', 'running', 'completed', 'failed'], default: 'draft' },
  createdAt: { type: Date, default: Date.now }
});

const QPUJobSchema = new mongoose.Schema({
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  circuitId: { type: mongoose.Schema.Types.ObjectId, ref: 'QuantumCircuit', required: true },
  providerJobId: String,
  status: { type: String, enum: ['queued', 'running', 'completed', 'failed', 'cancelled'], default: 'queued' },
  shots: Number,
  result: Object,
  errorMitigation: Object,
  startedAt: Date,
  finishedAt: Date,
  createdAt: { type: Date, default: Date.now }
});

const ChipDesignSchema = new mongoose.Schema({
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  name: { type: String, required: true },
  technology: String,
  status: { type: String, enum: ['rtl', 'synthesis', 'pnr', 'sta', 'tapeout'], default: 'rtl' },
  rtl: Object,
  synthesis: Object,
  pnr: Object,
  sta: Object,
  tapeout: Object,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const SOCAlertSchema = new mongoose.Schema({
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  severity: { type: String, enum: ['low', 'medium', 'high', 'critical'], required: true },
  category: String,
  title: { type: String, required: true },
  description: String,
  source: String,
  status: { type: String, enum: ['open', 'investigating', 'resolved', 'false_positive'], default: 'open' },
  mitreTactics: [String],
  mitreTechniques: [String],
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  resolvedAt: Date,
  createdAt: { type: Date, default: Date.now }
});

const ThreatIntelReportSchema = new mongoose.Schema({
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  title: { type: String, required: true },
  iocs: [Object],
  threatActors: [String],
  affectedAssets: [String],
  cvssScores: [Object],
  remediation: [Object],
  status: { type: String, enum: ['draft', 'published', 'archived'], default: 'draft' },
  publishedAt: Date,
  createdAt: { type: Date, default: Date.now }
});

const TrustIdentitySchema = new mongoose.Schema({
  organization: { type: mongoose.Schema.Types.ObjectId, ref: 'Organization', required: true },
  subject: { type: String, required: true, unique: true },
  type: { type: String, enum: ['agent', 'task', 'user', 'service'], required: true },
  spiiffeId: String,
  certificate: Object,
  policy: Object,
  lastAuthenticatedAt: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = {
  Organization: mongoose.model('Organization', OrganizationSchema),
  Workspace: mongoose.model('Workspace', WorkspaceSchema),
  User: mongoose.model('User', UserSchema),
  PlatformProject: mongoose.model('PlatformProject', PlatformProjectSchema),
  PlatformDevice: mongoose.model('PlatformDevice', PlatformDeviceSchema),
  PlatformPlan: mongoose.model('PlatformPlan', PlatformPlanSchema),
  AnalyticsEvent: mongoose.model('AnalyticsEvent', AnalyticsEventSchema),
  CloudWorkspace: mongoose.model('CloudWorkspace', CloudWorkspaceSchema),
  AgentWorkflow: mongoose.model('AgentWorkflow', AgentWorkflowSchema),
  SecurityScan: mongoose.model('SecurityScan', SecurityScanSchema),
  ComplianceReport: mongoose.model('ComplianceReport', ComplianceReportSchema),
  MobileAppSession: mongoose.model('MobileAppSession', MobileAppSessionSchema),
  MobilePushNotification: mongoose.model('MobilePushNotification', MobilePushNotificationSchema),
  AnalyticsDashboard: mongoose.model('AnalyticsDashboard', AnalyticsDashboardSchema),
  AnalyticsReport: mongoose.model('AnalyticsReport', AnalyticsReportSchema),
  DevOpsPipeline: mongoose.model('DevOpsPipeline', DevOpsPipelineSchema),
  DevOpsDeployment: mongoose.model('DevOpsDeployment', DevOpsDeploymentSchema),
  AIModel: mongoose.model('AIModel', AIModelSchema),
  ModelRoutingRule: mongoose.model('ModelRoutingRule', ModelRoutingRuleSchema),
  DataPipeline: mongoose.model('DataPipeline', DataPipelineSchema),
  PipelineRun: mongoose.model('PipelineRun', PipelineRunSchema),
  HardwareProject: mongoose.model('HardwareProject', HardwareProjectSchema),
  SimulationJob: mongoose.model('SimulationJob', SimulationJobSchema),
  QuantumCircuit: mongoose.model('QuantumCircuit', QuantumCircuitSchema),
  QPUJob: mongoose.model('QPUJob', QPUJobSchema),
  ChipDesign: mongoose.model('ChipDesign', ChipDesignSchema),
  SOCAlert: mongoose.model('SOCAlert', SOCAlertSchema),
  ThreatIntelReport: mongoose.model('ThreatIntelReport', ThreatIntelReportSchema),
  TrustIdentity: mongoose.model('TrustIdentity', TrustIdentitySchema)
};
