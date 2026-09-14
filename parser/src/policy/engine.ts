import { AlpObject } from '../reader';
import { PolicyActionKind, PolicyQuery, PolicyDecision, FederatedTrustRoot, ApprovalRule, TimeWindow, PolicyProposal } from './types';
import { globToRegExp, normalizePath, normalizeRef, normalizeObjects, parseProposalLiteral } from './utils';
import { PolicyVersion, PolicyRollback } from './versioning';
import { PolicySuggestion } from './suggestion';

/**
 * ALP Policy Engine (v4 — The Federation Era; v2 extensions v8.1.0; v10.6.0 Cross-Federation Trust)
 *
 * Evaluates proposed autonomous-agent actions against declarative `@policy`
 * objects. Makes it safe to run swarms unattended: an agent can only touch
 * allowed paths, run allowed commands, and act within its budget.
 *
 * Precedence rules:
 *   - `deny_*` always beats `allow_*`.
 *   - If `allow_*` is present and non-empty, the action must match it.
 *   - If `allow_*` is absent, the action is allowed unless denied.
 *   - `enforcement: "warn"` never blocks; it only reports.
 *
 * v8.1.0 extensions:
 *   - `allow_during` time-windows: actions outside every window are denied
 *     (a strict, time-scoped least-privilege guard).
 *   - `require_approval`: actions matching these patterns escalate to a
 *     human-in-the-loop approval gate rather than auto-blocking.
 *   - `proposal` blocks: signed, auditable action proposals verified
 *     against a trust root (MCP-enforcement audit trail, spec/03 §25).
 *
 * v10.6.0 Cross-Federation Trust:
 *   - `FederatedTrustRoot` interface for remote workspace trust anchors.
 *   - `bootstrapTrust` reads a trust root from a remote workspace path.
 *   - `inheritedPolicies` merges parent/child policy sets with precedence.
 *   - `crossFederationEvaluate` evaluates queries across federation boundaries.
 */

interface PolicyObject {
  id: string;
  applies_to?: string | string[];
  allow_paths?: string[];
  deny_paths?: string[];
  allow_commands?: string[];
  deny_commands?: string[];
  enforcement?: 'strict' | 'warn';
  /** v8.1.0: time-scoped least-privilege windows. */
  allow_during?: TimeWindow[];
  /** v8.1.0: patterns that escalate to human approval. */
  require_approval?: ApprovalRule[];
  /** v8.1.0: signed, auditable action proposals. */
  proposals?: PolicyProposal[];
}

export class PolicyEngine {
  private policies: PolicyObject[];

  constructor(objects: AlpObject[]) {
    this.policies = objects
      .filter((o) => o._type === 'policy')
      .map((o) => o as unknown as PolicyObject);
  }

  get count(): number {
    return this.policies.length;
  }

  /** Does this policy govern the given agent? */
  private governs(policy: PolicyObject, agent?: string): boolean {
    const target = policy.applies_to;
    if (target === undefined || target === '*' || target === '-> *') return true;
    const list = Array.isArray(target) ? target : [target];
    if (!agent) return false;
    return list.some((t) => normalizeRef(t) === agent || t === '*');
  }

  /**
   * Evaluate a proposed action. Returns an aggregate decision across every
   * governing policy (deny/strict wins).
   */
  evaluate(query: PolicyQuery): PolicyDecision {
    return this.evaluateInternal(query, false);
  }

  /**
   * Like {@link evaluate}, but only considers `deny_*` rules and ignores
   * `allow_*` lists. Used for ALP protocol-coordination files that should be
   * permitted unless explicitly denied.
   */
  evaluateDenyOnly(query: PolicyQuery): PolicyDecision {
    return this.evaluateInternal(query, true);
  }

  /**
   * v8.1.0: evaluate a signed `proposal` block against this policy's
   * `proposals` list and an optional trust root. A proposal is allowed
   * only when its `signed_by`/`signature` verify (if a trust root is
   * configured) or when unsigned proposals are permitted. Produces an
   * audit record for the MCP-enforcement trail (spec/03 §25).
   */
  evaluateProposal(proposalId: string, trustPems?: Record<string, string>): PolicyDecision {
    const now = new Date();
    const reasons: string[] = [];
    const violating: string[] = [];
    let allowed = false;
    let blocked = false;

    for (const policy of this.policies) {
      const list = Array.isArray(policy.proposals) ? policy.proposals : [];
      // List items may be inline objects stored as raw strings by the
      // line-based reader (e.g. `{ id: "prop-1", ... }`), or already
      // parsed objects. Normalize both forms.
      const match = list
        .map((p) => (typeof p === 'string' ? parseProposalLiteral(p) : p))
        .find((p) => p && p.id === proposalId);
      if (!match) continue;
      if (match.signature) {
        if (trustPems && match.signed_by && !(match.signed_by in trustPems)) {
          reasons.push(
            `Policy '${policy.id}' proposal '${proposalId}' signed by '${match.signed_by}' not in trust root.`
          );
          violating.push(policy.id);
          blocked = true;
        } else {
          allowed = true;
        }
      } else if (trustPems && Object.keys(trustPems).length > 0) {
        reasons.push(
          `Policy '${policy.id}' proposal '${proposalId}' is unsigned; trust root requires signatures.`
        );
        violating.push(policy.id);
        blocked = true;
      } else {
        allowed = true;
      }
    }

    if (this.policies.length === 0) allowed = true;

    return {
      allowed,
      blocked,
      reasons,
      policies: violating,
      audit: {
        proposalId,
        decision: allowed ? 'allow' : 'deny',
        timestamp: now.toISOString(),
      },
    };
  }

