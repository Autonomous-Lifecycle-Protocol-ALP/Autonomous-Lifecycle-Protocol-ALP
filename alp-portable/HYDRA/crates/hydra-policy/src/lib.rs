pub struct PolicyEngine {
    pub policies: Vec<Policy>,
}

pub struct Policy {
    pub id: String,
    pub name: String,
    pub rules: Vec<PolicyRule>,
    pub enabled: bool,
}

pub struct PolicyRule {
    pub action: String,
    pub scope: String,
    pub effect: PolicyEffect,
}

#[derive(Debug, Clone, PartialEq)]
pub enum PolicyEffect {
    Allow,
    Deny,
}

impl PolicyEngine {
    pub fn new() -> Self {
        Self { policies: Vec::new() }
    }

    pub fn add_policy(&mut self, policy: Policy) {
        self.policies.push(policy);
    }

    pub fn evaluate(&self, action: &str, scope: &str) -> PolicyEffect {
        for policy in &self.policies {
            if !policy.enabled {
                continue;
            }
            for rule in &policy.rules {
                if rule.action == action && rule.scope == scope {
                    return rule.effect.clone();
                }
            }
        }
        PolicyEffect::Deny
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn policy_allows_matching_rule() {
        let mut engine = PolicyEngine::new();
        engine.add_policy(Policy {
            id: "p1".into(),
            name: "test".into(),
            rules: vec![PolicyRule { action: "read".into(), scope: "files".into(), effect: PolicyEffect::Allow }],
            enabled: true,
        });
        assert_eq!(engine.evaluate("read", "files"), PolicyEffect::Allow);
    }

    #[test]
    fn policy_denies_non_matching() {
        let mut engine = PolicyEngine::new();
        engine.add_policy(Policy {
            id: "p1".into(),
            name: "test".into(),
            rules: vec![PolicyRule { action: "read".into(), scope: "files".into(), effect: PolicyEffect::Allow }],
            enabled: true,
        });
        assert_eq!(engine.evaluate("write", "files"), PolicyEffect::Deny);
    }
}
