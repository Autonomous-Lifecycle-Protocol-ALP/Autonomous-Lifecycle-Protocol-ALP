use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PolicyContext {
    pub context_id: String,
    pub environment: HashMap<String, String>,
    pub tags: Vec<String>,
}

pub struct PolicyLearner {
    history: Vec<PolicyContext>,
}

impl PolicyLearner {
    pub fn new() -> Self {
        Self {
            history: Vec::new(),
        }
    }

    pub fn learn(&mut self, ctx: PolicyContext) {
        self.history.push(ctx);
    }

    pub fn suggest(&self, env: &HashMap<String, String>) -> Vec<String> {
        let mut candidates = Vec::new();
        for ctx in &self.history {
            if Self::match_environment(env, &ctx.environment) {
                candidates.push(ctx.tags.join(","));
            }
        }
        Self::dedupe(candidates)
    }

    pub fn history(&self) -> Vec<PolicyContext> {
        self.history.clone()
    }

    fn match_environment(a: &HashMap<String, String>, b: &HashMap<String, String>) -> bool {
        if a.is_empty() || b.is_empty() {
            return false;
        }
        let mut matches = 0;
        for (k, v) in a {
            if b.get(k) == Some(v) {
                matches += 1;
            }
        }
        matches > 0
    }

    fn dedupe(mut input: Vec<String>) -> Vec<String> {
        input.sort();
        input.dedup();
        input
    }
}
