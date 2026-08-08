import api from "./api.js";

export const cloudApi = {
  list: () => api.get("/cloud/workspaces"),
  create: (data) => api.post("/cloud/workspaces", data),
};

export const agentStudioApi = {
  list: () => api.get("/agent-studio/workflows"),
  create: (data) => api.post("/agent-studio/workflows", data),
  simulate: (id) => api.post(`/agent-studio/workflows/${id}/simulate`),
};

export const securityApi = {
  listScans: () => api.get("/security/scans"),
  createScan: (data) => api.post("/security/scans", data),
  runScan: (id) => api.post(`/security/scans/${id}/run`),
};

export const mobileApi = {
  listSessions: () => api.get("/mobile/sessions"),
  createSession: (data) => api.post("/mobile/sessions", data),
  listNotifications: () => api.get("/mobile/notifications"),
};

export const analyticsBiApi = {
  listDashboards: () => api.get("/analytics-bi/dashboards"),
  createDashboard: (data) => api.post("/analytics-bi/dashboards", data),
  listReports: () => api.get("/analytics-bi/reports"),
  createReport: (data) => api.post("/analytics-bi/reports", data),
};

export const devOpsApi = {
  listPipelines: () => api.get("/devops/pipelines"),
  listDeployments: () => api.get("/devops/deployments"),
  createPipeline: (data) => api.post("/devops/pipelines", data),
  deploy: (id, data) => api.post(`/devops/pipelines/${id}/deploy`, data),
};

export const modelHubApi = {
  listModels: () => api.get("/model-hub/models"),
  createModel: (data) => api.post("/model-hub/models", data),
};

export const dataPipelineApi = {
  listPipelines: () => api.get("/data-pipeline/pipelines"),
  createPipeline: (data) => api.post("/data-pipeline/pipelines", data),
  listRuns: () => api.get("/data-pipeline/runs"),
};

export const hybridEngineerApi = {
  listProjects: () => api.get("/hybrid-engineer/projects"),
  createProject: (data) => api.post("/hybrid-engineer/projects", data),
  listSimulations: () => api.get("/hybrid-engineer/simulations"),
};

export const quantumEngineerApi = {
  listCircuits: () => api.get("/quantum-engineer/circuits"),
  createCircuit: (data) => api.post("/quantum-engineer/circuits", data),
  listJobs: () => api.get("/quantum-engineer/jobs"),
};

export const chipDesignApi = {
  listDesigns: () => api.get("/chip-design/designs"),
  createDesign: (data) => api.post("/chip-design/designs", data),
};

export const socSentinelApi = {
  listAlerts: () => api.get("/soc-sentinel/alerts"),
  createAlert: (data) => api.post("/soc-sentinel/alerts", data),
};

export const threatIntelApi = {
  listReports: () => api.get("/threat-intel/reports"),
  createReport: (data) => api.post("/threat-intel/reports", data),
};

export const zeroTrustApi = {
  listIdentities: () => api.get("/zero-trust/identities"),
  createIdentity: (data) => api.post("/zero-trust/identities", data),
};