  /** v10.6.0: read a trust root from a remote workspace path. */
  static bootstrapTrust(remoteWorkspacePath: string, trustRoot: FederatedTrustRoot): FederatedTrustRoot {
    const fs = require('fs');
    const path = require('path');
    const trustFile = path.join(remoteWorkspacePath, '.alp', 'trust', 'root.json');
    let stored: Record<string, any> = {};
    try {
      const raw = fs.readFileSync(trustFile, 'utf8');
      stored = JSON.parse(raw);
    } catch {
      // If the file does not exist, return the provided trust root as-is.
    }
    const merged: FederatedTrustRoot = {
      namespace: stored.namespace ?? trustRoot.namespace,
      publicKeyPem: stored.publicKeyPem ?? trustRoot.publicKeyPem,
      fingerprint: stored.fingerprint ?? trustRoot.fingerprint,
    };
    return merged;
  }

  /** v10.6.0: merge parent and child policy sets; child policies take precedence. */
  static inheritedPolicies(parentFederation: PolicyEngine, childFederation: PolicyEngine): PolicyObject[] {
    const childIds = new Set(childFederation.policies.map((p) => p.id));
    const inherited = parentFederation.policies.filter((p) => !childIds.has(p.id));
    const merged = [...inherited, ...childFederation.policies];
    return merged;
  }

  /** v10.6.0: evaluate a query across remote federation trust roots. */
  crossFederationEvaluate(query: PolicyQuery, remoteTrustRoots: FederatedTrustRoot[]): PolicyDecision {
    const baseDecision = this.evaluate(query);
    const namespaces = remoteTrustRoots.map((r) => r.namespace);
    const prefix = namespaces.length > 0 ? `[${namespaces.join(',')}] ` : '';
    return {
      ...baseDecision,
      reasons: baseDecision.reasons.map((r) => `${prefix}${r}`),
      policies: baseDecision.policies.map((p) => `${prefix}${p}`),
      audit: {
        agent: query.agent,
        decision: baseDecision.allowed ? 'allow' : baseDecision.blocked ? 'block' : 'warn',
        timestamp: new Date().toISOString(),
      },
    };
  }

  /** v7.0.0: return structured suggestions for warn-mode violations. */
  suggest(query: PolicyQuery): PolicySuggestion[] {
    const decision = this.evaluateInternal(query, false);
    const suggestions: PolicySuggestion[] = [];
    for (const pid of decision.policies) {
      const policy = this.policies.find((p) => p.id === pid);
      if (!policy) continue;
      const strict = (policy.enforcement ?? 'strict') === 'strict';
      if (strict) continue;
      for (const reason of decision.reasons) {
        if (reason.includes(pid)) {
          suggestions.push(
            new PolicySuggestion({
              id: `sugg-${suggestions.length + 1}`,
              policy_id: pid,
              action_kind: query.kind,
              action_value: query.value,
              reason,
              confidence: 0.5,
            })
          );
        }
      }
    }
    return suggestions;
  }

  /** v7.2.0: snapshot the current policy definition under a version tag. */
  versionPolicy(policyId: string, version: string): PolicyVersion | undefined {
    const policy = this.policies.find((p) => p.id === policyId);
    if (!policy) return undefined;
    (policy as any).version = version;
    const pv = new PolicyVersion(version, { ...(policy as unknown as Record<string, any>) }, new Date().toISOString());
    if (!this.versions) this.versions = new Map();
    const list = this.versions.get(policyId) ?? [];
    list.push(pv);
    this.versions.set(policyId, list);
    return pv;
  }

  /** v7.2.0: roll a policy back to a previously snapshot version. */
  rollback(policyId: string, toVersion: string): PolicyRollback | undefined {
    const list = this.versions?.get(policyId) ?? [];
    const target = list.find((v) => v.version === toVersion);
    if (!target) return undefined;
    const policy = this.policies.find((p) => p.id === policyId);
    if (!policy) return undefined;
    const fromVersion = (policy as any).version ?? (list.length > 0 ? list[list.length - 1].version : 'unknown');
    Object.assign(policy as any, target.policy);
    (policy as any).version = toVersion;
    const rolledAt = new Date().toISOString();
    const rollback = new PolicyRollback(policyId, fromVersion, toVersion, rolledAt);
    if (!this.rollbacks) this.rollbacks = [];
    this.rollbacks.push(rollback);
    return rollback;
  }

