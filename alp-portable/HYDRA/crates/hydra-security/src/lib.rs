pub mod kill_switch;
pub mod policy;
pub mod resource_governor;
pub mod risk;

use hydra_audit::AuditLog;
use hydra_capabilities::{CapabilityBroker, RiskLevel};

pub use kill_switch::KillSwitch;
pub use policy::{PolicyEffect, PolicyEngine, Policy, PolicyRule};
pub use resource_governor::{ResourceBudget, ResourceGovernor, ResourceUsage};
pub use risk::RiskEngine;

use uuid::Uuid;

pub struct SecurityKernel {
    pub kill_switch: KillSwitch,
    pub policy_engine: PolicyEngine,
    pub capability_broker: CapabilityBroker,
    pub audit_log: AuditLog,
    pub risk_engine: RiskEngine,
    pub resource_governor: ResourceGovernor,
}

impl Default for SecurityKernel {
    fn default() -> Self {
        Self::new()
    }
}

impl SecurityKernel {
    pub fn new() -> Self {
        let mut capability_broker = CapabilityBroker::new();
        capability_broker.setup_builtin_capabilities();

        let policies = vec![Policy {
            id: "default-allow-auto".into(),
            name: "Allow auto-approved capabilities".into(),
            rules: vec![
                PolicyRule { action: "project.read".into(), scope: "/projects/**".into(), effect: PolicyEffect::Allow },
                PolicyRule { action: "terminal.test".into(), scope: "/**".into(), effect: PolicyEffect::Allow },
                PolicyRule { action: "filesystem.read".into(), scope: "/**".into(), effect: PolicyEffect::Allow },
            ],
            enabled: true,
        }];

        let mut policy_engine = PolicyEngine::new();
        policy_engine.policies = policies;

        Self {
            kill_switch: KillSwitch::new(),
            policy_engine,
            capability_broker,
            audit_log: AuditLog::new(),
            risk_engine: RiskEngine::new(),
            resource_governor: ResourceGovernor::new(),
        }
    }

    pub fn with_policy_engine(policy_engine: PolicyEngine) -> Self {
        let mut kernel = Self::new();
        kernel.policy_engine = policy_engine;
        kernel
    }

    pub fn is_active(&self) -> bool {
        self.kill_switch.is_active()
    }

    pub fn emergency_stop(&mut self) {
        self.kill_switch.trigger();
    }

    pub fn evaluate_request(
        &mut self,
        task_id: String,
        agent_id: &str,
        action: &str,
        scope: &str,
        max_operations: Option<u64>,
        network_enabled: bool,
    ) -> Option<String> {
        if !self.kill_switch.is_active() {
            return None;
        }

        let risk = self.risk_engine.evaluate(action, scope, agent_id);

        match self.policy_engine.evaluate(action, scope) {
            PolicyEffect::Allow => {
                if let Some(token) = self.capability_broker.request(
                    action,
                    scope,
                    agent_id,
                    Some(task_id.clone()),
                    max_operations,
                    network_enabled,
                ) {
                    let token_id = token.token_id.clone();
                    let risk_str = match &risk {
                        RiskLevel::Low => "low",
                        RiskLevel::Medium => "medium",
                        RiskLevel::High => "high",
                        RiskLevel::Critical => "critical",
                    };
                    self.audit_log.record_event(
                        task_id,
                        agent_id.to_string(),
                        action.to_string(),
                        scope.to_string(),
                        action.to_string(),
                        "granted".to_string(),
                        risk_str.to_string(),
                    );
                    Some(token_id)
                } else {
                    self.audit_log.record_event(
                        task_id,
                        agent_id.to_string(),
                        action.to_string(),
                        scope.to_string(),
                        action.to_string(),
                        "denied_approval".to_string(),
                        match &risk {
                            RiskLevel::Low => "low",
                            RiskLevel::Medium => "medium",
                            RiskLevel::High => "high",
                            RiskLevel::Critical => "critical",
                        }.to_string(),
                    );
                    None
                }
            }
            PolicyEffect::Deny => {
                self.audit_log.record_event(
                    task_id,
                    agent_id.to_string(),
                    action.to_string(),
                    scope.to_string(),
                    action.to_string(),
                    "denied_policy".to_string(),
                    match &risk {
                        RiskLevel::Low => "low",
                        RiskLevel::Medium => "medium",
                        RiskLevel::High => "high",
                        RiskLevel::Critical => "critical",
                    }.to_string(),
                );
                None
            }
        }
    }

