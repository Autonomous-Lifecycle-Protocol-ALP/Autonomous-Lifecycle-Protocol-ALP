export class PolicySuggestion {
  id: string;
  policy_id: string;
  action_kind: string;
  action_value: string;
  reason: string;
  confidence: number;
  metadata: Record<string, any>;
  created_at: string;

  constructor(opts: {
    id: string;
    policy_id: string;
    action_kind: string;
    action_value: string;
    reason: string;
    confidence?: number;
    metadata?: Record<string, any>;
  }) {
    this.id = opts.id;
    this.policy_id = opts.policy_id;
    this.action_kind = opts.action_kind;
    this.action_value = opts.action_value;
    this.reason = opts.reason;
    this.confidence = Math.max(0, Math.min(1, opts.confidence ?? 0.5));
    this.metadata = opts.metadata ?? {};
    this.created_at = new Date().toISOString();
  }

  toJSON(): Record<string, any> {
    return {
      id: this.id,
      policy_id: this.policy_id,
      action_kind: this.action_kind,
      action_value: this.action_value,
      reason: this.reason,
      confidence: this.confidence,
      metadata: this.metadata,
      created_at: this.created_at,
    };
  }
}
