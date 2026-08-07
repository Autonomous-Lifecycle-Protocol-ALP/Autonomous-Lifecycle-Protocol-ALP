export interface SafetyPolicy {
  id: string;
  name: string;
  description: string;
  rules: SafetyRule[];
  severity: "low" | "medium" | "high" | "critical";
}

export interface SafetyRule {
  id: string;
  name: string;
  description: string;
  check: (context: SafetyContext) => SafetyRuleResult;
}

export interface SafetyContext {
  agentId?: string;
  swarmId?: string;
  taskId?: string;
  action: string;
  payload?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface SafetyRuleResult {
  passed: boolean;
  severity: "low" | "medium" | "high" | "critical";
  message: string;
  remediation?: string;
}

export interface SafetyEvaluation {
  evaluationId: string;
  context: SafetyContext;
  results: SafetyRuleResult[];
  overallPassed: boolean;
  evaluatedAt: string;
}

const DESTRUCTIVE_PATTERNS = ["delete", "drop", "truncate", "rm -rf", "destroy", "wipe"];
const EXFILTRATION_PATTERNS = ["exfiltrate", "send to external", "upload to", "post to http", "webhook"];
const PROMPT_INJECTION_PATTERNS = ["ignore previous instructions", "ignore all rules", "override safety", "disregard constraints"];

export class SafetyEvaluator {
  private readonly policies: Map<string, SafetyPolicy> = new Map();
  private readonly evaluations: Map<string, SafetyEvaluation> = new Map();

  constructor() {
    this.registerBuiltinPolicies();
  }

  registerPolicy(policy: SafetyPolicy): void {
    this.policies.set(policy.id, policy);
  }

  async evaluate(context: SafetyContext): Promise<SafetyEvaluation> {
    const evaluationId = `safety-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const results: SafetyRuleResult[] = [];

    for (const policy of this.policies.values()) {
      for (const rule of policy.rules) {
        try {
          const result = rule.check(context);
          results.push(result);
        } catch (error) {
          results.push({
            passed: false,
            severity: "high",
            message: `Rule '${rule.name}' threw an error: ${(error as Error).message}`,
            remediation: "Review rule implementation",
          });
        }
      }
    }

    const overallPassed = results.every((r) => r.passed);
    const evaluation: SafetyEvaluation = {
      evaluationId,
      context,
      results,
      overallPassed,
      evaluatedAt: new Date().toISOString(),
    };

    this.evaluations.set(evaluationId, evaluation);
    return evaluation;
  }

  getEvaluation(evaluationId: string): SafetyEvaluation | undefined {
    return this.evaluations.get(evaluationId);
  }

  getPolicies(): SafetyPolicy[] {
    return Array.from(this.policies.values());
  }

  private registerBuiltinPolicies(): void {
    this.registerPolicy({
      id: "builtin-no-destructive-actions",
      name: "No destructive actions",
      description: "Prevent destructive operations on production systems",
      severity: "critical",
      rules: [
        {
          id: "rule-destructive-action",
          name: "Destructive action check",
          description: "Block actions containing destructive keywords",
          check: (context: SafetyContext) => {
            const action = context.action.toLowerCase();
            const payloadText = JSON.stringify(context.payload ?? {}).toLowerCase();
            const combined = `${action} ${payloadText}`;

            const matched = DESTRUCTIVE_PATTERNS.find((pattern) => combined.includes(pattern));
            if (matched) {
              return {
                passed: false,
                severity: "critical",
                message: `Destructive action detected: '${matched}' in action or payload`,
                remediation: "Remove destructive keywords or request human approval",
              };
            }

            return {
              passed: true,
              severity: "low",
              message: "No destructive patterns detected",
            };
          },
        },
      ],
    });

    this.registerPolicy({
      id: "builtin-no-exfiltration",
      name: "No data exfiltration",
      description: "Prevent sending sensitive data to external systems",
      severity: "critical",
      rules: [
        {
          id: "rule-exfiltration-check",
          name: "Exfiltration check",
          description: "Block attempts to exfiltrate data",
          check: (context: SafetyContext) => {
            const payloadText = JSON.stringify(context.payload ?? {}).toLowerCase();

            const matched = EXFILTRATION_PATTERNS.find((pattern) => payloadText.includes(pattern));
            if (matched) {
              return {
                passed: false,
                severity: "critical",
                message: `Data exfiltration attempt detected: '${matched}'`,
                remediation: "Block external data transfer and alert security team",
              };
            }

            return {
              passed: true,
              severity: "low",
              message: "No exfiltration patterns detected",
            };
          },
        },
      ],
    });

    this.registerPolicy({
      id: "builtin-no-prompt-injection",
      name: "No prompt injection",
      description: "Detect prompt injection attempts in context",
      severity: "high",
      rules: [
        {
          id: "rule-prompt-injection-check",
          name: "Prompt injection check",
          description: "Block prompt injection attempts",
          check: (context: SafetyContext) => {
            const action = context.action.toLowerCase();
            const metadataText = JSON.stringify(context.metadata ?? {}).toLowerCase();

            const matched = PROMPT_INJECTION_PATTERNS.find((pattern) => action.includes(pattern) || metadataText.includes(pattern));
            if (matched) {
              return {
                passed: false,
                severity: "high",
                message: `Prompt injection detected: '${matched}'`,
                remediation: "Reject input and log security event",
              };
            }

            return {
              passed: true,
              severity: "low",
              message: "No prompt injection patterns detected",
            };
          },
        },
      ],
    });
  }
}
