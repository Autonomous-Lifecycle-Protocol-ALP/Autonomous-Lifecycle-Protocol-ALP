export type PolicyActionKind = 'path' | 'command' | 'agent';

export interface TimeWindow {
  /** Day-of-week names or `*` (every day). */
  days?: string[];
  /** Inclusive start HH:MM (UTC). */
  start?: string;
  /** Exclusive end HH:MM (UTC). */
  end?: string;
}

export interface ApprovalRule {
  kind: 'path' | 'command';
  value: string;
}

export interface PolicyProposal {
  id: string;
  action: string;
  agent: string;
  signed_by?: string;
  signature?: string;
}

export interface PolicyDecision {
  allowed: boolean;
  /** True only for hard blocks from a `strict` policy. */
  blocked: boolean;
  /** Human-readable reasons (violations or warnings). */
  reasons: string[];
  /** The policy ids that produced a violation. */
  policies: string[];
  /** Actions that must be escalated to human approval. */
  requiresApproval?: boolean;
  /** Audit record for MCP-enforcement (spec/03 §25). */
  audit?: { proposalId?: string; agent?: string; decision: string; timestamp: string };
}

export interface PolicyQuery {
  kind: PolicyActionKind;
  /** The path, command, or agent id being evaluated. */
  value: string;
  /** The agent attempting the action (for `applies_to` scoping). */
  agent?: string;
  /** Current UTC time (defaults to now) for `allow_during` checks. */
  now?: Date;
}

/** v10.6.0: trust anchor for a remote federation workspace. */
export interface FederatedTrustRoot {
  namespace: string;
  publicKeyPem: string;
  fingerprint: string;
}

export interface PolicyContext {
  environment: 'development' | 'staging' | 'production';
  team_size: number;
  risk_profile: 'low' | 'medium' | 'high';
  deployment_target: string;
}

export interface PolicyLearnerSuggestion {
  policy_id: string;
  action: string;
  suggestion: string;
  confidence: number;
}
