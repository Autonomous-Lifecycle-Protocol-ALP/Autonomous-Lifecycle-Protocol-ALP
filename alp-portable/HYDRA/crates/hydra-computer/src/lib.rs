use async_trait::async_trait;
use hydra_tools::{Tool, ToolManifest, ToolRequest, ToolResult};
use serde::{Deserialize, Serialize};
use std::sync::Arc;

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub enum InputTarget {
    AccessibilityId(String),
    WindowTitle(String),
    Coordinates { x: u32, y: u32 },
    ScreenRegion { x: u32, y: u32, width: u32, height: u32 },
    Focused,
    Text(String),
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub enum InputEvent {
    Click {
        target: InputTarget,
        button: MouseButton,
        double: bool,
    },
    Type {
        target: InputTarget,
        text: String,
    },
    KeyPress {
        key: String,
        modifiers: Vec<String>,
    },
    KeyCombo {
        keys: Vec<String>,
    },
    Scroll {
        target: InputTarget,
        delta_x: i32,
        delta_y: i32,
    },
    Screenshot {
        region: Option<InputTarget>,
    },
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub enum MouseButton {
    Left,
    Right,
    Middle,
}

impl Default for MouseButton {
    fn default() -> Self {
        MouseButton::Left
    }
}

impl CaptureFormat {
    pub fn as_str(&self) -> &'static str {
        match self {
            CaptureFormat::Png => "png",
            CaptureFormat::Jpeg => "jpeg",
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum CaptureFormat {
    Png,
    Jpeg,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScreenCapture {
    pub id: String,
    pub timestamp: String,
    pub format: CaptureFormat,
    pub width: u32,
    pub height: u32,
    pub data: String,
}

impl ScreenCapture {
    pub fn new(format: CaptureFormat, width: u32, height: u32, data: String) -> Self {
        Self {
            id: uuid::Uuid::new_v4().to_string(),
            timestamp: chrono::Utc::now().to_rfc3339(),
            format,
            width,
            height,
            data,
        }
    }
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub enum WindowInfo {
    Active {
        handle: u64,
        title: String,
    },
    List(Vec<(u64, String)>),
}

#[async_trait]
pub trait ComputerUseProvider: Send + Sync {
    async fn capture_screen(&self, region: Option<&InputTarget>) -> Result<ScreenCapture, String>;
    async fn inject_input(&self, event: &InputEvent) -> Result<String, String>;
    async fn get_accessibility_tree(&self) -> Result<String, String>;
    async fn list_windows(&self) -> Result<WindowInfo, String>;
}

pub struct MockComputerProvider {
    pub captures: Arc<tokio::sync::Mutex<Vec<ScreenCapture>>>,
    pub inputs: Arc<tokio::sync::Mutex<Vec<InputEvent>>>,
}

impl MockComputerProvider {
    pub fn new() -> Self {
        Self {
            captures: Arc::new(tokio::sync::Mutex::new(Vec::new())),
            inputs: Arc::new(tokio::sync::Mutex::new(Vec::new())),
        }
    }
}

impl Default for MockComputerProvider {
    fn default() -> Self {
        Self::new()
    }
}

#[async_trait]
impl ComputerUseProvider for MockComputerProvider {
    async fn capture_screen(&self, _region: Option<&InputTarget>) -> Result<ScreenCapture, String> {
        let capture = ScreenCapture::new(CaptureFormat::Png, 1920, 1080, "png-base64-mock".into());
        self.captures.lock().await.push(capture.clone());
        Ok(capture)
    }

    async fn inject_input(&self, event: &InputEvent) -> Result<String, String> {
        self.inputs.lock().await.push(event.clone());
        match event {
            InputEvent::Click { target, .. } => Ok(format!("clicked {:?}", target)),
            InputEvent::Type { text, .. } => Ok(format!("typed: {text}")),
            InputEvent::KeyPress { key, .. } => Ok(format!("key: {key}")),
            InputEvent::KeyCombo { keys } => Ok(format!("combo: {:?}", keys)),
            InputEvent::Scroll { target, .. } => Ok(format!("scrolled {:?}", target)),
            InputEvent::Screenshot { .. } => Ok("screenshot captured".into()),
        }
    }

    async fn get_accessibility_tree(&self) -> Result<String, String> {
        Ok("{\"role\":\"window\",\"children\":[]}".into())
    }

    async fn list_windows(&self) -> Result<WindowInfo, String> {
        Ok(WindowInfo::List(vec![(1, "MockWindow".into())]))
    }
}

pub struct ComputerUseTool {
    pub name: String,
    pub provider: Arc<dyn ComputerUseProvider>,
}

impl ComputerUseTool {
    pub fn new(provider: Arc<dyn ComputerUseProvider>) -> Self {
        Self {
            name: "computer.use".into(),
            provider,
        }
    }
}

#[async_trait]
impl Tool for ComputerUseTool {
    fn name(&self) -> &str {
        &self.name
    }

    fn manifest(&self) -> ToolManifest {
        ToolManifest {
            name: "computer.use".into(),
            version: "1.0.0".into(),
            capabilities: vec!["computer.use".into()],
            risk: "high".into(),
            sandbox_required: true,
        }
    }

    async fn execute(&self, request: ToolRequest) -> ToolResult {
        let action = request
            .params
            .get("action")
            .and_then(|v| v.as_str())
            .unwrap_or("click");

        match action {
            "screenshot" => {
                let result = self.provider.capture_screen(None).await;
                match result {
                    Ok(capture) => ToolResult::ok(serde_json::json!({
                        "action": "screenshot",
                        "format": capture.format.as_str(),
                        "width": capture.width,
                        "height": capture.height,
                    })),
                    Err(e) => ToolResult::err(e),
                }
            }
            "a11y-tree" => {
                let result = self.provider.get_accessibility_tree().await;
                match result {
                    Ok(tree) => ToolResult::ok(serde_json::json!({
                        "action": "accessibility_tree",
                        "tree": tree,
                    })),
                    Err(e) => ToolResult::err(e),
                }
            }
            "click" | "type" | "keypress" | "scroll" | "keycombo" | "window_list" => {
                let event = parse_input_event(action, &request.params);
                match self.provider.inject_input(&event).await {
                    Ok(msg) => ToolResult::ok(serde_json::json!({
                        "action": action,
                        "result": msg,
                    })),
                    Err(e) => ToolResult::err(e),
                }
            }
            _ => ToolResult::err(format!("unknown computer action: {action}")),
        }
    }
}

fn parse_input_event(action: &str, params: &serde_json::Value) -> InputEvent {
    match action {
        "click" => InputEvent::Click {
            target: parse_target(params.get("target")),
            button: MouseButton::default(),
            double: false,
        },
        "type" => InputEvent::Type {
            target: parse_target(params.get("target")),
            text: params.get("text").and_then(|v| v.as_str()).unwrap_or("").into(),
        },
        "keypress" => InputEvent::KeyPress {
            key: params
                .get("key")
                .and_then(|v| v.as_str())
                .unwrap_or("")
                .into(),
            modifiers: vec![],
        },
        "keycombo" => InputEvent::KeyCombo {
            keys: params
                .get("keys")
                .and_then(|v| v.as_array())
                .map(|arr| {
                    arr.iter()
                        .filter_map(|v| v.as_str().map(String::from))
                        .collect()
                })
                .unwrap_or_default(),
        },
        "scroll" => InputEvent::Scroll {
            target: parse_target(params.get("target")),
            delta_x: params.get("delta_x").and_then(|v| v.as_i64()).unwrap_or(0) as i32,
            delta_y: params.get("delta_y").and_then(|v| v.as_i64()).unwrap_or(0) as i32,
        },
        _ => InputEvent::KeyPress {
            key: "Enter".into(),
            modifiers: vec![],
        },
    }
}

fn parse_target(value: Option<&serde_json::Value>) -> InputTarget {
    match value {
        Some(v) if v.get("type").and_then(|t| t.as_str()) == Some("accessibility_id") => {
            InputTarget::AccessibilityId(
                v.get("value")
                    .and_then(|v| v.as_str())
                    .unwrap_or("")
                    .into(),
            )
        }
        Some(v) if v.get("type").and_then(|t| t.as_str()) == Some("coordinates") => {
            let x = v.get("x").and_then(|v| v.as_u64()).unwrap_or(0) as u32;
            let y = v.get("y").and_then(|v| v.as_u64()).unwrap_or(0) as u32;
            InputTarget::Coordinates { x, y }
        }
        _ => InputTarget::Focused,
    }
}

#[derive(Debug, Clone, PartialEq)]
pub struct ComputerAction {
    pub id: String,
    pub action_type: ComputerActionType,
    pub target: String,
    pub result: Option<String>,
}

#[derive(Debug, Clone, PartialEq)]
pub enum ComputerActionType {
    KeyPress(String),
    MouseClick { x: u32, y: u32 },
    TypeText(String),
    Screenshot,
    RunCommand(String),
}

pub struct ComputerAgent {
    pub actions: Arc<tokio::sync::RwLock<Vec<ComputerAction>>>,
}

impl ComputerAgent {
    pub fn new() -> Self {
        Self {
            actions: Arc::new(tokio::sync::RwLock::new(Vec::new())),
        }
    }

    pub async fn execute(&self, action: ComputerActionType) -> Result<String, String> {
        let id = format!("act-{}", uuid::Uuid::new_v4().simple());
        let result = match &action {
            ComputerActionType::KeyPress(key) => format!("key pressed: {key}"),
            ComputerActionType::MouseClick { x, y } => format!("clicked at {x},{y}"),
            ComputerActionType::TypeText(text) => format!("typed: {text}"),
            ComputerActionType::Screenshot => "screenshot captured".into(),
            ComputerActionType::RunCommand(cmd) => format!("executed: {cmd}"),
        };
        self.actions
            .write()
            .await
            .push(ComputerAction {
                id,
                action_type: action,
                target: result.clone(),
                result: Some(result.clone()),
            });
        Ok(result)
    }
}

impl Default for ComputerAgent {
    fn default() -> Self {
        Self::new()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use hydra_tools::ToolRegistry;
    use serde_json::json;

    #[tokio::test]
    async fn computer_agent_executes_keypress() {
        let agent = ComputerAgent::new();
        let result = agent
            .execute(ComputerActionType::KeyPress("Enter".into()))
            .await;
        assert!(result.is_ok());
        assert_eq!(result.unwrap(), "key pressed: Enter");
    }

    #[tokio::test]
    async fn computer_agent_executes_click() {
        let agent = ComputerAgent::new();
        let result = agent
            .execute(ComputerActionType::MouseClick { x: 100, y: 200 })
            .await;
        assert!(result.is_ok());
        assert_eq!(result.unwrap(), "clicked at 100,200");
    }

    #[tokio::test]
    async fn computer_use_tool_manifest() {
        let tool = ComputerUseTool::new(Arc::new(MockComputerProvider::new()));
        let manifest = tool.manifest();
        assert_eq!(manifest.name, "computer.use");
        assert_eq!(manifest.risk, "high");
        assert!(manifest.sandbox_required);
        assert_eq!(manifest.capabilities, vec!["computer.use"]);
    }

    #[tokio::test]
    async fn computer_use_tool_screenshot() {
        let tool = ComputerUseTool::new(Arc::new(MockComputerProvider::new()));
        let result = tool
            .execute(ToolRequest {
                tool: "computer.use".into(),
                params: json!({ "action": "screenshot" }),
            })
            .await;
        assert!(result.success);
        assert_eq!(result.output["action"], "screenshot");
    }

    #[tokio::test]
    async fn computer_use_tool_click() {
        let tool = ComputerUseTool::new(Arc::new(MockComputerProvider::new()));
        let result = tool
            .execute(ToolRequest {
                tool: "computer.use".into(),
                params: json!({
                    "action": "click",
                    "target": { "type": "accessibility_id", "value": "submit-button" }
                }),
            })
            .await;
        assert!(result.success);
    }

    #[tokio::test]
    async fn computer_use_tool_type() {
        let tool = ComputerUseTool::new(Arc::new(MockComputerProvider::new()));
        let result = tool
            .execute(ToolRequest {
                tool: "computer.use".into(),
                params: json!({ "action": "type", "text": "hello world" }),
            })
            .await;
        assert!(result.success);
        assert_eq!(result.output["action"], "type");
    }

    #[tokio::test]
    async fn computer_use_tool_a11y_tree() {
        let tool = ComputerUseTool::new(Arc::new(MockComputerProvider::new()));
        let result = tool
            .execute(ToolRequest {
                tool: "computer.use".into(),
                params: json!({ "action": "a11y-tree" }),
            })
            .await;
        assert!(result.success);
    }

    #[tokio::test]
    async fn computer_use_tool_unknown_action() {
        let tool = ComputerUseTool::new(Arc::new(MockComputerProvider::new()));
        let result = tool
            .execute(ToolRequest {
                tool: "computer.use".into(),
                params: json!({ "action": "fly" }),
            })
            .await;
        assert!(!result.success);
        assert!(result.error.unwrap().contains("unknown"));
    }

    #[tokio::test]
    async fn computer_use_tool_registers_in_registry() {
        let mut registry = ToolRegistry::new();
        registry.register(ComputerUseTool::new(Arc::new(MockComputerProvider::new())));
        assert!(registry.has("computer.use"));
        assert!(registry.requires_approval("computer.use", "click"));
    }
}
