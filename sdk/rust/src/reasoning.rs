use crate::AlpError;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReasoningStep {
    pub step_id: String,
    pub agent_id: String,
    pub thought: String,
    pub action: String,
    pub observation: Option<String>,
    pub confidence: f64,
    pub dependencies: Vec<String>,
    pub timestamp: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReasoningChain {
    pub chain_id: String,
    pub goal: String,
    pub steps: Vec<ReasoningStep>,
    pub created_at: String,
    pub status: String,
    pub result: Option<String>,
}

pub struct ReasoningTracer {
    chains: HashMap<String, ReasoningChain>,
    step_counter: usize,
}

impl ReasoningTracer {
    pub fn new() -> Self {
        Self {
            chains: HashMap::new(),
            step_counter: 0,
        }
    }

    pub fn create_chain(&mut self, goal: &str) -> ReasoningChain {
        let chain_id = format!(
            "chain-{}-{}",
            chrono::Utc::now().timestamp_millis(),
            rand_suffix(5)
        );
        let chain = ReasoningChain {
            chain_id: chain_id.clone(),
            goal: goal.to_string(),
            steps: Vec::new(),
            created_at: chrono::Utc::now().to_rfc3339(),
            status: "draft".to_string(),
            result: None,
        };
        self.chains.insert(chain_id.clone(), chain.clone());
        chain
    }

    pub fn add_step(
        &mut self,
        chain_id: &str,
        input: &ReasoningStep,
    ) -> Result<ReasoningStep, AlpError> {
        let chain = self
            .chains
            .get_mut(chain_id)
            .ok_or_else(|| AlpError::new(format!("Reasoning chain '{}' not found", chain_id)))?;
        if chain.status != "executing" {
            chain.status = "executing".to_string();
        }
        self.step_counter += 1;
        let step = ReasoningStep {
            step_id: format!("step-{}-{}", chain_id, self.step_counter),
            agent_id: input.agent_id.clone(),
            thought: input.thought.clone(),
            action: input.action.clone(),
            observation: input.observation.clone(),
            confidence: input.confidence,
            dependencies: input.dependencies.clone(),
            timestamp: chrono::Utc::now().to_rfc3339(),
        };
        chain.steps.push(step.clone());
        Ok(step)
    }

    pub fn complete_chain(
        &mut self,
        chain_id: &str,
        result: &str,
    ) -> Result<ReasoningChain, AlpError> {
        let chain = self
            .chains
            .get_mut(chain_id)
            .ok_or_else(|| AlpError::new(format!("Reasoning chain '{}' not found", chain_id)))?;
        chain.status = "completed".to_string();
        chain.result = Some(result.to_string());
        Ok(chain.clone())
    }

    pub fn fail_chain(&mut self, chain_id: &str, reason: &str) -> Result<ReasoningChain, AlpError> {
        let chain = self
            .chains
            .get_mut(chain_id)
            .ok_or_else(|| AlpError::new(format!("Reasoning chain '{}' not found", chain_id)))?;
        chain.status = "failed".to_string();
        chain.result = Some(reason.to_string());
        Ok(chain.clone())
    }

    pub fn get_chain(&self, chain_id: &str) -> Option<&ReasoningChain> {
        self.chains.get(chain_id)
    }

    pub fn get_steps_by_agent(&self, agent_id: &str) -> Vec<&ReasoningStep> {
        let mut steps = Vec::new();
        for chain in self.chains.values() {
            for step in &chain.steps {
                if step.agent_id == agent_id {
                    steps.push(step);
                }
            }
        }
        steps
    }
}

fn rand_suffix(n: usize) -> String {
    const CHARS: &[u8] = b"abcdefghijklmnopqrstuvwxyz0123456789";
    let mut s = String::with_capacity(n);
    for _ in 0..n {
        let idx = (chrono::Utc::now().timestamp_millis() as usize) % CHARS.len();
        s.push(CHARS[idx] as char);
    }
    s
}
