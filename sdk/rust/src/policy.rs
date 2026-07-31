use crate::AlpObject;
use regex::Regex;

#[derive(Debug, Clone)]
pub struct PolicyEngine {
    policies: Vec<AlpObject>,
}

impl PolicyEngine {
    pub fn new(objects: &[AlpObject]) -> Self {
        let policies = objects
            .iter()
            .filter(|o| o.object_type == "policy")
            .cloned()
            .collect();
        Self { policies }
    }

    pub fn count(&self) -> usize {
        self.policies.len()
    }

    pub fn evaluate(&self, query: &PolicyQuery) -> PolicyDecision {
        let mut reasons = Vec::new();
        let mut matched_policies = Vec::new();
        let mut blocked = false;
        let mut requires_approval = false;

        for policy in &self.policies {
            let kind = policy
                .properties
                .get("kind")
                .and_then(|v| v.as_str())
                .unwrap_or("");
            let value = policy
                .properties
                .get("value")
                .and_then(|v| v.as_str())
                .unwrap_or("");

            if !matches(query, kind, value) {
                continue;
            }

            matched_policies.push(policy.id.clone());

            if kind.starts_with("deny")
                || (kind == "deny_path" && query.kind == "path")
                || (kind == "deny_command" && query.kind == "command")
            {
                blocked = true;
                reasons.push(format!("Denied by policy: {}", policy.id));
            } else if kind == "require_approval" {
                requires_approval = true;
                reasons.push(format!("Requires approval: {}", policy.id));
            } else {
                let enforcement = policy
                    .properties
                    .get("enforcement")
                    .and_then(|v| v.as_str())
                    .unwrap_or("strict");
                if enforcement == "warn" {
                    reasons.push(format!("Warning: {}", policy.id));
                }
            }
        }

        let allowed = !blocked;
        PolicyDecision {
            allowed,
            blocked,
            reasons,
            policies: matched_policies,
            requires_approval,
        }
    }
}

fn matches(query: &PolicyQuery, policy_kind: &str, policy_value: &str) -> bool {
    if policy_value.is_empty() {
        return false;
    }
    let base_kind = policy_kind.replace("deny_", "").replace("allow_", "");
    if query.kind != base_kind {
        return false;
    }
    if query.value.is_none() {
        return false;
    }
    let query_value = query.value.as_ref().unwrap();
    if policy_value.contains('*') {
        let pattern = policy_value.replace('.', "\\.").replace('*', ".*");
        if let Ok(re) = Regex::new(&pattern) {
            return re.is_match(query_value);
        }
        return false;
    }
    query_value == policy_value || query_value.starts_with(policy_value)
}

pub struct PolicyQuery {
    pub kind: String,
    pub value: Option<String>,
    pub agent: Option<String>,
}

impl PolicyQuery {
    pub fn new(kind: impl Into<String>, value: impl Into<String>) -> Self {
        Self {
            kind: kind.into(),
            value: Some(value.into()),
            agent: None,
        }
    }

    pub fn with_agent(mut self, agent: impl Into<String>) -> Self {
        self.agent = Some(agent.into());
        self
    }
}

pub struct PolicyDecision {
    pub allowed: bool,
    pub blocked: bool,
    pub reasons: Vec<String>,
    pub policies: Vec<String>,
    pub requires_approval: bool,
}
