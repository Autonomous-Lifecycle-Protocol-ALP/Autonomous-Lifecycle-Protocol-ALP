import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { createHydraServer } from "../src/server";
import type { Application } from "express";

let app: Application;

beforeAll(() => {
  app = createHydraServer({ startScheduler: false });
});

describe("API Server — Health & Info", () => {
  it("GET /api/hydra/health returns healthy status", async () => {
    const res = await request(app).get("/api/hydra/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("healthy");
    expect(res.body.version).toBe("1.0.0");
  });
});

describe("API Server — Agents", () => {
  it("GET /api/hydra/agents returns all 14 personas", async () => {
    const res = await request(app).get("/api/hydra/agents");
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(14);
    expect(res.body.map((p: { id: string }) => p.id)).toContain("engineer");
    expect(res.body.map((p: { id: string }) => p.id)).toContain("security");
  });

  it("GET /api/hydra/agents/:id returns a specific persona", async () => {
    const res = await request(app).get("/api/hydra/agents/engineer");
    expect(res.status).toBe(200);
    expect(res.body.id).toBe("engineer");
    expect(res.body.name).toBe("Engineer Agent");
  });

  it("GET /api/hydra/agents/:id returns 404 for unknown agent", async () => {
    const res = await request(app).get("/api/hydra/agents/nonexistent");
    expect(res.status).toBe(404);
  });
});

describe("API Server — Tasks", () => {
  it("POST /api/hydra/tasks creates a task", async () => {
    const res = await request(app).post("/api/hydra/tasks").send({
      goal: "build a feature",
      product: "alp-platform",
      organizationId: "org-1",
      userId: "user-1",
      agentId: "engineer",
    });
    expect(res.status).toBe(201);
    expect(res.body.goal).toBe("build a feature");
    expect(res.body.status).toBe("pending");
    expect(res.body.id).toBeDefined();
  });

  it("POST /api/hydra/tasks/run executes the task", async () => {
    const createRes = await request(app).post("/api/hydra/tasks").send({
      goal: "scan code",
      product: "alp-platform",
      organizationId: "org-1",
      userId: "user-1",
      agentId: "engineer",
    });

    const runRes = await request(app).post(`/api/hydra/tasks/${createRes.body.id}/run`);
    expect(runRes.status).toBe(200);
    expect(runRes.body.status).toBe("completed");
    expect(runRes.body.steps.length).toBeGreaterThanOrEqual(3);
  });

  it("GET /api/hydra/tasks/:id returns task status", async () => {
    const createRes = await request(app).post("/api/hydra/tasks").send({
      goal: "review code",
      product: "alp-platform",
      organizationId: "org-1",
      userId: "user-1",
      agentId: "engineer",
    });

    const getRes = await request(app).get(`/api/hydra/tasks/${createRes.body.id}`);
    expect(getRes.status).toBe(200);
    expect(getRes.body.id).toBe(createRes.body.id);
  });

  it("GET /api/hydra/tasks/:id returns 404 for unknown task", async () => {
    const res = await request(app).get("/api/hydra/tasks/nonexistent");
    expect(res.status).toBe(404);
  });
});

describe("API Server — Runs", () => {
  it("GET /api/hydra/runs/:id returns 404 for unknown run", async () => {
    const res = await request(app).get("/api/hydra/runs/nonexistent");
    expect(res.status).toBe(404);
  });
});

describe("API Server — Models", () => {
  it("POST /api/hydra/models/select returns a model selection", async () => {
    const res = await request(app).post("/api/hydra/models/select").send({
      taskType: "coding",
      contextSize: 4000,
    });
    expect(res.status).toBe(200);
    expect(res.body.provider).toBeDefined();
    expect(res.body.model).toBeDefined();
    expect(res.body.reason).toBeDefined();
  });
});

describe("API Server — Memory", () => {
  it("POST /api/hydra/memory stores an entry", async () => {
    const res = await request(app).post("/api/hydra/memory").send({
      type: "project",
      key: "decision-1",
      value: "Use PostgreSQL",
      importance: "high",
      scope: "org-1",
    });
    expect(res.status).toBe(201);
    expect(res.body.value).toBe("Use PostgreSQL");
    expect(res.body.id).toBeDefined();
  });

  it("GET /api/hydra/memory queries entries by scope", async () => {
    await request(app).post("/api/hydra/memory").send({
      type: "project",
      key: "d1",
      value: "v1",
      importance: "high",
      scope: "org-1",
    });

    const res = await request(app).get("/api/hydra/memory").query({ scope: "org-1" });
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0].scope).toBe("org-1");
  });
});

