/**
 * FeatureFlagEngine — v74.0.0 Feature Flag Engine
 *
 * Dynamic feature flags for agent workflows: gradual rollouts,
 * percentage-based targeting, kill switches, A/B experiment cohorts,
 * and environment-scoped overrides.
 */

export type FlagStatus = 'ENABLED' | 'DISABLED' | 'ROLLOUT' | 'EXPERIMENT';

export interface FeatureFlag {
  flagId: string;
  name: string;
  description: string;
  status: FlagStatus;
  rolloutPercentage: number;      // 0–100
  targetAgents: string[];         // specific agent IDs, empty = all
  targetEnvironments: string[];   // e.g. ['staging', 'production']
  variants: FlagVariant[];
  killSwitch: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FlagVariant {
  variantId: string;
  name: string;
  weight: number;                 // 0–100
  payload: Record<string, unknown>;
}

export interface FlagEvaluation {
  flagId: string;
  agentId: string;
  environment: string;
  enabled: boolean;
  variant?: FlagVariant;
  reason: string;
}

export interface FlagAuditEntry {
  timestamp: string;
  flagId: string;
  action: 'CREATED' | 'UPDATED' | 'TOGGLED' | 'KILLED' | 'EVALUATED';
  actor: string;
  details: string;
}

export class FeatureFlagEngine {
  private flags: Map<string, FeatureFlag> = new Map();
  private auditLog: FlagAuditEntry[] = [];

  /**
   * Create a new feature flag.
   */
  public createFlag(
    name: string,
    description: string,
    options: Partial<Pick<FeatureFlag, 'status' | 'rolloutPercentage' | 'targetAgents' | 'targetEnvironments' | 'variants'>> = {}
  ): FeatureFlag {
    const flagId = `flag-${name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;
    const now = new Date().toISOString();

    const flag: FeatureFlag = {
      flagId,
      name,
      description,
      status: options.status ?? 'DISABLED',
      rolloutPercentage: options.rolloutPercentage ?? 0,
      targetAgents: options.targetAgents ?? [],
      targetEnvironments: options.targetEnvironments ?? [],
      variants: options.variants ?? [],
      killSwitch: false,
      createdAt: now,
      updatedAt: now,
    };

    this.flags.set(flagId, flag);
    this.audit(flagId, 'CREATED', 'system', `Flag "${name}" created`);
    return flag;
  }

  /**
   * Evaluate whether a flag is enabled for a given agent and environment.
   */
  public evaluate(flagId: string, agentId: string, environment: string = 'production'): FlagEvaluation {
    const flag = this.flags.get(flagId);
    if (!flag) {
      return { flagId, agentId, environment, enabled: false, reason: 'FLAG_NOT_FOUND' };
    }

    // Kill switch overrides everything
    if (flag.killSwitch) {
      this.audit(flagId, 'EVALUATED', agentId, 'Kill switch active — disabled');
      return { flagId, agentId, environment, enabled: false, reason: 'KILL_SWITCH' };
    }

    // Check environment targeting
    if (flag.targetEnvironments.length > 0 && !flag.targetEnvironments.includes(environment)) {
      return { flagId, agentId, environment, enabled: false, reason: 'ENVIRONMENT_EXCLUDED' };
    }

    // Check agent targeting
    if (flag.targetAgents.length > 0 && !flag.targetAgents.includes(agentId)) {
      return { flagId, agentId, environment, enabled: false, reason: 'AGENT_EXCLUDED' };
    }

    if (flag.status === 'DISABLED') {
      return { flagId, agentId, environment, enabled: false, reason: 'FLAG_DISABLED' };
    }

    if (flag.status === 'ENABLED') {
      const variant = this.selectVariant(flag, agentId);
      return { flagId, agentId, environment, enabled: true, variant, reason: 'FLAG_ENABLED' };
    }

    if (flag.status === 'ROLLOUT') {
      const hash = this.hashAgent(agentId, flagId);
      const inRollout = hash < flag.rolloutPercentage;
      const variant = inRollout ? this.selectVariant(flag, agentId) : undefined;
      return {
        flagId, agentId, environment,
        enabled: inRollout,
        variant,
        reason: inRollout ? 'ROLLOUT_INCLUDED' : 'ROLLOUT_EXCLUDED',
      };
    }

    if (flag.status === 'EXPERIMENT') {
      const variant = this.selectVariant(flag, agentId);
      return { flagId, agentId, environment, enabled: true, variant, reason: 'EXPERIMENT_COHORT' };
    }

    return { flagId, agentId, environment, enabled: false, reason: 'UNKNOWN_STATUS' };
  }

  /**
   * Toggle a flag's status.
   */
  public toggleFlag(flagId: string, status: FlagStatus): FeatureFlag {
    const flag = this.flags.get(flagId);
    if (!flag) throw new Error(`Flag not found: ${flagId}`);

    flag.status = status;
    flag.updatedAt = new Date().toISOString();
    this.audit(flagId, 'TOGGLED', 'system', `Status changed to ${status}`);
    return flag;
  }

  /**
   * Activate the kill switch for a flag.
   */
  public killFlag(flagId: string): FeatureFlag {
    const flag = this.flags.get(flagId);
    if (!flag) throw new Error(`Flag not found: ${flagId}`);

    flag.killSwitch = true;
    flag.updatedAt = new Date().toISOString();
    this.audit(flagId, 'KILLED', 'system', 'Kill switch activated');
    return flag;
  }

  /**
   * Update rollout percentage for a flag.
   */
  public setRolloutPercentage(flagId: string, percentage: number): FeatureFlag {
    const flag = this.flags.get(flagId);
    if (!flag) throw new Error(`Flag not found: ${flagId}`);

    flag.rolloutPercentage = Math.max(0, Math.min(100, percentage));
    flag.updatedAt = new Date().toISOString();
    this.audit(flagId, 'UPDATED', 'system', `Rollout set to ${flag.rolloutPercentage}%`);
    return flag;
  }

  /**
   * Get all registered flags.
   */
  public getFlags(): FeatureFlag[] {
    return Array.from(this.flags.values());
  }

  /**
   * Get a specific flag by ID.
   */
  public getFlag(flagId: string): FeatureFlag | undefined {
    return this.flags.get(flagId);
  }

  /**
   * Get the audit log.
   */
  public getAuditLog(): FlagAuditEntry[] {
    return [...this.auditLog];
  }

  private selectVariant(flag: FeatureFlag, agentId: string): FlagVariant | undefined {
    if (flag.variants.length === 0) return undefined;
    if (flag.variants.length === 1) return flag.variants[0];

    const hash = this.hashAgent(agentId, flag.flagId + '-variant');
    let cumulative = 0;
    for (const variant of flag.variants) {
      cumulative += variant.weight;
      if (hash < cumulative) return variant;
    }
    return flag.variants[flag.variants.length - 1];
  }

  private hashAgent(agentId: string, salt: string): number {
    let hash = 0;
    const combined = agentId + salt;
    for (let i = 0; i < combined.length; i++) {
      hash = ((hash << 5) - hash + combined.charCodeAt(i)) | 0;
    }
    return Math.abs(hash) % 100;
  }

  private audit(flagId: string, action: FlagAuditEntry['action'], actor: string, details: string): void {
    this.auditLog.push({
      timestamp: new Date().toISOString(),
      flagId,
      action,
      actor,
      details,
    });
  }
}