    pub fn verify_token(&self, token_id: &str) -> bool {
        if !self.kill_switch.is_active() {
            return false;
        }
        self.capability_broker.validate_token(token_id).is_some()
    }

    pub fn consume_token(&mut self, token_id: &str) -> bool {
        self.capability_broker.use_token(token_id)
    }

    pub fn request_resources(
        &mut self,
        agent_id: &str,
        budget: ResourceBudget,
    ) -> Option<String> {
        self.resource_governor.allocate(agent_id, budget)
    }

    pub fn release_resources(&mut self, agent_id: &str) {
        self.resource_governor.release(agent_id);
    }

    pub fn check_resources(&self, agent_id: &str) -> Option<ResourceUsage> {
        self.resource_governor.get_usage(agent_id)
    }

    pub fn task_id(&self) -> String {
        Uuid::new_v4().to_string()
    }

    pub fn shutdown(&mut self) {
        self.kill_switch.trigger();
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn kill_switch_starts_active() {
        let kernel = SecurityKernel::new();
        assert!(kernel.kill_switch.is_active());
    }

    #[test]
    fn kill_switch_trigger_deactivates() {
        let mut kernel = SecurityKernel::new();
        kernel.kill_switch.trigger();
        assert!(!kernel.kill_switch.is_active());
    }

    #[test]
    fn emergency_stop_deactivates_kernel() {
        let mut kernel = SecurityKernel::new();
        kernel.emergency_stop();
        assert!(!kernel.is_active());
    }

    #[test]
    fn evaluate_request_grants_auto_capability() {
        let mut kernel = SecurityKernel::new();
        let token_id = kernel.evaluate_request(
            "task-1".into(),
            "agent-01",
            "project.read",
            "/projects/demo",
            Some(10),
            false,
        );
        assert!(token_id.is_some());
        assert!(kernel.verify_token(token_id.as_ref().unwrap()));
    }

    #[test]
    fn evaluate_request_denies_blocked_by_policy() {
        let mut kernel = SecurityKernel::new();
        kernel.policy_engine = PolicyEngine::with_default_deny();
        let token_id = kernel.evaluate_request(
            "task-1".into(),
            "agent-01",
            "project.read",
            "/projects/demo",
            Some(10),
            false,
        );
        assert!(token_id.is_none());
    }

    #[test]
    fn evaluate_request_denies_after_emergency_stop() {
        let mut kernel = SecurityKernel::new();
        kernel.emergency_stop();
        let token_id = kernel.evaluate_request(
            "task-1".into(),
            "agent-01",
            "project.read",
            "/projects/demo",
            Some(10),
            false,
        );
        assert!(token_id.is_none());
    }

    #[test]
    fn consume_token_decrements_usage() {
        let mut kernel = SecurityKernel::new();
        let token_id = kernel
            .evaluate_request(
                "task-1".into(),
                "agent-01",
                "project.read",
                "/projects/demo",
                Some(2),
                false,
            )
            .unwrap();
        assert!(kernel.consume_token(&token_id));
        assert!(kernel.consume_token(&token_id));
        assert!(!kernel.consume_token(&token_id));
    }

    #[test]
    fn request_resources_allocates_budget() {
        let mut kernel = SecurityKernel::new();
        let budget = ResourceBudget {
            cpu_limit: 2,
            memory_mb: 4096,
            disk_mb: 1024,
            network_enabled: false,
        };
        let allocation = kernel.request_resources("agent-01", budget);
        assert!(allocation.is_some());
        assert!(kernel.check_resources("agent-01").is_some());
    }

    #[test]
    fn release_resources_frees_allocation() {
        let mut kernel = SecurityKernel::new();
        let budget = ResourceBudget {
            cpu_limit: 2,
            memory_mb: 4096,
            disk_mb: 1024,
            network_enabled: false,
        };
        kernel.request_resources("agent-01", budget);
        kernel.release_resources("agent-01");
        assert!(kernel.check_resources("agent-01").is_none());
    }

    #[test]
    fn audit_log_records_all_events() {
        let mut kernel = SecurityKernel::new();
        let _ = kernel.evaluate_request(
            "task-1".into(),
            "agent-01",
            "project.read",
            "/projects/demo",
            Some(10),
            false,
        );
        assert!(kernel.audit_log.verify_chain());
    }
}
