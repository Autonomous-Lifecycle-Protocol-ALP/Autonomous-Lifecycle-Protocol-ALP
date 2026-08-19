import { v4 as uuidv4 } from "uuid";

export interface ResourceLimits {
  maxRamMB?: number;
  maxCpuPercent?: number;
  maxDiskMB?: number;
  timeoutSeconds?: number;
  maxNetworkMbps?: number;
}

export interface NetworkPolicy {
  allowEgress: boolean;
  allowIngress: boolean;
  allowedHosts: string[];
  allowedPorts: number[];
  denyAll: boolean;
}

export interface SandboxConfig {
  id?: string;
  organizationId: string;
  agentId?: string;
  resourceLimits: ResourceLimits;
  networkPolicy: NetworkPolicy;
  ephemeral: boolean;
}

export interface Sandbox {
  id: string;
  organizationId: string;
  agentId?: string;
  status: "creating" | "running" | "paused" | "destroyed" | "error";
  resourceLimits: ResourceLimits;
  networkPolicy: NetworkPolicy;
  ephemeral: boolean;
  createdAt: string;
  startedAt?: string;
  destroyedAt?: string;
  metadata?: Record<string, unknown>;
}

export class SandboxManager {
  private sandboxes: Map<string, Sandbox> = new Map();
  private resourceUsage: Map<string, { ramMB: number; cpuPercent: number; diskMB: number }> = new Map();

  async create(config: SandboxConfig): Promise<Sandbox> {
    const sandbox: Sandbox = {
      id: config.id ?? uuidv4(),
      organizationId: config.organizationId,
      agentId: config.agentId,
      status: "creating",
      resourceLimits: config.resourceLimits,
      networkPolicy: config.networkPolicy,
      ephemeral: config.ephemeral,
      createdAt: new Date().toISOString(),
      metadata: {},
    };

    this.sandboxes.set(sandbox.id, sandbox);
    this.resourceUsage.set(sandbox.id, { ramMB: 0, cpuPercent: 0, diskMB: 0 });

    sandbox.status = "running";
    sandbox.startedAt = new Date().toISOString();

    return sandbox;
  }

  async destroy(id: string): Promise<boolean> {
    const sandbox = this.sandboxes.get(id);
    if (!sandbox) return false;

    sandbox.status = "destroyed";
    sandbox.destroyedAt = new Date().toISOString();
    this.resourceUsage.delete(id);

    return true;
  }

  get(id: string): Sandbox | undefined {
    return this.sandboxes.get(id);
  }

  list(organizationId?: string): Sandbox[] {
    let results = Array.from(this.sandboxes.values());
    if (organizationId) {
      results = results.filter((s) => s.organizationId === organizationId);
    }
    return results.filter((s) => s.status !== "destroyed");
  }

  async pause(id: string): Promise<boolean> {
    const sandbox = this.sandboxes.get(id);
    if (!sandbox || sandbox.status !== "running") return false;
    sandbox.status = "paused";
    return true;
  }

  async resume(id: string): Promise<boolean> {
    const sandbox = this.sandboxes.get(id);
    if (!sandbox || sandbox.status !== "paused") return false;
    sandbox.status = "running";
    return true;
  }

  checkResources(id: string): { allowed: boolean; violations: string[] } {
    const sandbox = this.sandboxes.get(id);
    if (!sandbox) return { allowed: false, violations: ["Sandbox not found"] };

    const usage = this.resourceUsage.get(id);
    if (!usage) return { allowed: true, violations: [] };

    const violations: string[] = [];
    const limits = sandbox.resourceLimits;

    if (limits.maxRamMB && usage.ramMB > limits.maxRamMB) {
      violations.push(`RAM ${usage.ramMB}MB exceeds limit ${limits.maxRamMB}MB`);
    }
    if (limits.maxCpuPercent && usage.cpuPercent > limits.maxCpuPercent) {
      violations.push(`CPU ${usage.cpuPercent}% exceeds limit ${limits.maxCpuPercent}%`);
    }
    if (limits.maxDiskMB && usage.diskMB > limits.maxDiskMB) {
      violations.push(`Disk ${usage.diskMB}MB exceeds limit ${limits.maxDiskMB}MB`);
    }

    return { allowed: violations.length === 0, violations };
  }

  updateResourceUsage(id: string, usage: { ramMB?: number; cpuPercent?: number; diskMB?: number }): void {
    const current = this.resourceUsage.get(id);
    if (!current) return;
    if (usage.ramMB !== undefined) current.ramMB = usage.ramMB;
    if (usage.cpuPercent !== undefined) current.cpuPercent = usage.cpuPercent;
    if (usage.diskMB !== undefined) current.diskMB = usage.diskMB;
  }

  checkNetworkAccess(id: string, host: string, port: number): boolean {
    const sandbox = this.sandboxes.get(id);
    if (!sandbox) return false;

    if (sandbox.networkPolicy.denyAll) return false;

    if (!sandbox.networkPolicy.allowEgress) return false;

    const hostAllowed =
      sandbox.networkPolicy.allowedHosts.length === 0 ||
      sandbox.networkPolicy.allowedHosts.includes(host);

    const portAllowed =
      sandbox.networkPolicy.allowedPorts.length === 0 ||
      sandbox.networkPolicy.allowedPorts.includes(port);

    return hostAllowed && portAllowed;
  }
}
