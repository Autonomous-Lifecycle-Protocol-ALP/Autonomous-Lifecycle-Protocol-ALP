mod support;

use async_trait::async_trait;
use hydra_agents::{AgentType, PlanStep};
use hydra_orchestrator::{CreativePlanGenerator, CreativePipeline, CreativeTool, PlanningAgent};
use hydra_runtime::{ModelAdapter, ModelManager, Modality, ResourceBudget};
use hydra_tools::{Tool, ToolManifest, ToolRegistry, ToolRequest, ToolResult};
use serde_json::json;
use std::sync::atomic::{AtomicUsize, Ordering};
use std::sync::Arc;
use tokio::sync::RwLock;

struct FlakyMockTool {
    call_count: Arc<AtomicUsize>,
    fail_first: usize,
}

#[async_trait]
impl Tool for FlakyMockTool {
    fn name(&self) -> &str {
        "test.tool"
    }

    fn manifest(&self) -> ToolManifest {
        ToolManifest {
            name: "test.tool".into(),
            version: "1.0.0".into(),
            capabilities: vec!["test.tool".into()],
            risk: "low".into(),
            sandbox_required: false,
        }
    }

    async fn execute(&self, request: ToolRequest) -> ToolResult {
        let n = self.call_count.fetch_add(1, Ordering::SeqCst);
        if n < self.fail_first {
            ToolResult::err("flaky failure".into())
        } else {
            ToolResult::ok(json!({
                "tool": request.tool,
                "params": request.params,
            }))
        }
    }
}

fn creative_pipeline() -> Arc<CreativePipeline> {
    let mut manager = ModelManager::new();
    let mut adapter = ModelAdapter::new("text-model", "local", None, Modality::Text);
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
async fn orchestrator_spawns_and_executes_plan() {
    let kernel = Arc::new(RwLock::new(support::kernel_with_capabilities(&["test.tool"])));
    let mut registry = ToolRegistry::new();
    registry.register(FlakyMockTool {
        call_count: Arc::new(AtomicUsize::new(0)),
        fail_first: 0,
    });

    let step = PlanStep {
        description: "execute step".into(),
        tool: "test.tool".into(),
        params: json!({ "description": "step 1" }),
    };
    let generator = Box::new(hydra_orchestrator::StaticGenerator::new(vec![step]));
    let mut orchestrator = PlanningAgent::new(kernel, registry, generator, 3);
    orchestrator.spawn_head(AgentType::Developer);

    assert_eq!(orchestrator.agent_count(), 1);

    let result = orchestrator.execute("test goal").await;
    assert!(result.success);
    assert_eq!(result.attempts, 1);
    assert_eq!(result.result.outputs.len(), 1);
}

#[tokio::test]
async fn orchestrator_replans_on_failure() {
    let kernel = Arc::new(RwLock::new(support::kernel_with_capabilities(&["test.tool"])));
    let call_count = Arc::new(AtomicUsize::new(0));
    let mut registry = ToolRegistry::new();
    registry.register(FlakyMockTool {
        call_count: call_count.clone(),
        fail_first: 1,
    });

    let step = PlanStep {
        description: "execute flaky step".into(),
        tool: "test.tool".into(),
        params: json!({ "description": "flaky" }),
    };
    let generator = Box::new(hydra_orchestrator::StaticGenerator::new(vec![step]));
    let mut orchestrator = PlanningAgent::new(kernel, registry, generator, 3);
    orchestrator.spawn_head(AgentType::Developer);

    let result = orchestrator.execute("test goal").await;
    assert!(result.success);
    assert_eq!(result.attempts, 2);
    assert_eq!(call_count.load(Ordering::SeqCst), 2);
}

#[tokio::test]
async fn orchestrator_finds_developer_head() {
    let kernel = Arc::new(RwLock::new(support::kernel_with_capabilities(&["test.tool"])));
    let registry = ToolRegistry::new();
    let generator = Box::new(hydra_orchestrator::StaticGenerator::new(vec![]));
    let mut orchestrator = PlanningAgent::new(kernel, registry, generator, 3);

    orchestrator.spawn_head(AgentType::Qa);
    orchestrator.spawn_head(AgentType::Developer);

    let dev = orchestrator.find_agent_for(AgentType::Developer);
    assert!(dev.is_some());
    assert_eq!(dev.unwrap().spec.agent_type, AgentType::Developer);

    let qa = orchestrator.find_agent_for(AgentType::Qa);
    assert!(qa.is_some());
}

#[tokio::test]
async fn orchestrator_fails_when_no_head() {
    let kernel = Arc::new(RwLock::new(support::kernel_with_capabilities(&["test.tool"])));
    let registry = ToolRegistry::new();
    let generator = Box::new(hydra_orchestrator::StaticGenerator::new(vec![]));
    let mut orchestrator = PlanningAgent::new(kernel, registry, generator, 3);

    let result = orchestrator.execute("no heads").await;
    assert!(!result.success);
    assert_eq!(result.attempts, 0);
    assert!(result
        .result
        .error
        .as_deref()
        .unwrap()
        .contains("no developer"));
}

#[tokio::test]
async fn end_to_end_creative_pipeline_through_planning_agent() {
    let pipeline = creative_pipeline();

    let mut registry = ToolRegistry::new();
    registry.register(CreativeTool::new(pipeline.clone()));

    let kernel = Arc::new(RwLock::new(support::kernel_with_capabilities(&["creative.generate"])));
    let generator = Box::new(CreativePlanGenerator::new(pipeline));
    let mut orchestrator = PlanningAgent::new(kernel, registry, generator, 2);

    orchestrator.spawn_head(AgentType::Developer);
    assert_eq!(orchestrator.agent_count(), 1);

    let result = orchestrator.execute("Write a hello world program").await;
    assert!(result.success, "end-to-end creative execution should succeed");
    assert!(result.attempts >= 1);
    assert!(result.attempts <= 3); // 1 success + up to 2 retries
    assert!(result.result.outputs.len() >= 1);
    assert!(result.result.error.is_none());

    let first_output = &result.result.outputs[0];
    assert!(first_output.success);
    assert_eq!(first_output.output["goal"], "Write a hello world program");
}
