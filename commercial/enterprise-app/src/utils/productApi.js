import api from "./api.js";

export const cloudApi = {
  list: () => api.get("/cloud/workspaces"),
  create: (data) => api.post("/cloud/workspaces", data),
  get: (id) => api.get(`/cloud/workspaces/${id}`),
  createSnapshot: (id) => api.post(`/cloud/workspaces/${id}/snapshots`),
  listSnapshots: (id) => api.get(`/cloud/workspaces/${id}/snapshots`),
  rollbackSnapshot: (id, snapshotId) => api.post(`/cloud/workspaces/${id}/snapshots/${snapshotId}/rollback`),
  addMember: (id, email) => api.post(`/cloud/workspaces/${id}/members`, { email }),
};

export const agentStudioApi = {
  list: () => api.get("/agent-studio/workflows"),
  create: (data) => api.post("/agent-studio/workflows", data),
  get: (id) => api.get(`/agent-studio/workflows/${id}`),
  saveVersion: (id) => api.post(`/agent-studio/workflows/${id}/versions`),
  getVersion: (id, versionId) => api.get(`/agent-studio/workflows/${id}/versions/${versionId}`),
  simulate: (id) => api.post(`/agent-studio/workflows/${id}/simulate`),
};

export const securityApi = {
  listScans: () => api.get("/security/scans"),
  createScan: (data) => api.post("/security/scans", data),
  getScan: (id) => api.get(`/security/scans/${id}`),
  runScan: (id) => api.post(`/security/scans/${id}/run`),
  completeScan: (id, data) => api.post(`/security/scans/${id}/complete`, data),
  getCompliance: (framework) => api.get(`/security/compliance/${framework}`),
  createCompliance: (framework, data) => api.post(`/security/compliance/${framework}`, data),
};

export const mobileApi = {
  listSessions: () => api.get("/mobile/sessions"),
  createSession: (data) => api.post("/mobile/sessions", data),
  getSession: (id) => api.get(`/mobile/sessions/${id}`),
  sendPush: (id, data) => api.post(`/mobile/sessions/${id}/push`, data),
  listNotifications: () => api.get("/mobile/notifications"),
};

export const analyticsBiApi = {
  listDashboards: () => api.get("/analytics-bi/dashboards"),
  createDashboard: (data) => api.post("/analytics-bi/dashboards", data),
  getDashboard: (id) => api.get(`/analytics-bi/dashboards/${id}`),
  updateDashboard: (id, data) => api.put(`/analytics-bi/dashboards/${id}`, data),
  deleteDashboard: (id) => api.delete(`/analytics-bi/dashboards/${id}`),
  createReport: (data) => api.post("/analytics-bi/reports", data),
  listReports: () => api.get("/analytics-bi/reports"),
};

export const devOpsApi = {
  listPipelines: () => api.get("/devops/pipelines"),
  createPipeline: (data) => api.post("/devops/pipelines", data),
  getPipeline: (id) => api.get(`/devops/pipelines/${id}`),
  updatePipeline: (id, data) => api.put(`/devops/pipelines/${id}`, data),
  deletePipeline: (id) => api.delete(`/devops/pipelines/${id}`),
  deploy: (id, data) => api.post(`/devops/pipelines/${id}/deploy`, data),
  listDeployments: () => api.get("/devops/deployments"),
  rollbackDeployment: (id) => api.post(`/devops/deployments/${id}/rollback`),
};

export const modelHubApi = {
  listModels: () => api.get("/model-hub/models"),
  createModel: (data) => api.post("/model-hub/models", data),
  getModel: (id) => api.get(`/model-hub/models/${id}`),
  updateModel: (id, data) => api.put(`/model-hub/models/${id}`, data),
  createModelVersion: (id, data) => api.post(`/model-hub/models/${id}/versions`, data),
  listRoutingRules: () => api.get("/model-hub/routing-rules"),
  createRoutingRule: (data) => api.post("/model-hub/routing-rules", data),
};

export const dataPipelineApi = {
  listPipelines: () => api.get("/data-pipeline/pipelines"),
  createPipeline: (data) => api.post("/data-pipeline/pipelines", data),
  getPipeline: (id) => api.get(`/data-pipeline/pipelines/${id}`),
  updatePipeline: (id, data) => api.put(`/data-pipeline/pipelines/${id}`, data),
  deletePipeline: (id) => api.delete(`/data-pipeline/pipelines/${id}`),
  runPipeline: (id) => api.post(`/data-pipeline/pipelines/${id}/run`),
  listRuns: () => api.get("/data-pipeline/runs"),
};

export const hybridEngineerApi = {
  listProjects: () => api.get("/hybrid-engineer/projects"),
  createProject: (data) => api.post("/hybrid-engineer/projects", data),
  getProject: (id) => api.get(`/hybrid-engineer/projects/${id}`),
  updateProject: (id, data) => api.put(`/hybrid-engineer/projects/${id}`, data),
  runSimulation: (id, data) => api.post(`/hybrid-engineer/projects/${id}/simulate`, data),
  listSimulations: () => api.get("/hybrid-engineer/simulations"),
};

export const quantumEngineerApi = {
  listCircuits: () => api.get("/quantum-engineer/circuits"),
  createCircuit: (data) => api.post("/quantum-engineer/circuits", data),
  getCircuit: (id) => api.get(`/quantum-engineer/circuits/${id}`),
  updateCircuit: (id, data) => api.put(`/quantum-engineer/circuits/${id}`, data),
  submitCircuit: (id, data) => api.post(`/quantum-engineer/circuits/${id}/submit`, data),
  listJobs: () => api.get("/quantum-engineer/jobs"),
};

export const chipDesignApi = {
  listDesigns: () => api.get("/chip-design/designs"),
  createDesign: (data) => api.post("/chip-design/designs", data),
  getDesign: (id) => api.get(`/chip-design/designs/${id}`),
  updateDesign: (id, data) => api.put(`/chip-design/designs/${id}`, data),
  synthesize: (id, data) => api.post(`/chip-design/designs/${id}/synthesize`, data),
};

export const socSentinelApi = {
  listAlerts: () => api.get("/soc-sentinel/alerts"),
  createAlert: (data) => api.post("/soc-sentinel/alerts", data),
  getAlert: (id) => api.get(`/soc-sentinel/alerts/${id}`),
  updateAlert: (id, data) => api.put(`/soc-sentinel/alerts/${id}`, data),
  resolveAlert: (id) => api.post(`/soc-sentinel/alerts/${id}/resolve`),
};

export const threatIntelApi = {
  listReports: () => api.get("/threat-intel/reports"),
  createReport: (data) => api.post("/threat-intel/reports", data),
  getReport: (id) => api.get(`/threat-intel/reports/${id}`),
  updateReport: (id, data) => api.put(`/threat-intel/reports/${id}`, data),
  publishReport: (id) => api.post(`/threat-intel/reports/${id}/publish`),
};

export const zeroTrustApi = {
  listIdentities: () => api.get("/zero-trust/identities"),
  createIdentity: (data) => api.post("/zero-trust/identities", data),
  getIdentity: (id) => api.get(`/zero-trust/identities/${id}`),
  updateIdentity: (id, data) => api.put(`/zero-trust/identities/${id}`, data),
  authenticateIdentity: (id) => api.post(`/zero-trust/identities/${id}/authenticate`),
};