describe("API Server — Security", () => {
  it("POST /api/hydra/security/check returns granted=true for matching capability", async () => {
    const res = await request(app).post("/api/hydra/security/check").send({
      context: {
        userId: "user-1",
        organizationId: "org-1",
        capabilities: [{ action: "read", scope: "/projects/*" }],
      },
      action: "read",
      scope: "/projects/alpha",
    });
    expect(res.status).toBe(200);
    expect(res.body.granted).toBe(true);
  });

  it("POST /api/hydra/security/check returns granted=false for non-matching capability", async () => {
    const res = await request(app).post("/api/hydra/security/check").send({
      context: {
        userId: "user-1",
        organizationId: "org-1",
        capabilities: [{ action: "read", scope: "/projects/*" }],
      },
      action: "write",
      scope: "/projects/alpha",
    });
    expect(res.status).toBe(200);
    expect(res.body.granted).toBe(false);
  });
});

describe("API Server — Projects", () => {
  it("POST /api/hydra/projects/:id/graph registers a project with nodes", async () => {
    const res = await request(app).post("/api/hydra/projects/proj-1/graph").send({
      nodes: ["A", "B", "C"],
    });
    expect(res.status).toBe(201);
    expect(res.body.projectId).toBe("proj-1");
    expect(res.body.graph.nodes.length).toBeGreaterThanOrEqual(3);
  });

  it("POST /api/hydra/projects/:id/dependencies adds a dependency", async () => {
    await request(app).post("/api/hydra/projects/proj-2/graph").send({
      nodes: [],
    });

    const res = await request(app).post("/api/hydra/projects/proj-2/dependencies").send({
      source: "A",
      target: "B",
      type: "imports",
    });
    expect(res.status).toBe(201);
    expect(res.body.registered).toBe(true);
  });

  it("GET /api/hydra/projects/:id/dependencies/affected returns affected nodes", async () => {
    await request(app).post("/api/hydra/projects/proj-3/graph").send({ nodes: [] });
    await request(app).post("/api/hydra/projects/proj-3/dependencies").send({
      source: "A",
      target: "B",
      type: "imports",
    });
    await request(app).post("/api/hydra/projects/proj-3/dependencies").send({
      source: "B",
      target: "C",
      type: "imports",
    });

    const res = await request(app).get("/api/hydra/projects/proj-3/dependencies/affected").query({ changedNode: "A" });
    expect(res.status).toBe(200);
    expect(res.body.affected).toContain("B");
    expect(res.body.affected).toContain("C");
  });
});

describe("API Server — Organizations", () => {
  it("POST /api/hydra/organizations creates an organization", async () => {
    const res = await request(app).post("/api/hydra/organizations").send({
      name: "Acme Corp",
      plan: "pro",
    });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe("Acme Corp");
    expect(res.body.plan).toBe("pro");
  });

  it("POST /api/hydra/organizations/:id/teams creates a team", async () => {
    const orgRes = await request(app).post("/api/hydra/organizations").send({
      name: "Beta Inc",
      plan: "enterprise",
    });

    const res = await request(app).post(`/api/hydra/organizations/${orgRes.body.id}/teams`).send({
      name: "Backend",
    });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe("Backend");
    expect(res.body.organizationId).toBe(orgRes.body.id);
  });

  it("POST /api/hydra/organizations/:id/users adds a user", async () => {
    const orgRes = await request(app).post("/api/hydra/organizations").send({
      name: "Gamma LLC",
      plan: "pro",
    });

    const res = await request(app).post(`/api/hydra/organizations/${orgRes.body.id}/users`).send({
      email: "alice@gamma.com",
      name: "Alice",
      role: "admin",
    });
    expect(res.status).toBe(201);
    expect(res.body.email).toBe("alice@gamma.com");
    expect(res.body.role).toBe("admin");
  });
});

