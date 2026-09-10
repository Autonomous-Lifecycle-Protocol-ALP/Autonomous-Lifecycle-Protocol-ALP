use crate::{planning_agent::PlanGenerator, pipeline::CreativePipeline};
use async_trait::async_trait;
use hydra_agents::PlanStep;
use hydra_runtime::Modality;
use hydra_tools::{Tool, ToolManifest, ToolRequest, ToolResult};
use serde_json::{json, Value};
use std::sync::Arc;

pub struct CreativeTool {
    pipeline: Arc<CreativePipeline>,
}

impl CreativeTool {
    pub fn new(pipeline: Arc<CreativePipeline>) -> Self {
        Self { pipeline }
    }

    pub fn pipeline(&self) -> &Arc<CreativePipeline> {
        &self.pipeline
    }
}

#[async_trait]
impl Tool for CreativeTool {
    fn name(&self) -> &str {
        "creative.generate"
    }

    fn manifest(&self) -> ToolManifest {
        ToolManifest {
            name: "creative.generate".into(),
            version: "1.0.0".into(),
            capabilities: vec!["creative.generate".into()],
            risk: "low".into(),
            sandbox_required: false,
        }
    }

    async fn execute(&self, request: ToolRequest) -> ToolResult {
        let goal: String = request
            .params
            .get("goal")
            .and_then(|v| v.as_str())
            .map(|s| s.to_string())
            .unwrap_or_default();

        if goal.is_empty() {
            return ToolResult::err("creative.generate requires a 'goal' parameter".into());
        }

        let pipeline = self.pipeline.clone();
        let blocking = tokio::task::spawn_blocking(move || pipeline.run(&goal));

        match blocking.await {
            Ok(creative_result) => ToolResult::ok(json!({
                "goal": creative_result.goal,
                "summary": creative_result.summary,
                "artifacts": creative_result.artifacts.iter().map(|a| {
                    json!({ "modality": a.modality, "path": a.path })
                }).collect::<Vec<Value>>(),
            })),
            Err(_) => ToolResult::err("creative pipeline execution was cancelled".into()),
        }
    }
}

pub struct CreativePlanGenerator {
    pipeline: Arc<CreativePipeline>,
}

impl CreativePlanGenerator {
    pub fn new(pipeline: Arc<CreativePipeline>) -> Self {
        Self { pipeline }
    }
}

impl PlanGenerator for CreativePlanGenerator {
    fn generate(&self, goal: &str) -> Vec<PlanStep> {
        let modalities = self.pipeline.infer_modalities(goal);

        let mut steps = Vec::new();
        steps.push(PlanStep {
            description: format!("Analyze and plan for: {goal}"),
            tool: "creative.generate".into(),
            params: json!({ "goal": goal }),
        });

        for modality in &modalities {
            let desc = match modality {
                Modality::Text => format!("Generate text content for: {goal}"),
                Modality::Image => format!("Generate image for: {goal}"),
                Modality::Video => format!("Generate video for: {goal}"),
                Modality::Model3D => format!("Generate 3D model for: {goal}"),
                Modality::Audio => format!("Generate audio for: {goal}"),
                Modality::Code => format!("Generate code for: {goal}"),
            };
            steps.push(PlanStep {
                description: desc,
                tool: "creative.generate".into(),
                params: json!({ "goal": goal, "modality": format!("{:?}", modality) }),
            });
        }

        steps.push(PlanStep {
            description: format!("Verify and assemble artifacts for: {goal}"),
            tool: "creative.generate".into(),
            params: json!({ "goal": goal }),
        });

        steps
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::pipeline::CreativePipeline;
    use hydra_runtime::{ModelAdapter, ModelManager, Modality, ResourceBudget};

    fn test_pipeline() -> Arc<CreativePipeline> {
        let mut manager = ModelManager::new();
        let mut adapter = ModelAdapter::new("test-model", "local", None, Modality::Text);
        adapter.loaded = true;
        manager.register(adapter);
        let budget = ResourceBudget {
            max_ram_mb: 4096,
            max_cpu_percent: 80,
            timeout_seconds: 60,
        };
        Arc::new(CreativePipeline::new(manager, budget))
    }

    #[tokio::test]
    async fn creative_tool_executes_goal() {
        let pipeline = test_pipeline();
        let tool = CreativeTool::new(pipeline);

        let result = tool
            .execute(ToolRequest {
                tool: "creative.generate".into(),
                params: json!({ "goal": "Write a hello world program" }),
            })
            .await;

        assert!(result.success);
        assert_eq!(result.output["goal"], "Write a hello world program");
        assert!(result.output["summary"].as_str().unwrap().contains("[generated]"));
        assert!(result.output["summary"].as_str().unwrap().contains("[planned]"));
        let artifacts = result.output["artifacts"].as_array().unwrap();
        assert_eq!(artifacts.len(), 0); // Text modality produces no file artifacts
    }

    #[tokio::test]
    async fn creative_tool_requires_goal() {
        let pipeline = test_pipeline();
        let tool = CreativeTool::new(pipeline);

        let result = tool
            .execute(ToolRequest {
                tool: "creative.generate".into(),
                params: json!({}),
            })
            .await;

        assert!(!result.success);
        assert!(result.error.unwrap().contains("goal"));
    }

    #[test]
    fn creative_plan_generator_creates_steps() {
        let pipeline = test_pipeline();
        let generator = CreativePlanGenerator::new(pipeline);

        let steps = generator.generate("Create a logo for my startup");

        assert_eq!(steps.len(), 3);
        assert!(steps[0].description.contains("Analyze"));
        assert_eq!(steps[0].tool, "creative.generate");
        assert!(steps[1].description.contains("image"));
        assert!(steps[2].description.contains("Verify"));
    }

    #[test]
    fn creative_plan_generator_defaults_to_text() {
        let pipeline = test_pipeline();
        let generator = CreativePlanGenerator::new(pipeline);

        let steps = generator.generate("Just some text here");

        let modalities: Vec<&str> = steps
            .iter()
            .filter(|s| s.params.get("modality").is_some())
            .map(|s| s.params["modality"].as_str().unwrap())
            .collect();
        assert_eq!(modalities, vec!["Text"]);
    }
}
