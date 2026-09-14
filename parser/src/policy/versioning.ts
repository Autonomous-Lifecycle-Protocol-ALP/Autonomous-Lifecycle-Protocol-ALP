export class PolicyVersion {
  version: string;
  policy: Record<string, any>;
  created_at: string;

  constructor(version: string, policy: Record<string, any>, created_at: string) {
    this.version = version;
    this.policy = { ...policy };
    this.created_at = created_at;
  }

  toJSON(): Record<string, any> {
    return {
      version: this.version,
      policy: this.policy,
      created_at: this.created_at,
    };
  }
}

export class PolicyRollback {
  policy_id: string;
  from_version: string;
  to_version: string;
  rolled_back_at: string;

  constructor(policy_id: string, from_version: string, to_version: string, rolled_back_at: string) {
    this.policy_id = policy_id;
    this.from_version = from_version;
    this.to_version = to_version;
    this.rolled_back_at = rolled_back_at;
  }

  toJSON(): Record<string, any> {
    return {
      policy_id: this.policy_id,
      from_version: this.from_version,
      to_version: this.to_version,
      rolled_back_at: this.rolled_back_at,
    };
  }
}
