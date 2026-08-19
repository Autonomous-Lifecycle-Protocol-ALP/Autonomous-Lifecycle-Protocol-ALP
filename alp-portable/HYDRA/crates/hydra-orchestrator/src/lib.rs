pub mod planner;
pub mod executor;
pub mod pipeline;
pub mod planning_agent;
pub mod tools;

pub use pipeline::{CreativeArtifact, CreativePipeline, CreativeResult, Pipeline};
pub use planning_agent::{OrchestratorResult, PlanGenerator, PlanningAgent, StaticGenerator};
pub use tools::{CreativePlanGenerator, CreativeTool};

#[cfg(test)]
mod tests {
    use super::*;
    use crate::executor::Executor;
    use crate::planner::{Plan, Step, StepStatus};

    #[test]
    fn pipeline_runs_steps() {
        let pipeline = Pipeline::new();
        let result = pipeline.run("demo goal");
        assert!(result.is_ok());
        let output = result.unwrap();
        assert!(output.contains("Understand the goal"));
        assert!(output.contains("Execute the main action"));
    }

    #[test]
    fn planner_creates_steps() {
        let mut plan = Plan::new("test");
        plan.add_step(Step::new("1", "first step"));
        plan.add_step(Step::new("2", "second step"));
        assert_eq!(plan.steps.len(), 2);
        assert_eq!(plan.steps[0].status, StepStatus::Pending);
    }

    #[test]
    fn executor_completes_step() {
        let executor = Executor;
        let mut step = Step::new("1", "do something");
        let result = executor.execute_step(&mut step, "context");
        assert!(result.is_ok());
        match step.status {
            StepStatus::Completed(_) => {}
            _ => panic!("expected completed"),
        }
    }

    #[test]
    fn creative_pipeline_infers_image_modality() {
        let manager = hydra_runtime::ModelManager::new();
        let budget = hydra_runtime::ResourceBudget { max_ram_mb: 4096, max_cpu_percent: 80, timeout_seconds: 60 };
        let pipeline = CreativePipeline::new(manager, budget);
        let modalities = pipeline.infer_modalities("Create a logo and banner");
        assert!(modalities.contains(&hydra_runtime::Modality::Image));
    }

    #[test]
    fn creative_pipeline_infers_3d_and_code_modality() {
        let manager = hydra_runtime::ModelManager::new();
        let budget = hydra_runtime::ResourceBudget { max_ram_mb: 4096, max_cpu_percent: 80, timeout_seconds: 60 };
        let pipeline = CreativePipeline::new(manager, budget);
        let modalities = pipeline.infer_modalities("Design a 3D model for a website");
        assert!(modalities.contains(&hydra_runtime::Modality::Model3D));
        assert!(modalities.contains(&hydra_runtime::Modality::Code));
    }

    #[test]
    fn creative_pipeline_runs_generation() {
        let mut manager = hydra_runtime::ModelManager::new();
        manager.register(hydra_runtime::ModelAdapter::new(
            "text-model",
            "llama.cpp",
            None,
            hydra_runtime::Modality::Text,
        ));
        let budget = hydra_runtime::ResourceBudget { max_ram_mb: 4096, max_cpu_percent: 80, timeout_seconds: 60 };
        let pipeline = CreativePipeline::new(manager, budget);
        let result = pipeline.run("Write a hello world program");
        assert!(result.summary.contains("[planned]"));
        assert!(result.summary.contains("[generated]"));
    }
}
