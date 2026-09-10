use hydra_capabilities::RiskLevel;
use std::collections::HashMap;

struct AgentRiskProfile {
    last_risk: RiskLevel,
    recent_denials: u32,
}

pub struct RiskEngine {
    agent_profiles: HashMap<String, AgentRiskProfile>,
    action_risks: HashMap<String, RiskLevel>,
}

impl Default for RiskEngine {
    fn default() -> Self {
        Self::new()
    }
}

impl RiskEngine {
    pub fn new() -> Self {
        let mut action_risks = HashMap::new();
        action_risks.insert("project.read".to_string(), RiskLevel::Low);
        action_risks.insert("project.write".to_string(), RiskLevel::Medium);
        action_risks.insert("terminal.test".to_string(), RiskLevel::Low);
        action_risks.insert("terminal.exec".to_string(), RiskLevel::Medium);
        action_risks.insert("filesystem.read".to_string(), RiskLevel::Low);
        action_risks.insert("filesystem.write".to_string(), RiskLevel::High);
        action_risks.insert("sandbox.create".to_string(), RiskLevel::Medium);
        action_risks.insert("network".to_string(), RiskLevel::High);
        action_risks.insert("credentials.read".to_string(), RiskLevel::Critical);

        Self {
            agent_profiles: HashMap::new(),
            action_risks,
        }
    }

    pub fn evaluate(&self, action: &str, scope: &str, agent_id: &str) -> RiskLevel {
        let base_risk = self.action_risks.get(action).cloned().unwrap_or(RiskLevel::Medium);

        let mut risk = base_risk.clone();

        if let Some(profile) = self.agent_profiles.get(agent_id) {
            if profile.recent_denials > 3 {
                risk = escalate(risk);
            }
            if matches!(profile.last_risk, RiskLevel::High | RiskLevel::Critical) {
                risk = escalate(risk);
            }
        }

        if scope == "*" || scope.is_empty() {
            risk = escalate(risk);
        }

        risk
    }

    pub fn record_denial(&mut self, agent_id: &str) {
        let profile = self
            .agent_profiles
            .entry(agent_id.to_string())
            .or_insert(AgentRiskProfile {
                last_risk: RiskLevel::Low,
                recent_denials: 0,
            });
        profile.recent_denials = (profile.recent_denials + 1).min(10);
        profile.last_risk = RiskLevel::High;
    }

    pub fn record_grant(&mut self, agent_id: &str, risk: RiskLevel) {
        let profile = self
            .agent_profiles
            .entry(agent_id.to_string())
            .or_insert(AgentRiskProfile {
                last_risk: RiskLevel::Low,
                recent_denials: 0,
            });
        profile.recent_denials = 0;
        profile.last_risk = risk;
    }
}

fn escalate(risk: RiskLevel) -> RiskLevel {
    match risk {
        RiskLevel::Low => RiskLevel::Medium,
        RiskLevel::Medium => RiskLevel::High,
        RiskLevel::High => RiskLevel::Critical,
        RiskLevel::Critical => RiskLevel::Critical,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn risk_engine_returns_base_risk() {
        let engine = RiskEngine::new();
        let risk = engine.evaluate("project.read", "/projects/demo", "agent-01");
        assert_eq!(risk, RiskLevel::Low);
    }

    #[test]
    fn risk_engine_escalates_high_risk_actions() {
        let engine = RiskEngine::new();
        let risk = engine.evaluate("filesystem.write", "/etc/passwd", "agent-01");
        assert_eq!(risk, RiskLevel::High);
    }

    #[test]
    fn risk_engine_escalates_global_scope() {
        let engine = RiskEngine::new();
        let risk = engine.evaluate("project.read", "*", "agent-01");
        assert_eq!(risk, RiskLevel::Medium);
    }

    #[test]
    fn risk_engine_records_denial() {
        let mut engine = RiskEngine::new();
        engine.record_denial("agent-01");
        assert_eq!(engine.agent_profiles["agent-01"].recent_denials, 1);
    }

    #[test]
    fn risk_engine_grants_unknown_action_as_medium() {
        let engine = RiskEngine::new();
        let risk = engine.evaluate("unknown.action", "/some/path", "agent-01");
        assert_eq!(risk, RiskLevel::Medium);
    }
}
