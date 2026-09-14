use async_trait::async_trait;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::collections::HashMap;
use std::sync::Arc;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ToolManifest {
    pub name: String,
    pub version: String,
    pub capabilities: Vec<String>,
    pub risk: String,
    pub sandbox_required: bool,
}

#[derive(Debug, Clone, Serialize)]
pub struct ToolRequest {
    pub tool: String,
    pub params: Value,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ToolResult {
    pub success: bool,
    pub output: Value,
    pub error: Option<String>,
    pub execution_time_ms: u128,
}

impl ToolResult {
    pub fn ok(output: Value) -> Self {
        Self {
            success: true,
            output,
            error: None,
            execution_time_ms: 0,
        }
    }

    pub fn err(message: String) -> Self {
        Self {
            success: false,
            output: Value::Null,
            error: Some(message),
            execution_time_ms: 0,
        }
    }
}

#[async_trait]
pub trait Tool: Send + Sync {
    fn name(&self) -> &str;

    fn manifest(&self) -> ToolManifest;

    async fn execute(&self, request: ToolRequest) -> ToolResult;
}

#[derive(Clone)]
pub struct RegisteredTool {
    pub manifest: ToolManifest,
    pub tool: Arc<dyn Tool>,
}

#[derive(Clone)]
pub struct ToolRegistry {
    tools: HashMap<String, RegisteredTool>,
}

impl Default for ToolRegistry {
    fn default() -> Self {
        Self::new()
    }
}

impl ToolRegistry {
    pub fn new() -> Self {
        Self {
            tools: HashMap::new(),
        }
    }

    pub fn register<T: Tool + 'static>(&mut self, tool: T) {
        let name = tool.name().to_string();
        let manifest = tool.manifest();
        self.tools.insert(
            name.clone(),
            RegisteredTool {
                manifest,
                tool: Arc::new(tool),
            },
        );
    }

    pub fn unregister(&mut self, name: &str) -> bool {
        self.tools.remove(name).is_some()
    }

    pub fn get(&self, name: &str) -> Option<&Arc<dyn Tool>> {
        self.tools.get(name).map(|rt| &rt.tool)
    }

    pub fn manifest(&self, name: &str) -> Option<&ToolManifest> {
        self.tools.get(name).map(|rt| &rt.manifest)
    }

    pub fn list(&self) -> Vec<&ToolManifest> {
        self.tools.values().map(|rt| &rt.manifest).collect()
    }

    pub fn list_names(&self) -> Vec<String> {
        self.tools.keys().cloned().collect()
    }

    pub fn has(&self, name: &str) -> bool {
        self.tools.contains_key(name)
    }

    pub fn count(&self) -> usize {
        self.tools.len()
    }

    pub fn requires_approval(&self, name: &str, _action: &str) -> bool {
        match self.tools.get(name) {
            Some(rt) => match rt.manifest.risk.as_str() {
                "low" => false,
                "medium" => true,
                "high" => true,
                "critical" => true,
                _ => true,
            },
            None => true,
        }
    }

    pub fn has_capability(&self, name: &str, capability: &str) -> bool {
        self.tools
            .get(name)
            .map(|rt| rt.manifest.capabilities.iter().any(|c| c == capability))
            .unwrap_or(false)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    struct TestTool;

    #[async_trait]
    impl Tool for TestTool {
        fn name(&self) -> &str {
            "test"
        }

        fn manifest(&self) -> ToolManifest {
            ToolManifest {
                name: "test".into(),
                version: "1.0.0".into(),
                capabilities: vec!["project.read".into()],
                risk: "low".into(),
                sandbox_required: true,
            }
        }

        async fn execute(&self, request: ToolRequest) -> ToolResult {
            ToolResult::ok(request.params)
        }
    }

    struct WriteTool;

    #[async_trait]
    impl Tool for WriteTool {
        fn name(&self) -> &str {
            "write"
        }

        fn manifest(&self) -> ToolManifest {
            ToolManifest {
                name: "write".into(),
                version: "1.0.0".into(),
                capabilities: vec!["project.write".into()],
                risk: "high".into(),
                sandbox_required: true,
            }
        }

        async fn execute(&self, _request: ToolRequest) -> ToolResult {
            ToolResult::err("denied".into())
        }
    }

    #[tokio::test]
    async fn registry_register_and_get() {
        let mut registry = ToolRegistry::new();
        registry.register(TestTool);
        assert!(registry.has("test"));
        assert_eq!(registry.count(), 1);
    }

    #[tokio::test]
    async fn registry_execute_tool() {
        let mut registry = ToolRegistry::new();
        registry.register(TestTool);
        let tool = registry.get("test").unwrap();
        let result = tool
            .execute(ToolRequest {
                tool: "test".into(),
                params: serde_json::json!({"key": "value"}),
            })
            .await;
        assert!(result.success);
        assert_eq!(result.output["key"], "value");
    }

    #[tokio::test]
    async fn registry_unregister() {
        let mut registry = ToolRegistry::new();
        registry.register(TestTool);
        assert!(registry.unregister("test"));
        assert!(!registry.has("test"));
    }

    #[tokio::test]
    async fn registry_get_missing_returns_none() {
        let registry = ToolRegistry::new();
        assert!(registry.get("missing").is_none());
    }

    #[tokio::test]
    async fn registry_requires_approval_low_risk() {
        let mut registry = ToolRegistry::new();
        registry.register(TestTool);
        assert!(!registry.requires_approval("test", "read"));
    }

    #[tokio::test]
    async fn registry_requires_approval_high_risk() {
        let mut registry = ToolRegistry::new();
        registry.register(WriteTool);
        assert!(registry.requires_approval("write", "write"));
    }

    #[tokio::test]
    async fn registry_has_capability() {
        let mut registry = ToolRegistry::new();
        registry.register(TestTool);
        assert!(registry.has_capability("test", "project.read"));
        assert!(!registry.has_capability("test", "project.write"));
    }

    #[tokio::test]
    async fn registry_list() {
        let mut registry = ToolRegistry::new();
        registry.register(TestTool);
        registry.register(WriteTool);
        let names = registry.list_names();
        assert_eq!(names.len(), 2);
    }
}
