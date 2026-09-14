use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum PolicyEffect {
    Allow,
    Deny,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Policy {
    pub id: String,
    pub name: String,
    pub rules: Vec<PolicyRule>,
    pub enabled: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PolicyRule {
    pub action: String,
    pub scope: String,
    pub effect: PolicyEffect,
}

impl Policy {
    pub fn new(id: String, name: String, enabled: bool) -> Self {
        Self {
            id,
            name,
            rules: Vec::new(),
            enabled,
        }
    }

    pub fn allow(&mut self, action: &str, scope: &str) {
        self.rules.push(PolicyRule {
            action: action.to_string(),
            scope: scope.to_string(),
            effect: PolicyEffect::Allow,
        });
    }

    pub fn deny(&mut self, action: &str, scope: &str) {
        self.rules.push(PolicyRule {
            action: action.to_string(),
            scope: scope.to_string(),
            effect: PolicyEffect::Deny,
        });
    }
}

pub struct PolicyEngine {
    pub policies: Vec<Policy>,
}

impl Default for PolicyEngine {
    fn default() -> Self {
        Self::new()
    }
}

impl PolicyEngine {
    pub fn new() -> Self {
        Self {
            policies: Vec::new(),
        }
    }

    pub fn with_default_deny() -> Self {
        let mut engine = Self::new();
        engine.add_policy(Policy {
            id: "default-deny".into(),
            name: "Default Deny All".into(),
            rules: vec![],
            enabled: true,
        });
        engine
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
                if scope_matches(&rule.scope, scope) && rule.action == action {
                    return rule.effect.clone();
                }
            }
        }
        PolicyEffect::Deny
    }
}

fn scope_matches(pattern: &str, scope: &str) -> bool {
    if pattern.ends_with("/**") {
        let prefix = &pattern[..pattern.len() - 3];
        scope == prefix || scope.starts_with(&format!("{}/", prefix))
    } else {
        pattern == scope
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
            rules: vec![PolicyRule {
                action: "read".into(),
                scope: "files".into(),
                effect: PolicyEffect::Allow,
            }],
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
            rules: vec![PolicyRule {
                action: "read".into(),
                scope: "files".into(),
                effect: PolicyEffect::Allow,
            }],
            enabled: true,
        });
        assert_eq!(engine.evaluate("write", "files"), PolicyEffect::Deny);
    }

    #[test]
    fn policy_supports_glob_scope() {
        let mut engine = PolicyEngine::new();
        engine.add_policy(Policy {
            id: "p1".into(),
            name: "project".into(),
            rules: vec![PolicyRule {
                action: "read".into(),
                scope: "/projects/**".into(),
                effect: PolicyEffect::Allow,
            }],
            enabled: true,
        });
        assert_eq!(engine.evaluate("read", "/projects/demo/src"), PolicyEffect::Allow);
    }

    #[test]
    fn policy_evaluate_uses_first_match() {
        let mut engine = PolicyEngine::new();
        engine.add_policy(Policy {
            id: "p1".into(),
            name: "deny".into(),
            rules: vec![PolicyRule {
                action: "read".into(),
                scope: "files".into(),
                effect: PolicyEffect::Deny,
            }],
            enabled: true,
        });
        engine.add_policy(Policy {
            id: "p2".into(),
            name: "allow".into(),
            rules: vec![PolicyRule {
                action: "read".into(),
                scope: "files".into(),
                effect: PolicyEffect::Allow,
            }],
            enabled: true,
        });
        assert_eq!(engine.evaluate("read", "files"), PolicyEffect::Deny);
    }

    #[test]
    fn policy_skips_disabled_policies() {
        let mut engine = PolicyEngine::new();
        engine.add_policy(Policy {
            id: "p1".into(),
            name: "disabled".into(),
            rules: vec![PolicyRule {
                action: "read".into(),
                scope: "files".into(),
                effect: PolicyEffect::Allow,
            }],
            enabled: false,
        });
        assert_eq!(engine.evaluate("read", "files"), PolicyEffect::Deny);
    }

    #[test]
    fn default_deny_blocks_all() {
        let engine = PolicyEngine::with_default_deny();
        assert_eq!(engine.evaluate("read", "anything"), PolicyEffect::Deny);
    }
}
