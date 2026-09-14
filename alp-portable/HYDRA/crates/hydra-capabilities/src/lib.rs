use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum RiskLevel {
    Low,
    Medium,
    High,
    Critical,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CapabilityToken {
    pub token_id: String,
    pub cap_type: String,
    pub scope: String,
    pub issued_to: String,
    pub agent_id: String,
    pub task_id: Option<String>,
    pub expires_at: Option<String>,
    pub max_operations: Option<u64>,
    pub operations_used: u64,
    pub network_enabled: bool,
}

impl CapabilityToken {
    pub fn new(
        cap_type: String,
        scope: String,
        issued_to: String,
        agent_id: String,
        task_id: Option<String>,
        expires_at: Option<String>,
        max_operations: Option<u64>,
        network_enabled: bool,
    ) -> Self {
        Self {
            token_id: uuid::Uuid::new_v4().to_string(),
            cap_type,
            scope,
            issued_to,
            agent_id,
            task_id,
            expires_at,
            max_operations,
            operations_used: 0,
            network_enabled,
        }
    }

    pub fn consume(&mut self) -> bool {
        if let Some(max) = self.max_operations {
            if self.operations_used >= max {
                return false;
            }
        }
        self.operations_used += 1;
        true
    }

    pub fn is_expired(&self) -> bool {
        if let Some(expiry) = &self.expires_at {
            if let Ok(exp) = chrono::DateTime::parse_from_rfc3339(expiry) {
                return chrono::Utc::now() > exp;
            }
        }
        false
    }

    pub fn is_valid(&self) -> bool {
        !self.is_expired()
    }

    pub fn remaining(&self) -> Option<u64> {
        self.max_operations.map(|max| max.saturating_sub(self.operations_used))
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Capability {
    pub action: String,
    pub scope: String,
    pub risk: RiskLevel,
}

impl Capability {
    pub fn new(action: String, scope: String, risk: RiskLevel) -> Self {
        Self { action, scope, risk }
    }

    pub fn matches(&self, action: &str, scope: &str) -> bool {
        let pattern = &self.scope;
        let scope_match = if pattern.ends_with("/**") {
            let prefix = &pattern[..pattern.len() - 3];
            scope == prefix || scope.starts_with(&format!("{}/", prefix))
        } else {
            pattern == scope
        };
        self.action == action && scope_match
    }
}

#[derive(Debug, Clone)]
pub struct RegisteredCapability {
    pub capability: Capability,
    pub approval_required: bool,
}

pub struct CapabilityRegistry {
    capabilities: Vec<RegisteredCapability>,
}

impl Default for CapabilityRegistry {
    fn default() -> Self {
        Self::new()
    }
}

impl CapabilityRegistry {
    pub fn new() -> Self {
        Self {
            capabilities: Vec::new(),
        }
    }

    pub fn register(&mut self, capability: Capability, approval_required: bool) {
        self.capabilities.push(RegisteredCapability {
            capability,
            approval_required,
        });
    }

    pub fn resolve(&self, action: &str, scope: &str) -> Option<&RegisteredCapability> {
        self.capabilities
            .iter()
            .find(|rc| rc.capability.matches(action, scope))
    }

    pub fn requires_approval(&self, action: &str, scope: &str) -> bool {
        self.resolve(action, scope)
            .map(|rc| rc.approval_required)
            .unwrap_or(true)
    }

    pub fn list(&self) -> &[RegisteredCapability] {
        &self.capabilities
    }
}

pub struct CapabilityBroker {
    registry: CapabilityRegistry,
    issued_tokens: Vec<CapabilityToken>,
}

impl Default for CapabilityBroker {
    fn default() -> Self {
        Self::new()
    }
}

impl CapabilityBroker {
    pub fn new() -> Self {
        Self {
            registry: CapabilityRegistry::new(),
            issued_tokens: Vec::new(),
        }
    }

    pub fn registry(&mut self) -> &mut CapabilityRegistry {
        &mut self.registry
    }

    pub fn request(
        &mut self,
        action: &str,
        scope: &str,
        agent_id: &str,
        task_id: Option<String>,
        max_operations: Option<u64>,
        network_enabled: bool,
    ) -> Option<CapabilityToken> {
        if let Some(registered) = self.registry.resolve(action, scope) {
            if !registered.approval_required {
                let token = CapabilityToken::new(
                    action.to_string(),
                    scope.to_string(),
                    agent_id.to_string(),
                    agent_id.to_string(),
                    task_id,
                    None,
                    max_operations,
                    network_enabled,
                );
                let token_id = token.token_id.clone();
                self.issued_tokens.push(token);
                return self.issued_tokens
                    .iter_mut()
                    .find(|t| t.token_id == token_id)
                    .cloned();
            }
        }
        None
    }

    pub fn validate_token(&self, token_id: &str) -> Option<&CapabilityToken> {
        self.issued_tokens
            .iter()
            .find(|t| t.token_id == token_id && t.is_valid())
    }

    pub fn use_token(&mut self, token_id: &str) -> bool {
        if let Some(token) = self
            .issued_tokens
            .iter_mut()
            .find(|t| t.token_id == token_id)
        {
            if token.is_valid() {
                return token.consume();
            }
        }
        false
    }

    pub fn revoke(&mut self, token_id: &str) -> bool {
        if let Some(pos) = self.issued_tokens.iter().position(|t| t.token_id == token_id) {
            self.issued_tokens.remove(pos);
            return true;
        }
        false
    }

    pub fn enforce(
        &self,
        capability: &Capability,
        target: &std::collections::HashMap<String, Vec<String>>,
    ) -> bool {
        target
            .get(&capability.scope)
            .map(|v| v.contains(&capability.action))
            .unwrap_or(false)
    }

    pub fn issued_count(&self) -> usize {
        self.issued_tokens.len()
    }

    pub fn setup_builtin_capabilities(&mut self) {
        self.registry.register(
            Capability::new("project.read".into(), "/projects/**".into(), RiskLevel::Low),
            false,
        );
self.registry.register(
            Capability::new("project.write".into(), "/projects/**".into(), RiskLevel::Medium),
            true,
        );
self.registry.register(
            Capability::new("terminal.test".into(), "/**".into(), RiskLevel::Low),
            false,
        );
self.registry.register(
            Capability::new("terminal.exec".into(), "/projects/**".into(), RiskLevel::Medium),
            true,
        );
self.registry.register(
            Capability::new("network".into(), "*".into(), RiskLevel::High),
            true,
        );
self.registry.register(
            Capability::new("filesystem.read".into(), "/**".into(), RiskLevel::Low),
            false,
        );
self.registry.register(
            Capability::new("filesystem.write".into(), "/**".into(), RiskLevel::High),
            true,
        );
self.registry.register(
            Capability::new("sandbox.create".into(), "/**".into(), RiskLevel::Medium),
            true,
        );
self.registry.register(
            Capability::new("credentials.read".into(), "/**".into(), RiskLevel::Critical),
            true,
        );
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn capability_broker_enforces_allowed_action() {
        let broker = CapabilityBroker::new();
        let mut target = std::collections::HashMap::new();
        target.insert("scope-1".into(), vec!["read".into(), "write".into()]);
        let cap = Capability {
            action: "read".into(),
            scope: "scope-1".into(),
            risk: RiskLevel::Low,
        };
        assert!(broker.enforce(&cap, &target));
    }

    #[test]
    fn capability_broker_denies_missing_action() {
        let broker = CapabilityBroker::new();
        let mut target = std::collections::HashMap::new();
        target.insert("scope-1".into(), vec!["read".into()]);
        let cap = Capability {
            action: "write".into(),
            scope: "scope-1".into(),
            risk: RiskLevel::Low,
        };
        assert!(!broker.enforce(&cap, &target));
    }

    #[test]
    fn capability_matches_exact_scope() {
        let cap = Capability::new("read".into(), "files".into(), RiskLevel::Low);
        assert!(cap.matches("read", "files"));
        assert!(!cap.matches("write", "files"));
    }

    #[test]
    fn capability_matches_glob_scope() {
        let cap = Capability::new("read".into(), "/projects/**".into(), RiskLevel::Low);
        assert!(cap.matches("read", "/projects/demo/src"));
        assert!(cap.matches("read", "/projects/demo"));
        assert!(!cap.matches("read", "/home"));
    }

    #[test]
    fn capability_token_consume_decrements_remaining() {
        let mut token = CapabilityToken::new(
            "read".into(),
            "/projects/demo".into(),
            "agent-01".into(),
            "agent-01".into(),
            Some("task-1".into()),
            None,
            Some(3),
            false,
        );
        assert_eq!(token.remaining(), Some(3));
        assert!(token.consume());
        assert_eq!(token.remaining(), Some(2));
        assert!(token.consume());
        assert!(token.consume());
        assert_eq!(token.remaining(), Some(0));
        assert!(!token.consume());
    }

    #[test]
    fn capability_registry_requires_approval() {
        let mut broker = CapabilityBroker::new();
        broker.setup_builtin_capabilities();
        assert!(!broker.registry().requires_approval("project.read", "/projects/demo"));
        assert!(broker.registry().requires_approval("project.write", "/projects/demo"));
        assert!(broker.registry().requires_approval("nonexistent", "/"));
    }

    #[test]
    fn capability_broker_requests_auto_token() {
        let mut broker = CapabilityBroker::new();
        broker.setup_builtin_capabilities();
        let token = broker.request(
            "project.read",
            "/projects/demo",
            "agent-01",
            Some("task-1".into()),
            Some(10),
            false,
        );
        assert!(token.is_some());
        let token = token.unwrap();
        assert_eq!(token.cap_type, "project.read");
        assert_eq!(token.network_enabled, false);
        assert_eq!(token.remaining(), Some(10));
    }

    #[test]
    fn capability_broker_denies_approval_required() {
        let mut broker = CapabilityBroker::new();
        broker.setup_builtin_capabilities();
        let token = broker.request(
            "network",
            "*",
            "agent-01",
            Some("task-1".into()),
            Some(1),
            true,
        );
        assert!(token.is_none());
    }
}
