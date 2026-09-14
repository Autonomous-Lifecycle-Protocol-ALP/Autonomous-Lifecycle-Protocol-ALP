use hydra_tools::{ToolRegistry, ToolRequest, ToolResult};
use hydra_security::SecurityKernel;
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tokio::sync::RwLock;

#[derive(Debug, Clone, PartialEq)]
pub enum AgentType {
    Engineer,
    Security,
    DevOps,
    Data,
    Eda,
    Quantum,
    Soc,
    ThreatIntel,
    ZeroTrust,
    TestEngine,
    CodeReview,
    ReleaseManager,
    ApiDesigner,
    ArchitectureVisualizer,
    Planner,
    Qa,
    Developer,
    Custom(String),
}

impl AgentType {
    pub fn as_str(&self) -> &str {
        match self {
            AgentType::Engineer => "engineer",
            AgentType::Security => "security",
            AgentType::DevOps => "devops",
            AgentType::Data => "data",
            AgentType::Eda => "eda",
            AgentType::Quantum => "quantum",
            AgentType::Soc => "soc",
            AgentType::ThreatIntel => "threat-intel",
            AgentType::ZeroTrust => "zero-trust",
            AgentType::TestEngine => "test-engine",
            AgentType::CodeReview => "code-review",
            AgentType::ReleaseManager => "release-manager",
            AgentType::ApiDesigner => "api-designer",
            AgentType::ArchitectureVisualizer => "architecture-visualizer",
            AgentType::Planner => "planner",
            AgentType::Qa => "qa",
            AgentType::Developer => "developer",
            AgentType::Custom(s) => s,
        }
    }

    pub fn default_skills(&self) -> &[&'static str] {
        match self {
            AgentType::Engineer => &["coding-typescript", "coding-python", "coding-rust", "git-workflow", "code-formatter"],
            AgentType::Security => &["sast-scanner", "dast-scanner", "dependency-checker", "secret-scanner", "policy-validator"],
            AgentType::DevOps => &["cloud-aws", "kubernetes", "terraform", "ci-github-actions", "argo-cd"],
            AgentType::Data => &["etl-pipeline", "dbt", "airflow", "data-quality", "visualization"],
            AgentType::Eda => &["verilog-generator", "synthesis", "place-route", "timing-analysis", "formal-verification"],
            AgentType::Quantum => &["qpu-orchestrator", "quantum-circuit", "visualization"],
            AgentType::Soc => &["siem", "soar", "threat-feed", "dashboarding"],
            AgentType::ThreatIntel => &["vuln-db", "threat-feed", "remediation", "siem"],
            AgentType::ZeroTrust => &["spiffe-spire", "mtls", "opa", "firewall"],
            AgentType::TestEngine => &["testing-unit", "testing-integration", "testing-e2e", "testing-property"],
            AgentType::CodeReview => &["lint", "style", "perf", "security-lint"],
            AgentType::ReleaseManager => &["versioning", "changelog", "rollback", "ci-github-actions"],
            AgentType::ApiDesigner => &["openapi-gen", "asyncapi-gen", "sdk-stub-gen"],
            AgentType::ArchitectureVisualizer => &["diagram-gen", "dep-graph", "impact-analysis"],
            AgentType::Planner => &["research", "planning"],
            AgentType::Qa => &["testing-unit", "testing-integration", "testing-e2e"],
            AgentType::Developer => &["coding", "testing", "refactoring", "debugging"],
            AgentType::Custom(_) => &[],
        }
    }

