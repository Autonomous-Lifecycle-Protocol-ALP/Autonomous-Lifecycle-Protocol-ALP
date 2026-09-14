use hydra_agents::{AgentSpec, AgentType, ResourceBudget};
use hydra_capabilities::{Capability, RiskLevel};
use hydra_security::{Policy, PolicyEffect, PolicyRule, SecurityKernel};

pub fn kernel_with_capabilities(actions: &[&str]) -> SecurityKernel {
    let mut kernel = SecurityKernel::new();
    for action in actions {
        kernel
            .capability_broker
            .registry()
            .register(Capability::new(action.to_string(), "**".to_string(), RiskLevel::Low), false);
        kernel.policy_engine.policies.push(Policy {
            id: format!("allow-{}", action),
            name: format!("Allow {}", action),
            rules: vec![PolicyRule {
                action: action.to_string(),
                scope: "**".to_string(),
                effect: PolicyEffect::Allow,
            }],
            enabled: true,
        });
    }
    kernel
}

pub fn agent_spec(id: &str) -> AgentSpec {
    AgentSpec {
        id: id.to_string(),
        agent_type: AgentType::Developer,
        model: "coding-medium".to_string(),
        skills: vec![],
        capabilities: vec![],
        resource_budget: Some(ResourceBudget {
            cpu_limit: 4,
            memory_mb: 8192,
            disk_mb: 10240,
            network_enabled: false,
        }),
    }
}
