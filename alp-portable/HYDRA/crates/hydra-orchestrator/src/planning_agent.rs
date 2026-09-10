use hydra_agents::{Agent, AgentSpec, AgentType, PlanStep, ResourceBudget, TaskResult};
use hydra_security::SecurityKernel;
use hydra_tools::{ToolRegistry, ToolResult};
use std::sync::Arc;
use tokio::sync::RwLock;

pub struct OrchestratorResult {
    pub task_id: String,
    pub success: bool,
    pub attempts: usize,
    pub result: TaskResult,
}

pub trait PlanGenerator: Send + Sync {
    fn generate(&self, goal: &str) -> Vec<PlanStep>;
}

pub struct StaticGenerator {
    steps: Vec<PlanStep>,
}

impl StaticGenerator {
    pub fn new(steps: Vec<PlanStep>) -> Self {
        Self { steps }
    }
}

impl PlanGenerator for StaticGenerator {
    fn generate(&self, _goal: &str) -> Vec<PlanStep> {
        self.steps.clone()
    }
}

pub struct PlanningAgent {
    security: Arc<RwLock<SecurityKernel>>,
    tool_registry: ToolRegistry,
    generator: Box<dyn PlanGenerator>,
    max_retries: usize,
    agents: Vec<Agent>,
    next_id: usize,
}

impl PlanningAgent {
    pub fn new(
        security: Arc<RwLock<SecurityKernel>>,
        tools: ToolRegistry,
        generator: Box<dyn PlanGenerator>,
        max_retries: usize,
    ) -> Self {
        Self {
            security,
            tool_registry: tools,
            generator,
            max_retries,
            agents: Vec::new(),
            next_id: 0,
        }
    }

    pub fn with_max_retries(mut self, retries: usize) -> Self {
        self.max_retries = retries;
        self
    }

    pub fn agent_count(&self) -> usize {
        self.agents.len()
    }

    pub fn find_agent_for(&self, agent_type: AgentType) -> Option<&Agent> {
        self.agents
            .iter()
            .find(|a| a.spec.agent_type == agent_type)
    }

    pub fn spawn_head(&mut self, agent_type: AgentType) -> &Agent {
        let id = format!("agent-{}", self.next_id);
        self.next_id += 1;
        let spec = AgentSpec {
            id: id.clone(),
            agent_type: agent_type.clone(),
            model: "coding-medium".to_string(),
            skills: agent_type
                .default_skills()
                .iter()
                .map(|s| s.to_string())
                .collect(),
            capabilities: agent_type
                .default_capabilities()
                .iter()
                .map(|s| s.to_string())
                .collect(),
            resource_budget: Some(ResourceBudget {
                cpu_limit: 4,
                memory_mb: 8192,
                disk_mb: 10240,
                network_enabled: false,
            }),
        };
        let agent = Agent::with_tools(spec, self.security.clone(), self.tool_registry.clone());
        self.agents.push(agent);
        self.agents.last().unwrap()
    }

    pub async fn execute(&mut self, goal: &str) -> OrchestratorResult {
        let task_id = self.security.read().await.task_id();

        for attempt in 0..=self.max_retries {
            let steps = self.generator.generate(goal);

            if let Some(idx) = self.find_developer_index() {
                let result = self.execute_plan_on(idx, steps).await;
                let attempts = attempt + 1;
                if result.success {
                    return OrchestratorResult {
                        task_id: task_id.clone(),
                        success: true,
                        attempts,
                        result,
                    };
                }
                if attempt < self.max_retries {
                    continue;
                }
                return OrchestratorResult {
                    task_id,
                    success: false,
                    attempts,
                    result,
                };
            }
        }

        OrchestratorResult {
            task_id,
            success: false,
            attempts: 0,
            result: TaskResult {
                task_id: "planning-agent".to_string(),
                success: false,
                outputs: vec![],
                error: Some("no developer head available".into()),
            },
        }
    }

    fn find_developer_index(&self) -> Option<usize> {
        self.agents
            .iter()
            .position(|a| a.spec.agent_type == AgentType::Developer)
    }

