use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RouteContext {
    pub task_type: TaskType,
    pub complexity: f32,
    pub context_tokens: u32,
    pub available_ram_mb: u64,
    pub cpu_threads: u32,
    pub latency_target_ms: Option<u64>,
    pub cost_budget: Option<f64>,
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize, PartialEq, Eq, Hash)]
pub enum TaskType {
    Simple,
    Coding,
    Reasoning,
    Vision,
    Voice,
    Security,
    Data,
    Hardware,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RouteDecision {
    pub model_id: String,
    pub backend: String,
    pub reason: String,
    pub estimated_latency_ms: u64,
    pub estimated_cost: Option<f64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModelProfile {
    pub id: String,
    pub backend: String,
    pub task_types: Vec<TaskType>,
    pub min_ram_mb: u64,
    pub max_context_tokens: u32,
    pub latency_ms: u64,
    pub cost_per_1k_tokens: Option<f64>,
    pub priority: u32,
}

pub struct Router {
    models: Vec<ModelProfile>,
}

impl Router {
    pub fn new() -> Self {
        Self { models: Vec::new() }
    }

    pub fn register(&mut self, profile: ModelProfile) {
        self.models.push(profile);
    }

    pub fn route(&self, context: &RouteContext) -> Option<RouteDecision> {
        let mut candidates: Vec<_> = self.models.iter().filter(|m| {
            context.available_ram_mb >= m.min_ram_mb
                && context.context_tokens <= m.max_context_tokens
                && (m.task_types.is_empty() || m.task_types.contains(&context.task_type))
        }).collect();

        if candidates.is_empty() {
            return None;
        }

        candidates.sort_by(|a, b| {
            let a_cost = a.cost_per_1k_tokens.unwrap_or(f64::MAX);
            let b_cost = b.cost_per_1k_tokens.unwrap_or(f64::MAX);
            a_cost.partial_cmp(&b_cost).unwrap_or(std::cmp::Ordering::Equal)
                .then_with(|| a.latency_ms.cmp(&b.latency_ms))
                .then_with(|| b.priority.cmp(&a.priority))
        });

        let chosen = candidates[0];
        let estimated_cost = chosen.cost_per_1k_tokens.map(|c| c * (context.context_tokens as f64 / 1000.0));

        Some(RouteDecision {
            model_id: chosen.id.clone(),
            backend: chosen.backend.clone(),
            reason: format!("best fit for {:?} with {}MB RAM", context.task_type, context.available_ram_mb),
            estimated_latency_ms: chosen.latency_ms,
            estimated_cost,
        })
    }
}

impl Default for Router {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn router_selects_cheapest_valid_model() {
        let mut router = Router::new();
        router.register(ModelProfile {
            id: "fast-cpu".into(),
            backend: "llama.cpp".into(),
            task_types: vec![TaskType::Simple],
            min_ram_mb: 2048,
            max_context_tokens: 4096,
            latency_ms: 500,
            cost_per_1k_tokens: Some(0.01),
            priority: 1,
        });
        router.register(ModelProfile {
            id: "deep-model".into(),
            backend: "llama.cpp".into(),
            task_types: vec![TaskType::Reasoning],
            min_ram_mb: 16384,
            max_context_tokens: 32768,
            latency_ms: 3000,
            cost_per_1k_tokens: Some(0.10),
            priority: 2,
        });

        let ctx = RouteContext {
            task_type: TaskType::Simple,
            complexity: 0.3,
            context_tokens: 1024,
            available_ram_mb: 4096,
            cpu_threads: 4,
            latency_target_ms: Some(2000),
            cost_budget: Some(0.05),
        };

        let decision = router.route(&ctx).expect("expected a route");
        assert_eq!(decision.model_id, "fast-cpu");
    }

    #[test]
    fn router_returns_none_when_ram_insufficient() {
        let mut router = Router::new();
        router.register(ModelProfile {
            id: "big-model".into(),
            backend: "llama.cpp".into(),
            task_types: vec![TaskType::Coding],
            min_ram_mb: 16384,
            max_context_tokens: 16384,
            latency_ms: 1000,
            cost_per_1k_tokens: Some(0.05),
            priority: 1,
        });

        let ctx = RouteContext {
            task_type: TaskType::Coding,
            complexity: 0.8,
            context_tokens: 8192,
            available_ram_mb: 4096,
            cpu_threads: 4,
            latency_target_ms: None,
            cost_budget: None,
        };

        assert!(router.route(&ctx).is_none());
    }
}