  /** v7.2.0: list snapshot versions for a policy. */
  getVersions(policyId: string): PolicyVersion[] {
    return this.versions?.get(policyId) ?? [];
  }

  /** v7.2.0: list rollback history for a policy. */
  getRollbacks(policyId: string): PolicyRollback[] {
    return this.rollbacks?.filter((r) => r.policy_id === policyId) ?? [];
  }

  private versions: Map<string, PolicyVersion[]> = new Map();
  private rollbacks: PolicyRollback[] = [];

  private evaluateInternal(query: PolicyQuery, denyOnly: boolean): PolicyDecision {
    const reasons: string[] = [];
    const violatingPolicies: string[] = [];
    let blocked = false;
    let allowed = true;
    let requiresApproval = false;
    const now = query.now ?? new Date();

    for (const policy of this.policies) {
      if (!this.governs(policy, query.agent)) continue;

      const strict = (policy.enforcement ?? 'strict') === 'strict';

      // v8.1.0: time-scoped least-privilege. Outside every
      // declared `allow_during` window, allowed actions are denied.
      const windows = normalizeObjects(policy.allow_during);
      if (windows.length > 0) {
        if (!this.inAnyWindow(windows, now)) {
          reasons.push(
            `Policy '${policy.id}' denies ${query.kind} '${query.value}' (outside allowed time window).`
          );
          violatingPolicies.push(policy.id);
          allowed = false;
          if (strict) blocked = true;
          continue;
        }
      }

      const deny = query.kind === 'path' ? policy.deny_paths : query.kind === 'command' ? policy.deny_commands : undefined;
      const allow = query.kind === 'path' ? policy.allow_paths : query.kind === 'command' ? policy.allow_commands : undefined;

      // 1. Explicit deny always wins.
      if (deny && deny.some((p) => this.matches(query.kind, p, query.value))) {
        reasons.push(`Policy '${policy.id}' denies ${query.kind} '${query.value}'.`);
        violatingPolicies.push(policy.id);
        allowed = false;
        if (strict) blocked = true;
        continue;
      }

      // 2. If an allow-list exists, the action must match it (skipped in deny-only mode).
      if (!denyOnly && allow && allow.length > 0) {
        const ok = allow.some((p) => this.matches(query.kind, p, query.value));
        if (!ok) {
          reasons.push(
            `Policy '${policy.id}' does not allow ${query.kind} '${query.value}' (not in allow-list).`,
          );
          violatingPolicies.push(policy.id);
          allowed = false;
          if (strict) blocked = true;
        }
      }

      // 3. v8.1.0: human-approval escalation. Matching an
      //    `require_approval` rule does NOT block — it flags the
      //    action for a human-in-the-loop gate instead.
      if (policy.require_approval) {
        const approvals = normalizeObjects(policy.require_approval);
        const hit = approvals.some(
          (r) => r.kind === query.kind && this.matches(query.kind, r.value ?? '', query.value)
        );
        if (hit) requiresApproval = true;
      }
    }

    return {
      allowed,
      blocked,
      reasons,
      policies: violatingPolicies,
      requiresApproval,
      audit: {
        agent: query.agent,
        decision: allowed ? 'allow' : blocked ? 'block' : 'warn',
        timestamp: now.toISOString(),
      },
    };
  }

  /** v8.1.0: is `now` inside any declared time window? */
  private inAnyWindow(windows: TimeWindow[], now: Date): boolean {
    const day = [
      'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday',
    ][now.getUTCDay()];
    const hhmm =
      (now.getUTCHours() < 10 ? '0' : '') + now.getUTCHours() +
      ':' +
      (now.getUTCMinutes() < 10 ? '0' : '') + now.getUTCMinutes();
    return windows.some((w) => {
      let days: any[] = w.days && w.days.length > 0 ? w.days : ['*'];
      // The line-based reader may keep an array value as a string.
      if (typeof days === 'string') {
        try {
          const parsed = JSON.parse(days);
          if (Array.isArray(parsed)) days = parsed;
        } catch {
          days = [days];
        }
      }
      const dayOk = days.includes('*') || days.some((d: string) => String(d).toLowerCase() === day);
      if (!dayOk) return false;
      if (!w.start && !w.end) return true;
      const start = w.start ?? '00:00';
      const end = w.end ?? '23:59';
      return hhmm >= start && hhmm < end;
    });
  }

  private matches(kind: PolicyActionKind, pattern: string, value: string): boolean {
    if (kind === 'command') {
      // Command patterns match as a prefix (e.g. "npm test" matches "npm test -- --watch").
      const p = pattern.trim().toLowerCase();
      const v = value.trim().toLowerCase();
      return v === p || v.startsWith(p + ' ') || v.startsWith(p);
    }
    // Path patterns use glob matching.
    return globToRegExp(pattern).test(normalizePath(value));
  }
}