    pub fn default_capabilities(&self) -> &[&'static str] {
        match self {
            AgentType::Engineer => &["project.read", "project.write", "terminal.test"],
            AgentType::Security => &["project.read", "security.scan", "terminal.test"],
            AgentType::DevOps => &["project.read", "project.write", "terminal.execute", "cloud.deploy"],
            AgentType::Data => &["project.read", "project.write", "terminal.execute"],
            AgentType::Eda => &["project.read", "project.write", "terminal.execute"],
            AgentType::Quantum => &["project.read", "project.write", "terminal.execute"],
            AgentType::Soc => &["project.read", "security.scan", "terminal.execute"],
            AgentType::ThreatIntel => &["project.read", "security.scan", "terminal.execute"],
            AgentType::ZeroTrust => &["project.read", "security.scan", "terminal.execute", "network.config"],
            AgentType::TestEngine => &["project.read", "terminal.test"],
            AgentType::CodeReview => &["project.read", "code.verify", "code.approve"],
            AgentType::ReleaseManager => &["project.read", "project.write", "terminal.execute", "git.workflow"],
            AgentType::ApiDesigner => &["project.read", "project.write", "api.design"],
            AgentType::ArchitectureVisualizer => &["project.read", "diagram.generate"],
            AgentType::Planner => &["project.read", "planning.generate"],
            AgentType::Qa => &["project.read", "terminal.test"],
            AgentType::Developer => &["project.read", "project.write", "terminal.test", "filesystem.read", "filesystem.write"],
            AgentType::Custom(_) => &["project.read"],
        }
    }
}

#[derive(Debug, Clone, PartialEq)]
pub struct AgentSpec {
    pub id: String,
    pub agent_type: AgentType,
    pub model: String,
    pub skills: Vec<String>,
    pub capabilities: Vec<String>,
    pub resource_budget: Option<ResourceBudget>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct ResourceBudget {
    pub cpu_limit: u32,
    pub memory_mb: u64,
    pub disk_mb: u64,
    pub network_enabled: bool,
}

#[derive(Debug, Clone, PartialEq)]
pub enum AgentState {
    Idle,
    Busy,
    Error(String),
}

pub struct Agent {
    pub spec: AgentSpec,
    pub state: AgentState,
    pub tool_registry: ToolRegistry,
    pub security: Arc<RwLock<SecurityKernel>>,
}

impl Clone for Agent {
    fn clone(&self) -> Self {
        Self {
            spec: self.spec.clone(),
            state: self.state.clone(),
            tool_registry: ToolRegistry::new(),
            security: self.security.clone(),
        }
    }
}

impl Agent {
    pub fn new(spec: AgentSpec, security: Arc<RwLock<SecurityKernel>>) -> Self {
        Self {
            spec,
            state: AgentState::Idle,
            tool_registry: ToolRegistry::new(),
            security,
        }
    }

    pub fn with_tools(spec: AgentSpec, security: Arc<RwLock<SecurityKernel>>, tools: ToolRegistry) -> Self {
        Self {
            spec,
            state: AgentState::Idle,
            tool_registry: tools,
            security,
        }
    }

    pub async fn execute_tool(&mut self, tool_name: &str, params: serde_json::Value) -> Option<ToolResult> {
        let token_id = {
            let mut kernel = self.security.write().await;

            if !kernel.is_active() {
                self.state = AgentState::Error("security kernel deactivated".into());
                return None;
            }

            let task_id = kernel.task_id();
            let agent_id = self.spec.id.clone();

            kernel.evaluate_request(
                task_id,
                &agent_id,
                tool_name,
                "**",
                Some(1),
                true,
            )
        };

        let token_id = match token_id {
            Some(id) => id,
            None => {
                self.state = AgentState::Error(format!("capability denied for {}", tool_name));
                return None;
            }
        };

        let tool = self.tool_registry.get(tool_name);
        if tool.is_none() {
            self.state = AgentState::Error(format!("tool not found: {}", tool_name));
            return None;
        }

        self.state = AgentState::Busy;
        let request = ToolRequest {
            tool: tool_name.to_string(),
            params,
        };
        let result = tool.unwrap().execute(request).await;

        {
            let mut kernel = self.security.write().await;
            kernel.consume_token(&token_id);
        }

        self.state = AgentState::Idle;
        Some(result)
    }

    pub async fn grant_capability(&self, action: &str, scope: &str) -> Option<String> {
        let mut kernel = self.security.write().await;
        let task_id = kernel.task_id();
        kernel.evaluate_request(task_id, &self.spec.id, action, scope, Some(1), true)
    }
}

#[derive(Debug, Clone)]
pub struct PlanStep {
    pub description: String,
    pub tool: String,
    pub params: serde_json::Value,
}

#[derive(Debug, Clone)]
pub struct TaskResult {
    pub task_id: String,
    pub success: bool,
    pub outputs: Vec<ToolResult>,
    pub error: Option<String>,
}

pub struct HeadRegistry {
    pub heads: Arc<RwLock<Vec<Agent>>>,
}

impl Default for HeadRegistry {
    fn default() -> Self {
        Self::new()
    }
}

impl HeadRegistry {
    pub fn new() -> Self {
        Self {
            heads: Arc::new(RwLock::new(Vec::new())),
        }
    }