    async fn execute_plan_on(&mut self, idx: usize, steps: Vec<PlanStep>) -> TaskResult {
        let agent = &mut self.agents[idx];
        let task_id = agent.spec.id.clone();
        let mut outputs: Vec<ToolResult> = Vec::new();
        let mut errors: Vec<String> = Vec::new();

        for step in steps {
            match agent.execute_tool(&step.tool, step.params).await {
                Some(r) if r.success => outputs.push(r),
                Some(r) => errors.push(format!(
                    "Step '{}' failed: {}",
                    step.description,
                    r.error.unwrap_or_default()
                )),
                None => errors.push(format!(
                    "Step '{}' was blocked by security",
                    step.description
                )),
            }
        }

        TaskResult {
            task_id,
            success: errors.is_empty(),
            outputs,
            error: if errors.is_empty() {
                None
            } else {
                Some(errors.join("; "))
            },
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use async_trait::async_trait;
    use hydra_capabilities::{Capability, RiskLevel};
    use hydra_security::{Policy, PolicyEffect, PolicyRule};
    use hydra_tools::{Tool, ToolManifest, ToolRequest};
    use serde_json::json;
    use std::sync::atomic::{AtomicUsize, Ordering};

    struct MockTool {
        name: String,
        call_count: Arc<AtomicUsize>,
        fail_first_n: usize,
    }

    impl MockTool {
        fn new(name: &str, fail_first_n: usize) -> Self {
            Self {
                name: name.to_string(),
                call_count: Arc::new(AtomicUsize::new(0)),
                fail_first_n,
            }
        }
    }

    #[async_trait]
    impl Tool for MockTool {
        fn name(&self) -> &str {
            &self.name
        }

        fn manifest(&self) -> ToolManifest {
            ToolManifest {
                name: self.name.clone(),
                version: "1.0.0".into(),
                capabilities: vec![self.name.clone()],
                risk: "low".into(),
                sandbox_required: false,
            }
        }

        async fn execute(&self, request: ToolRequest) -> ToolResult {
            let count = self.call_count.fetch_add(1, Ordering::SeqCst);
            if count < self.fail_first_n {
                ToolResult::err("flaky failure".into())
            } else {
                ToolResult::ok(json!({
                    "tool": request.tool,
                    "step": request.params.get("description").unwrap_or(&json!(null)),
                }))
            }
        }
    }

    fn kernel_with_cap(action: &str) -> SecurityKernel {
        let mut kernel = SecurityKernel::new();
        kernel
            .capability_broker
            .registry()
            .register(
                Capability::new(action.to_string(), "**".to_string(), RiskLevel::Low),
                false,
            );
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
        kernel
    }

    fn make_kernel() -> Arc<RwLock<SecurityKernel>> {
        Arc::new(RwLock::new(kernel_with_cap("test.tool")))
    }

    fn make_registry(tool: MockTool) -> ToolRegistry {
        let mut registry = ToolRegistry::new();
        registry.register(tool);
        registry
    }

    fn make_step() -> PlanStep {
        PlanStep {
            description: "run test tool".into(),
            tool: "test.tool".into(),
            params: json!({ "description": "hello" }),
        }
    }

    #[tokio::test]
    async fn spawn_head_registers_agent() {
        let kernel = make_kernel();
        let tools = ToolRegistry::new();
        let generator = Box::new(StaticGenerator::new(vec![]));
        let mut orchestrator = PlanningAgent::new(kernel, tools, generator, 3);

        orchestrator.spawn_head(AgentType::Developer);
        assert_eq!(orchestrator.agent_count(), 1);
        let agent = orchestrator.find_agent_for(AgentType::Developer).unwrap();
        assert_eq!(agent.spec.id, "agent-0");
        assert_eq!(agent.spec.agent_type, AgentType::Developer);
    }

    #[tokio::test]
    async fn spawn_head_increments_ids() {
        let kernel = make_kernel();
        let tools = ToolRegistry::new();
        let generator = Box::new(StaticGenerator::new(vec![]));
        let mut orchestrator = PlanningAgent::new(kernel, tools, generator, 3);

        orchestrator.spawn_head(AgentType::Qa);
        orchestrator.spawn_head(AgentType::Developer);
        assert_eq!(orchestrator.agent_count(), 2);
        assert_eq!(
            orchestrator.find_agent_for(AgentType::Developer).unwrap().spec.id,
            "agent-1"
        );
        assert_eq!(
            orchestrator.find_agent_for(AgentType::Qa).unwrap().spec.id,
            "agent-0"
        );
    }

    #[tokio::test]
    async fn execute_plan_succeeds_on_first_attempt() {
        let kernel = make_kernel();
        let tools = make_registry(MockTool::new("test.tool", 0));
        let step = make_step();
        let generator = Box::new(StaticGenerator::new(vec![step]));
        let mut orchestrator = PlanningAgent::new(kernel, tools, generator, 3);
        orchestrator.spawn_head(AgentType::Developer);

        let result = orchestrator.execute("do something").await;
        assert!(result.success);
        assert_eq!(result.attempts, 1);
        assert_eq!(result.result.outputs.len(), 1);
        assert!(result.result.error.is_none());
    }

    #[tokio::test]
    async fn execute_replans_on_failure_and_succeeds() {
        let kernel = make_kernel();
        let flaky = MockTool::new("test.tool", 1);
        let tools = make_registry(flaky);
        let step = make_step();
        let generator = Box::new(StaticGenerator::new(vec![step]));
        let mut orchestrator = PlanningAgent::new(kernel, tools, generator, 2);
        orchestrator.spawn_head(AgentType::Developer);

        let result = orchestrator.execute("do something").await;
        assert!(result.success, "should succeed after replan");
        assert_eq!(result.attempts, 2, "should have used 2 attempts");
        assert_eq!(result.result.outputs.len(), 1);
    }

    #[tokio::test]
    async fn execute_fails_when_retries_exhausted() {
        let kernel = make_kernel();
        let flaky = MockTool::new("test.tool", usize::MAX);
        let tools = make_registry(flaky);
        let step = make_step();
        let generator = Box::new(StaticGenerator::new(vec![step]));
        let mut orchestrator = PlanningAgent::new(kernel, tools, generator, 2);
        orchestrator.spawn_head(AgentType::Developer);

        let result = orchestrator.execute("do something").await;
        assert!(!result.success);
        assert_eq!(result.attempts, 3);
        assert!(result.result.error.is_some());
        assert_eq!(result.result.outputs.len(), 0);
    }

    #[tokio::test]
    async fn execute_fails_when_no_developer_head() {
        let kernel = make_kernel();
        let tools = ToolRegistry::new();
        let generator = Box::new(StaticGenerator::new(vec![]));
        let mut orchestrator = PlanningAgent::new(kernel, tools, generator, 3);

        let result = orchestrator.execute("do something").await;
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
    async fn with_max_retries_overrides() {
        let kernel = make_kernel();
        let tools = ToolRegistry::new();
        let generator = Box::new(StaticGenerator::new(vec![]));
        let mut orchestrator = PlanningAgent::new(kernel, tools, generator, 1);
        orchestrator = orchestrator.with_max_retries(5);
        assert_eq!(orchestrator.max_retries, 5);
    }
}
