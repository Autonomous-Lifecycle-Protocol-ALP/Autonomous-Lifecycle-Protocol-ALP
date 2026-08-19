import { v4 as uuidv4 } from "uuid";

export interface KillSwitchConfig {
  autoReset?: boolean;
  resetDelaySeconds?: number;
  organizations?: string[];
  agents?: string[];
}

export interface KillSwitchEvent {
  id: string;
  activatedAt: string;
  reason: string;
  scope: "all" | "organization" | "agent" | "task";
  targetId?: string;
  metadata?: Record<string, unknown>;
}

export interface ActiveKill {
  id: string;
  activatedAt: string;
  reason: string;
  scope: "all" | "organization" | "agent" | "task";
  targetId?: string;
  metadata?: Record<string, unknown>;
}

export class KillSwitch {
  private activeKills: Map<string, ActiveKill> = new Map();
  private readonly config: KillSwitchConfig;
  private readonly _history: KillSwitchEvent[] = [];

  constructor(config: KillSwitchConfig = {}) {
    this.config = {
      autoReset: config.autoReset ?? false,
      resetDelaySeconds: config.resetDelaySeconds ?? 300,
      organizations: config.organizations,
      agents: config.agents,
    };
  }

  activate(
    reason: string,
    scope: "all" | "organization" | "agent" | "task",
    targetId?: string,
    metadata?: Record<string, unknown>,
  ): KillSwitchEvent {
    const id = uuidv4();
    const now = new Date().toISOString();
    const event: KillSwitchEvent = { id, activatedAt: now, reason, scope, targetId, metadata };

    this.activeKills.set(id, { ...event });
    this._history.push(event);

    return event;
  }

  isActive(scope: "all" | "organization" | "agent" | "task", targetId?: string): boolean {
    for (const kill of this.activeKills.values()) {
      if (kill.scope === "all") return true;
      if (kill.scope === scope && (!kill.targetId || kill.targetId === targetId)) return true;
      if (kill.scope === "organization" && scope === "agent" && kill.targetId === targetId) return true;
    }
    return false;
  }

  isAllKillsActive(): boolean {
    return Array.from(this.activeKills.values()).some((k) => k.scope === "all");
  }

  isOrganizationKilled(organizationId: string): boolean {
    return this.isActive("organization", organizationId);
  }

  isAgentKilled(agentId: string): boolean {
    return this.isActive("agent", agentId);
  }

  isTaskKilled(taskId: string): boolean {
    return this.isActive("task", taskId);
  }

  deactivate(id: string): boolean {
    return this.activeKills.delete(id);
  }

  clearAll(): number {
    const count = this.activeKills.size;
    this.activeKills.clear();
    return count;
  }

  listActive(): ActiveKill[] {
    return Array.from(this.activeKills.values());
  }

  history(): KillSwitchEvent[] {
    return Array.from(this._history);
  }

  shouldBlock(scope: "all" | "organization" | "agent" | "task", targetId?: string): boolean {
    if (this.config.organizations && scope === "organization" && targetId) {
      if (!this.config.organizations.includes(targetId)) return false;
    }
    if (this.config.agents && scope === "agent" && targetId) {
      if (!this.config.agents.includes(targetId)) return false;
    }
    return this.isActive(scope, targetId);
  }
}

export const emergencyKillSwitch = new KillSwitch({ autoReset: false });