    pub async fn register(&self, agent: Agent) {
        self.heads.write().await.push(agent);
    }

    pub async fn list(&self) -> Vec<AgentSpec> {
        self.heads.read().await.iter().map(|a| a.spec.clone()).collect()
    }

    pub async fn get(&self, id: &str) -> Option<Agent> {
        self.heads.read().await.iter().find(|a| a.spec.id == id).cloned()
    }

    pub async fn get_mut(&self, id: &str) -> Option<Agent> {
        self.heads
            .write()
            .await
            .iter_mut()
            .find(|a| a.spec.id == id)
            .cloned()
    }

    pub async fn list_by_type(&self, agent_type: AgentType) -> Vec<AgentSpec> {
        self.heads
            .read()
            .await
            .iter()
            .filter(|a| a.spec.agent_type == agent_type)
            .map(|a| a.spec.clone())
            .collect()
    }

    pub async fn count(&self) -> usize {
        self.heads.read().await.len()
    }
}

pub struct DeveloperHead {
    agent: Agent,
}

impl DeveloperHead {
    pub fn new(id: &str, security: Arc<RwLock<SecurityKernel>>) -> Self {
        let spec = AgentSpec {
            id: id.to_string(),
            agent_type: AgentType::Developer,
            model: "coding-medium".into(),
            skills: AgentType::Developer.default_skills().iter().map(|s| s.to_string()).collect(),
            capabilities: AgentType::Developer.default_capabilities().iter().map(|s| s.to_string()).collect(),
            resource_budget: Some(ResourceBudget {
                cpu_limit: 4,
                memory_mb: 8192,
                disk_mb: 10240,
                network_enabled: false,
            }),
        };
        Self {
            agent: Agent::new(spec, security),
        }
    }

    pub async fn plan(&self, goal: &str) -> Vec<PlanStep> {
        vec![
            PlanStep {
                description: format!("Analyze requirement: {}", goal),
                tool: "read_files".into(),
                params: serde_json::json!({ "path": "." }),
            },
            PlanStep {
                description: format!("Implement solution for: {}", goal),
                tool: "write_file".into(),
                params: serde_json::json!({ "path": "src/main.rs", "content": "// implementation" }),
            },
            PlanStep {
                description: format!("Test the implementation"),
                tool: "terminal.test".into(),
                params: serde_json::json!({ "command": "cargo test" }),
            },
        ]
    }

    pub async fn execute_plan(&mut self, steps: Vec<PlanStep>) -> TaskResult {
        let mut outputs = Vec::new();
        let mut errors: Vec<String> = Vec::new();

        for step in steps {
            match self
                .agent
                .execute_tool(&step.tool, step.params)
                .await
            {
                Some(result) if result.success => {
                    outputs.push(result);
                }
                Some(result) => {
                    errors.push(format!(
                        "Step '{}' failed: {:?}",
                        step.description, result.error
                    ));
                }
                None => {
                    errors.push(format!("Step '{}' was blocked by security", step.description));
                }
            }
        }

        TaskResult {
            task_id: self.agent.spec.id.clone(),
            success: errors.is_empty(),
            outputs,
            error: if errors.is_empty() {
                None
            } else {
                Some(errors.join("; "))
            },
        }
    }

    pub fn agent_id(&self) -> &str {
        &self.agent.spec.id
    }
}

pub struct QaHead {
    agent: Agent,
}

impl QaHead {
    pub fn new(id: &str, security: Arc<RwLock<SecurityKernel>>) -> Self {
        let spec = AgentSpec {
            id: id.to_string(),
            agent_type: AgentType::Qa,
            model: "fast-medium".into(),
            skills: AgentType::Qa.default_skills().iter().map(|s| s.to_string()).collect(),
            capabilities: AgentType::Qa.default_capabilities().iter().map(|s| s.to_string()).collect(),
            resource_budget: Some(ResourceBudget {
                cpu_limit: 2,
                memory_mb: 4096,
                disk_mb: 5120,
                network_enabled: false,
            }),
        };
        Self {
            agent: Agent::new(spec, security),
        }
    }