describe("API Server — Products", () => {
  it("GET /api/hydra/products lists all products", async () => {
    const res = await request(app).get("/api/hydra/products");
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(24);
  });

  it("GET /api/hydra/products/:id/agents returns personas for a product", async () => {
    const res = await request(app).get("/api/hydra/products/security-scanner/agents");
    expect(res.status).toBe(200);
    const personaIds = res.body.map((p: { id: string }) => p.id);
    expect(personaIds).toContain("security");
    expect(personaIds).toContain("engineer");
  });

  it("GET /api/hydra/products/:id/agents returns 404 for unknown product", async () => {
    const res = await request(app).get("/api/hydra/products/nonexistent/agents");
    expect(res.status).toBe(404);
  });
});

describe("API Server — Verification", () => {
  it("POST /api/hydra/verification/check runs a quality gate check", async () => {
    const res = await request(app).post("/api/hydra/verification/check").send({
      gateId: "coverage-check",
      input: { score: 90 },
    });
    expect(res.status).toBe(200);
    expect(res.body.passed).toBe(false);
    expect(res.body.details).toContain("not found");
  });
});

describe("API Server — Tools", () => {
  it("GET /api/hydra/tools returns all registered tools", async () => {
    const res = await request(app).get("/api/hydra/tools");
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(50);
    const toolIds = res.body.map((t: { id: string }) => t.id);
    expect(toolIds).toContain("sast-scanner");
    expect(toolIds).toContain("coding-typescript");
    expect(toolIds).toContain("qpu-orchestrator");
    expect(toolIds).toContain("siem");
  });

  it("GET /api/hydra/tools/:id returns a specific tool", async () => {
    const res = await request(app).get("/api/hydra/tools/sast-scanner");
    expect(res.status).toBe(200);
    expect(res.body.id).toBe("sast-scanner");
    expect(res.body.name).toBe("SAST Scanner");
    expect(res.body.category).toBe("security");
    expect(res.body.requiredCapabilities).toContain("security:scan");
  });

  it("GET /api/hydra/tools/:id returns 404 for unknown tool", async () => {
    const res = await request(app).get("/api/hydra/tools/nonexistent-tool");
    expect(res.status).toBe(404);
  });

  it("POST /api/hydra/tools/:id/execute runs the tool", async () => {
    const res = await request(app).post("/api/hydra/tools/testing-unit/execute").send({
      path: "./src",
      framework: "vitest",
    });
    expect(res.status).toBe(200);
    expect(res.body.passed).toBe(42);
  });

  it("POST /api/hydra/tools/:id/execute returns 404 for unknown tool", async () => {
    const res = await request(app).post("/api/hydra/tools/nonexistent-tool/execute").send({});
    expect(res.status).toBe(404);
  });
});

describe("API Server — Product Workflows", () => {
  it("GET /api/hydra/workflows lists all product workflows", async () => {
    const res = await request(app).get("/api/hydra/workflows");
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(10);
    const productIds = res.body.map((w: { productId: string }) => w.productId);
    expect(productIds).toContain("security-scanner");
    expect(productIds).toContain("soc-sentinel");
    expect(productIds).toContain("chip-design");
    expect(productIds).toContain("code-review");
    expect(productIds).toContain("api-designer");
  });

  it("GET /api/hydra/workflows/:productId returns workflow details", async () => {
    const res = await request(app).get("/api/hydra/workflows/security-scanner");
    expect(res.status).toBe(200);
    expect(res.body.productId).toBe("security-scanner");
    expect(res.body.steps.length).toBe(8);
    expect(res.body.primaryAgentId).toBe("security");
    expect(res.body.qualityGateIds).toContain("security-scan-complete");
  });

  it("GET /api/hydra/workflows/:productId returns 404 for unknown product", async () => {
    const res = await request(app).get("/api/hydra/workflows/nonexistent");
    expect(res.status).toBe(404);
  });

  it("POST /api/hydra/workflows/:productId/execute runs the workflow", async () => {
    const res = await request(app).post("/api/hydra/workflows/security-scanner/execute").send({
      path: "/src",
    });
    expect(res.status).toBe(200);
    expect(res.body.productId).toBe("security-scanner");
    expect(res.body.executed.length).toBe(8);
    expect(res.body.executed[0].toolId).toBe("sast-scanner");
    expect(res.body.executed[0].result.findings).toBeDefined();
  });
});
