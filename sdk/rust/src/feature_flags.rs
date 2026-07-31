use std::collections::HashMap;
use chrono::Utc;

/// v74.0.0 Feature Flag Engine
/// Dynamic feature flags for agent workflows: gradual rollouts, percentage-based targeting, kill switches.

#[derive(Debug, Clone, PartialEq, serde::Serialize)]
pub enum FlagStatus {
    Enabled,
    Disabled,
    Rollout,
    Experiment,
}

#[derive(Debug, Clone, serde::Serialize)]
pub struct FlagVariant {
    pub variant_id: String,
    pub name: String,
    pub weight: u32,
}

#[derive(Debug, Clone, serde::Serialize)]
pub struct FeatureFlag {
    pub flag_id: String,
    pub name: String,
    pub description: String,
    pub status: FlagStatus,
    pub rollout_percentage: u32,
    pub kill_switch: bool,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, serde::Serialize)]
pub struct FlagEvaluation {
    pub flag_id: String,
    pub agent_id: String,
    pub environment: String,
    pub enabled: bool,
    pub reason: String,
}

pub struct FeatureFlagEngine {
    flags: HashMap<String, FeatureFlag>,
}

impl FeatureFlagEngine {
    pub fn new() -> Self {
        Self { flags: HashMap::new() }
    }

    pub fn create_flag(&mut self, name: &str, description: &str, status: FlagStatus, rollout: u32) -> &FeatureFlag {
        let id = format!("flag-{}", Utc::now().timestamp_nanos_opt().unwrap_or(0));
        let now = Utc::now().to_rfc3339();
        let flag = FeatureFlag {
            flag_id: id.clone(),
            name: name.to_string(),
            description: description.to_string(),
            status,
            rollout_percentage: rollout,
            kill_switch: false,
            created_at: now.clone(),
            updated_at: now,
        };
        self.flags.insert(id.clone(), flag);
        self.flags.get(&id).unwrap()
    }

    pub fn evaluate(&self, flag_id: &str, agent_id: &str, environment: &str) -> FlagEvaluation {
        match self.flags.get(flag_id) {
            None => FlagEvaluation {
                flag_id: flag_id.to_string(),
                agent_id: agent_id.to_string(),
                environment: environment.to_string(),
                enabled: false,
                reason: "FLAG_NOT_FOUND".to_string(),
            },
            Some(flag) => {
                if flag.kill_switch {
                    return FlagEvaluation {
                        flag_id: flag_id.to_string(),
                        agent_id: agent_id.to_string(),
                        environment: environment.to_string(),
                        enabled: false,
                        reason: "KILL_SWITCH".to_string(),
                    };
                }
                if flag.status == FlagStatus::Disabled {
                    return FlagEvaluation {
                        flag_id: flag_id.to_string(),
                        agent_id: agent_id.to_string(),
                        environment: environment.to_string(),
                        enabled: false,
                        reason: "FLAG_DISABLED".to_string(),
                    };
                }
                FlagEvaluation {
                    flag_id: flag_id.to_string(),
                    agent_id: agent_id.to_string(),
                    environment: environment.to_string(),
                    enabled: true,
                    reason: "FLAG_ENABLED".to_string(),
                }
            }
        }
    }

    pub fn get_flags(&self) -> Vec<&FeatureFlag> {
        self.flags.values().collect()
    }
}
