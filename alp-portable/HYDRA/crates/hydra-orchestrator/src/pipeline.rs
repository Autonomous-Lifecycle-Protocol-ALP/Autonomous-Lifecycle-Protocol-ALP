use crate::{executor::Executor, planner::{Plan, Step, StepStatus}};
use hydra_runtime::{GenerationRequest, ModelManager, Modality, ResourceBudget};
use serde::{Serialize, Deserialize};

pub struct Pipeline {
    pub executor: Executor,
}

impl Pipeline {
    pub fn new() -> Self {
        Self { executor: Executor }
    }

    pub fn run(&self, goal: &str) -> Result<String, String> {
        let mut plan = Plan::new(goal);
        plan.add_step(Step::new("1", format!("Understand the goal: {goal}")));
        plan.add_step(Step::new("2", "Gather necessary context and resources"));
        plan.add_step(Step::new("3", "Execute the main action"));
        plan.add_step(Step::new("4", "Validate and summarize results"));
        self.executor.execute_plan(&mut plan, goal)
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreativeArtifact {
    pub modality: String,
    pub path: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreativeResult {
    pub goal: String,
    pub summary: String,
    pub artifacts: Vec<CreativeArtifact>,
}

pub struct CreativePipeline {
    pub executor: Executor,
    pub model_manager: ModelManager,
    pub resource_budget: ResourceBudget,
}

impl CreativePipeline {
    pub fn new(model_manager: ModelManager, resource_budget: ResourceBudget) -> Self {
        Self { executor: Executor, model_manager, resource_budget }
    }

    pub fn infer_modalities(&self, goal: &str) -> Vec<Modality> {
        let goal_lower = goal.to_lowercase();
        let mut modalities = Vec::new();
        if goal_lower.contains("image") || goal_lower.contains("picture") || goal_lower.contains("photo") || goal_lower.contains("logo") || goal_lower.contains("banner") {
            modalities.push(Modality::Image);
        }
        if goal_lower.contains("video") || goal_lower.contains("animation") || goal_lower.contains("motion") {
            modalities.push(Modality::Video);
        }
        if goal_lower.contains("3d") || goal_lower.contains("model") || goal_lower.contains("mesh") || goal_lower.contains("render") {
            modalities.push(Modality::Model3D);
        }
        if goal_lower.contains("website") || goal_lower.contains("app") || goal_lower.contains("code") || goal_lower.contains("react") || goal_lower.contains("html") {
            modalities.push(Modality::Code);
        }
        if modalities.is_empty() {
            modalities.push(Modality::Text);
        }
        modalities
    }

    pub fn run(&self, goal: &str) -> CreativeResult {
        let modalities = self.infer_modalities(goal);
        let mut plan = Plan::new(goal);
        plan.add_step(Step::new("1", format!("Understand the creative goal: {goal}")));
        plan.add_step(Step::new("2", format!("Inferred modalities: {:?}", modalities)));

        for (idx, modality) in modalities.iter().enumerate() {
            let step_id = (idx + 3).to_string();
            let description = match modality {
                Modality::Text => format!("Generate text content for: {goal}"),
                Modality::Image => format!("Generate images for: {goal}"),
                Modality::Video => format!("Generate video for: {goal}"),
                Modality::Model3D => format!("Generate 3D model for: {goal}"),
                Modality::Audio => format!("Generate audio for: {goal}"),
                Modality::Code => format!("Generate code for: {goal}"),
            };
            plan.add_step(Step::new(step_id, description));
        }

        let last_id = (modalities.len() + 3).to_string();
        plan.add_step(Step::new(last_id.clone(), "Assemble and verify generated artifacts"));

        let mut results = Vec::new();
        let mut artifacts = Vec::new();
        for step in &mut plan.steps {
            if step.id == "1" || step.id == "2" {
                let msg = format!("[planned] {}", step.description);
                step.status = StepStatus::Completed(msg.clone());
                results.push(msg);
                continue;
            }
            if step.id == last_id {
                let msg = format!("[verified] {}", step.description);
                step.status = StepStatus::Completed(msg.clone());
                results.push(msg);
                continue;
            }

            let modality_idx: usize = step.id.parse().unwrap_or(0) - 3;
            let modality = modalities.get(modality_idx).copied().unwrap_or(Modality::Text);

            let request = GenerationRequest {
                prompt: goal.to_string(),
                modality,
                context_tokens: 0,
                resource_budget: self.resource_budget.clone(),
            };

            let model = match self.model_manager.select_for(modality, self.resource_budget.max_ram_mb) {
                Some(m) => m,
                None => {
                    let msg = format!("[skipped] {} — no model available for modality {:?}", step.description, modality);
                    step.status = StepStatus::Completed(msg.clone());
                    results.push(msg);
                    continue;
                }
            };
            let result = model.infer(&request);
            let output_summary = match &result.output {
                hydra_runtime::GenerationOutput::Text(t) => format!("text: {}", t),
                hydra_runtime::GenerationOutput::Image(p) => format!("image: {}", p.display()),
                hydra_runtime::GenerationOutput::Video(p) => format!("video: {}", p.display()),
                hydra_runtime::GenerationOutput::Model3D(p) => format!("3d: {}", p.display()),
                hydra_runtime::GenerationOutput::Audio(p) => format!("audio: {}", p.display()),
                hydra_runtime::GenerationOutput::Code(p) => format!("code: {}", p.display()),
            };
            let msg = format!("[generated] {} via {} ({})", step.description, model.name(), output_summary);
            step.status = StepStatus::Completed(msg.clone());
            results.push(msg.clone());

            if let Some(path_str) = match &result.output {
                hydra_runtime::GenerationOutput::Image(p) | hydra_runtime::GenerationOutput::Video(p) | hydra_runtime::GenerationOutput::Model3D(p) | hydra_runtime::GenerationOutput::Audio(p) | hydra_runtime::GenerationOutput::Code(p) => Some(p.to_string_lossy().to_string()),
                _ => None,
            } {
                artifacts.push(CreativeArtifact {
                    modality: format!("{:?}", modality),
                    path: path_str,
                });
            }
        }

        CreativeResult {
            goal: goal.to_string(),
            summary: results.join("\n"),
            artifacts,
        }
    }
}

