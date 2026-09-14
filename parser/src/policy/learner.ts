import { PolicyContext, PolicyLearnerSuggestion } from './types';

export class PolicyLearner {
  private violations: Array<{ policy_id: string; action: string; allowed: boolean; context: PolicyContext }> = [];

  recordViolation(policy_id: string, action: string, allowed: boolean, context: PolicyContext): void {
    this.violations.push({ policy_id, action, allowed, context });
  }

  suggest(): PolicyLearnerSuggestion[] {
    const byPolicy = new Map<string, typeof this.violations>()
    for (const v of this.violations) {
      const list = byPolicy.get(v.policy_id) || []
      list.push(v)
      byPolicy.set(v.policy_id, list)
    }
    const suggestions: PolicyLearnerSuggestion[] = []
    for (const [policy_id, violations] of byPolicy.entries()) {
      const denied = violations.filter((v) => !v.allowed)
      if (denied.length >= 3) {
        suggestions.push({
          policy_id,
          action: 'review_allow_rules',
          suggestion: `Policy '${policy_id}' blocked ${denied.length} actions; consider widening allow rules or adding environment-specific overrides.`,
          confidence: Math.min(0.95, 0.5 + denied.length * 0.1),
        })
      }
    }
    return suggestions
  }

  reset(): void {
    this.violations = []
  }
}
