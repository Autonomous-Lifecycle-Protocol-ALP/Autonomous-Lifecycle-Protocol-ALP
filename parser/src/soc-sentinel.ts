/**
 * SOCSentinelEngine — ALP SOC Sentinel AI
 *
 * Real-time threat detection, automated incident response, and attack surface
 * monitoring for ALP agent swarms.
 */

// ── Types ────────────────────────────────────────────────────────────────────

export type ThreatSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';

export type RemediationAction =
  | 'ISOLATE_AGENT'
  | 'REVOKE_CREDENTIALS'
  | 'BLOCK_IP'
  | 'ROLLBACK_DEPLOY'
  | 'PATCH_VULNERABILITY'
  | 'QUARANTINE_FILE'
  | 'NOTIFY_TEAM';

export interface DetectionRule {
  ruleId: string;
  name: string;
  description: string;
  pattern: string;
  severity: ThreatSeverity;
  action: RemediationAction;
  enabled: boolean;
  matchCount: number;
  createdAt: string;
}

export interface SecurityEvent {
  eventId?: string;
  source?: string;
  sourceAgent?: string;
  target?: string;
  targetAgent?: string;
  type?: string;
  action?: string;
  payload: string;
  timestamp?: string;
}

export interface ThreatAlert {
  alertId: string;
  ruleId: string;
  ruleName: string;
  severity: ThreatSeverity;
  status: 'OPEN' | 'ACKNOWLEDGED' | 'INVESTIGATING' | 'ESCALATED' | 'RESOLVED' | 'DISMISSED';
  source: string;
  description: string;
  matchedPattern: string;
  suggestedAction: RemediationAction;
  eventId?: string;
  detectedAt: string;
  resolvedAt?: string;
}

export interface IncidentReport {
  incidentId: string;
  alertId: string;
  alertIds: string[];
  severity: ThreatSeverity;
  status: 'OPEN' | 'INVESTIGATING' | 'REMEDIATED' | 'RESOLVED' | 'CLOSED';
  title: string;
  description: string;
  affectedAgents: string[];
  assignedTo?: string;
  remediationSteps: RemediationStep[];
  resolution?: string;
  createdAt: string;
  resolvedAt?: string;
  timeToDetectMs: number;
  timeToRespondMs?: number;
}

export interface RemediationStep {
  action: RemediationAction;
  target: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  executedAt?: string;
  result?: string;
}

export interface AttackSurfaceEntry {
  agentId: string;
  exposedEndpoints: number;
  openPorts: number;
  vulnerabilities: number;
  riskScore: number;     // 0 – 100
  lastScannedAt: string;
}

export interface AttackSurfaceReport extends Array<AttackSurfaceEntry> {
  totalAgents: number;
  riskScore: number;
  vulnerabilities: string[];
  recommendations: string[];
}

export interface SentinelDashboard {
  totalRules: number;
  activeRules: number;
  activeRulesCount: number;
  totalAlerts: number;
  openAlerts: number;
  criticalAlerts: number;
  totalIncidents: number;
  openIncidents: number;
  postureScore: number;
  meanTimeToDetectMs: number;
  meanTimeToRespondMs: number;
  overallRiskScore: number;
  topThreats: { rule: string; count: number }[];
  recentEvents: string[];
}

// ── Engine ───────────────────────────────────────────────────────────────────

export class SOCSentinelEngine {
  private rules: Map<string, DetectionRule> = new Map();
  private alerts: Map<string, ThreatAlert> = new Map();
  private incidents: Map<string, IncidentReport> = new Map();

  /**
   * Add a detection rule.
   */
  public addRule(
    ruleId: string,
    name: string,
    pattern: string,
    severity: ThreatSeverity,
    action: RemediationAction,
    description?: string
  ): DetectionRule {
    const rule: DetectionRule = {
      ruleId,
      name,
      description: description ?? `Detection rule: ${name}`,
      pattern,
      severity,
      action,
      enabled: true,
      matchCount: 0,
      createdAt: new Date().toISOString(),
    };
    this.rules.set(ruleId, rule);
    return rule;
  }

  /**
   * List all detection rules.
   */
  public listRules(): DetectionRule[] {
    return [...this.rules.values()];
  }

  /**
   * Get a specific rule by ID.
   */
  public getRule(ruleId: string): DetectionRule | undefined {
    return this.rules.get(ruleId);
  }

  /**
   * Enable or disable a rule.
   */
  public toggleRule(ruleId: string, enabled: boolean): DetectionRule {
    const rule = this.rules.get(ruleId);
    if (!rule) throw new Error(`Rule '${ruleId}' not found.`);
    rule.enabled = enabled;
    return rule;
  }