    pub async fn run_tests(&mut self, test_pattern: &str) -> ToolResult {
        let params = serde_json::json!({
            "command": format!("cargo test {}", test_pattern),
            "timeout": 300
        });
        match self.agent.execute_tool("terminal.test", params).await {
            Some(result) => result,
            None => ToolResult::err("security denied test execution".into()),
        }
    }

    pub async fn verify_output(&self, output: &ToolResult) -> bool {
        output.success && output.error.is_none()
    }

    pub fn agent_id(&self) -> &str {
        &self.agent.spec.id
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    async fn make_security() -> Arc<RwLock<SecurityKernel>> {
        Arc::new(RwLock::new(SecurityKernel::new()))
    }

    #[tokio::test]
    async fn developer_head_creates_with_correct_type() {
        let security = make_security().await;
        let head = DeveloperHead::new("dev-01", security);
        assert_eq!(head.agent_id(), "dev-01");
        assert_eq!(head.agent.spec.agent_type, AgentType::Developer);
    }

    #[tokio::test]
    async fn developer_head_plan_returns_steps() {
        let security = make_security().await;
        let head = DeveloperHead::new("dev-01", security);
        let plan = head.plan("fix login bug").await;
        assert_eq!(plan.len(), 3);
        assert!(plan[0].description.contains("login bug"));
    }

    #[tokio::test]
    async fn qa_head_creates_with_correct_type() {
        let security = make_security().await;
        let head = QaHead::new("qa-01", security);
        assert_eq!(head.agent_id(), "qa-01");
        assert_eq!(head.agent.spec.agent_type, AgentType::Qa);
    }

    #[tokio::test]
    async fn qa_head_verify_output_success() {
        let security = make_security().await;
        let head = QaHead::new("qa-01", security);
        let result = ToolResult::ok(serde_json::json!("test"));
        assert!(head.verify_output(&result).await);
    }

    #[tokio::test]
    async fn qa_head_verify_output_failure() {
        let security = make_security().await;
        let head = QaHead::new("qa-01", security);
        let result = ToolResult::err("fail".into());
        assert!(!head.verify_output(&result).await);
    }

    #[tokio::test]
    async fn head_registry_register_and_count() {
        let registry = HeadRegistry::new();
        let security = make_security().await;
        let spec = AgentSpec {
            id: "agent-1".into(),
            agent_type: AgentType::Engineer,
            model: "m1".into(),
            skills: vec![],
            capabilities: vec![],
            resource_budget: None,
        };
        registry.register(Agent::new(spec, security)).await;
        assert_eq!(registry.count().await, 1);
    }

    #[tokio::test]
    async fn head_registry_list_by_type() {
        let registry = HeadRegistry::new();
        let security = make_security().await;
        registry.register(Agent::new(AgentSpec {
            id: "dev-1".into(),
            agent_type: AgentType::Developer,
            model: "m".into(),
            skills: vec![],
            capabilities: vec![],
            resource_budget: None,
        }, security.clone())).await;
        registry.register(Agent::new(AgentSpec {
            id: "qa-1".into(),
            agent_type: AgentType::Qa,
            model: "m".into(),
            skills: vec![],
            capabilities: vec![],
            resource_budget: None,
        }, security)).await;

        let devs = registry.list_by_type(AgentType::Developer).await;
        assert_eq!(devs.len(), 1);
        assert_eq!(devs[0].id, "dev-1");
    }

    #[tokio::test]
    async fn developer_head_execute_plan_blocked_by_emergency_stop() {
        let security = make_security().await;
        {
            let mut kernel = security.write().await;
            kernel.emergency_stop();
        }
        let mut head = DeveloperHead::new("dev-01", security);
        let plan = head.plan("do something").await;
        let result = head.execute_plan(plan).await;
        assert!(!result.success);
        assert!(result.error.is_some());
    }
}