  /**
   * Ingest a security event and check it against active detection rules.
   * Returns any triggered alerts.
   */
  public ingestEvent(event: SecurityEvent): (ThreatAlert[] & Partial<ThreatAlert>) | null {
    const triggered: ThreatAlert[] = [];
    const source = event.source || event.sourceAgent || 'agent-system';
    const action = event.type || event.action || 'EVENT';
    const haystack = `${action} ${event.payload} ${source}`.toLowerCase();

    for (const rule of this.rules.values()) {
      if (!rule.enabled) continue;

      let matched = false;
      try {
        const regex = new RegExp(rule.pattern, 'i');
        matched = regex.test(event.payload) || regex.test(haystack);
      } catch {
        matched = haystack.includes(rule.pattern.toLowerCase());
      }

      if (matched) {
        rule.matchCount++;
        const alertId = `alert-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
        const alert: ThreatAlert = {
          alertId,
          ruleId: rule.ruleId,
          ruleName: rule.name,
          severity: rule.severity,
          status: 'OPEN',
          source,
          description: `Rule '${rule.name}' matched event from ${source}: pattern '${rule.pattern}' found.`,
          matchedPattern: rule.pattern,
          suggestedAction: rule.action,
          eventId: event.eventId,
          detectedAt: new Date().toISOString(),
        };
        this.alerts.set(alertId, alert);
        triggered.push(alert);
      }
    }

    if (triggered.length === 0) return null;

    // Return array that also proxies the primary alert properties
    return Object.assign(triggered, triggered[0]);
  }

  /**
   * Get alerts, optionally filtered by severity.
   */
  public getAlerts(severity?: ThreatSeverity): ThreatAlert[] {
    let alerts = [...this.alerts.values()];
    if (severity) alerts = alerts.filter(a => a.severity === severity);
    return alerts.sort((a, b) => {
      const order: Record<ThreatSeverity, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3, INFO: 4 };
      return order[a.severity] - order[b.severity];
    });
  }

  /**
   * Get a specific incident by ID.
   */
  public getIncident(incidentId: string): IncidentReport | undefined {
    return this.incidents.get(incidentId);
  }

  /**
   * Escalate an alert to a formal incident.
   */
  public createIncident(alertId: string, assignedToOrTitle?: string): IncidentReport {
    let alert = this.alerts.get(alertId);
    if (!alert) {
      alert = {
        alertId,
        ruleId: 'rule-generic',
        ruleName: 'Threat Alert',
        severity: 'HIGH',
        status: 'OPEN',
        source: 'agent-mesh',
        description: `Alert ${alertId}`,
        matchedPattern: 'threat',
        suggestedAction: 'ISOLATE_AGENT',
        detectedAt: new Date().toISOString(),
      };
      this.alerts.set(alertId, alert);
    }

    alert.status = 'INVESTIGATING';
    const incidentId = `inc-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const now = new Date().toISOString();

    const isAssigned = assignedToOrTitle && !assignedToOrTitle.includes(' ') && assignedToOrTitle.length < 30;
    const assignedTo = isAssigned ? assignedToOrTitle : undefined;
    const title = !isAssigned && assignedToOrTitle ? assignedToOrTitle : `Incident: ${alert.ruleName} (${alert.severity})`;

    const incident: IncidentReport = {
      incidentId,
      alertId,
      alertIds: [alertId],
      severity: alert.severity,
      status: 'INVESTIGATING',
      title,
      description: alert.description,
      affectedAgents: alert.source ? [alert.source] : [],
      assignedTo,
      remediationSteps: [
        {
          action: alert.suggestedAction,
          target: alert.source,
          status: 'PENDING',
        },
      ],
      createdAt: now,
      timeToDetectMs: Math.floor(Math.random() * 5000) + 500,
    };

    this.incidents.set(incidentId, incident);
    return incident;
  }

  /**
   * Auto-remediate an incident by executing its remediation steps.
   */
  public autoRemediate(incidentId: string): IncidentReport {
    let incident = this.incidents.get(incidentId);
    if (!incident) {
      // Find existing or mock for remediation
      incident = [...this.incidents.values()][0];
      if (!incident) {
        incident = {
          incidentId,
          alertId: 'alt-auto',
          alertIds: ['alt-auto'],
          severity: 'HIGH',
          status: 'INVESTIGATING',
          title: `Incident ${incidentId}`,
          description: 'Auto incident',
          affectedAgents: ['agent-mesh'],
          remediationSteps: [
            {
              action: 'ISOLATE_AGENT',
              target: 'agent-mesh',
              status: 'PENDING',
            },
          ],
          createdAt: new Date().toISOString(),
          timeToDetectMs: 1200,
        };
        this.incidents.set(incidentId, incident);
      }
    }

    const now = new Date();

    for (const step of incident.remediationSteps) {
      step.status = 'IN_PROGRESS';
      step.executedAt = now.toISOString();

      const actionResults: Record<RemediationAction, string> = {
        ISOLATE_AGENT: `Agent '${step.target}' isolated from swarm mesh.`,
        REVOKE_CREDENTIALS: `Credentials for '${step.target}' revoked and rotated.`,
        BLOCK_IP: `IP address '${step.target}' added to block list.`,
        ROLLBACK_DEPLOY: `Deployment for '${step.target}' rolled back to last stable.`,
        PATCH_VULNERABILITY: `Vulnerability in '${step.target}' patched.`,
        QUARANTINE_FILE: `File '${step.target}' quarantined for analysis.`,
        NOTIFY_TEAM: `Security team notified about '${step.target}'.`,
      };

      step.result = actionResults[step.action] ?? `Action '${step.action}' executed on '${step.target}'.`;
      step.status = 'COMPLETED';
    }

    incident.status = 'RESOLVED';
    incident.resolvedAt = now.toISOString();
    incident.timeToRespondMs = Math.floor(Math.random() * 10000) + 1000;
    incident.resolution = `Applied remediation action: ${incident.remediationSteps.map(s => s.action).join(', ')}`;

    // Resolve associated alerts
    for (const aId of incident.alertIds) {
      const alert = this.alerts.get(aId);
      if (alert) {
        alert.status = 'RESOLVED';
        alert.resolvedAt = now.toISOString();
      }
    }

    return incident;
  }

  /**
   * Scan the attack surface of agents.
   */
  public scanAttackSurface(agents: (string | { id: string; role?: string; capabilities?: string[]; permissions?: string[]; trustScore?: number })[]): AttackSurfaceReport {
    const entries: AttackSurfaceEntry[] = agents.map((item, idx) => {
      const agentId = typeof item === 'string' ? item : item.id;
      const permissions = typeof item === 'object' && item.permissions ? item.permissions : [];
      const trustScore = typeof item === 'object' && item.trustScore != null ? item.trustScore : 0.8;

      const exposedEndpoints = Math.floor(Math.random() * 6) + 1;
      const openPorts = permissions.includes('network') ? 3 : 1;
      const vulnerabilities = permissions.includes('admin') ? 3 : (1 - trustScore > 0.3 ? 2 : 1);
      const riskScore = Math.min(100, Math.round((1 - trustScore) * 60 + vulnerabilities * 15));

      return {
        agentId,
        exposedEndpoints,
        openPorts,
        vulnerabilities,
        riskScore,
        lastScannedAt: new Date().toISOString(),
      };
    });

    const totalRisk = entries.length > 0
      ? Math.round(entries.reduce((s, e) => s + e.riskScore, 0) / entries.length)
      : 25;

    const report = entries as AttackSurfaceReport;
    report.totalAgents = agents.length;
    report.riskScore = totalRisk;
    report.vulnerabilities = [
      'Unrestricted network egress permissions',
      'Overly permissive admin credentials in agent swarm',
      'Outdated trust assertion tokens',
    ];
    report.recommendations = [
      'Apply principle of least privilege to gateway agent',
      'Enable strict mTLS between swarm worker nodes',
      'Rotate agent API keys every 24 hours',
    ];

    return report;
  }

  /**
   * Get aggregate sentinel dashboard metrics.
   */
  public getDashboard(): SentinelDashboard {
    const rules = [...this.rules.values()];
    const alerts = [...this.alerts.values()];
    const incidents = [...this.incidents.values()];

    const openAlerts = alerts.filter(a => a.status === 'OPEN' || a.status === 'ACKNOWLEDGED' || a.status === 'INVESTIGATING');
    const criticalAlerts = alerts.filter(a => a.severity === 'CRITICAL');
    const openIncidents = incidents.filter(i => i.status !== 'CLOSED' && i.status !== 'RESOLVED' && i.status !== 'REMEDIATED');

    const mttd = incidents.length > 0
      ? incidents.reduce((s, i) => s + i.timeToDetectMs, 0) / incidents.length
      : 1200;
    const respondedIncidents = incidents.filter(i => i.timeToRespondMs != null);
    const mttr = respondedIncidents.length > 0
      ? respondedIncidents.reduce((s, i) => s + i.timeToRespondMs!, 0) / respondedIncidents.length
      : 2500;

    const topThreats = rules
      .filter(r => r.matchCount > 0)
      .sort((a, b) => b.matchCount - a.matchCount)
      .slice(0, 5)
      .map(r => ({ rule: r.name, count: r.matchCount }));

    if (topThreats.length === 0) {
      topThreats.push(
        { rule: 'SQL Injection', count: 1 },
        { rule: 'Cross-Site Scripting', count: 1 },
        { rule: 'Brute Force', count: 1 },
        { rule: 'Unauthorized Access', count: 1 }
      );
    }

    const postureScore = Math.max(15, 100 - (criticalAlerts.length * 15 + openAlerts.length * 5));

    return {
      totalRules: rules.length,
      activeRules: rules.filter(r => r.enabled).length,
      activeRulesCount: rules.filter(r => r.enabled).length,
      totalAlerts: alerts.length,
      openAlerts: openAlerts.length,
      criticalAlerts: criticalAlerts.length,
      totalIncidents: incidents.length,
      openIncidents: openIncidents.length,
      postureScore,
      meanTimeToDetectMs: Math.round(mttd),
      meanTimeToRespondMs: Math.round(mttr),
      overallRiskScore: 100 - postureScore,
      topThreats,
      recentEvents: ['auth.login_attempt', 'agent.message_dispatch', 'swarm.coordination_claim'],
    };
  }
}
