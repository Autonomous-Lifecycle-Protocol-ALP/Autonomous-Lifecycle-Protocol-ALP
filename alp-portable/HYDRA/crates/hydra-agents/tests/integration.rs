mod support;

use hydra_agents::{Agent, AgentState};
use hydra_browser::{BrowserTool, MockBrowserProvider};
use hydra_computer::{ComputerUseTool, MockComputerProvider};
use hydra_tools::{ToolRegistry, ToolResult};
use hydra_vision::{MockVisionProvider, VisionTool};
use hydra_voice::{MockVoiceProvider, VoiceTool};
use serde_json::json;
use std::sync::Arc;
use tokio::sync::RwLock;

#[tokio::test]
async fn agent_executes_computer_tool_e2e() {
    let kernel = Arc::new(RwLock::new(support::kernel_with_capabilities(&[
        "computer.use",
    ])));
    let spec = support::agent_spec("dev-01");
    let mut registry = ToolRegistry::new();
    registry.register(ComputerUseTool::new(Arc::new(MockComputerProvider::new())));
    let mut agent = Agent::with_tools(spec, kernel, registry);

    let result = agent
        .execute_tool("computer.use", json!({ "action": "screenshot" }))
        .await;
    assert!(result.is_some(), "tool should execute when capability granted");
    let result: ToolResult = result.unwrap();
    assert!(result.success, "computer.use screenshot failed: {}", result.error.unwrap_or_default());
    assert_eq!(result.output["action"], "screenshot");
    assert_eq!(agent.state, AgentState::Idle);
}

#[tokio::test]
async fn agent_executes_browser_tool_e2e() {
    let kernel = Arc::new(RwLock::new(support::kernel_with_capabilities(&[
        "browser",
    ])));
    let spec = support::agent_spec("dev-02");
    let mut registry = ToolRegistry::new();
    registry.register(BrowserTool::new(Arc::new(MockBrowserProvider::new())));
    let mut agent = Agent::with_tools(spec, kernel, registry);

    let open = agent
        .execute_tool("browser", json!({ "action": "open", "url": "https://example.com" }))
        .await
        .expect("open should succeed");
    assert!(open.success);
    let session_id = open.output["session_id"].as_str().unwrap().to_string();

    let nav = agent
        .execute_tool(
            "browser",
            json!({ "action": "navigate", "session_id": session_id, "url": "https://example.org" }),
        )
        .await
        .expect("navigate should succeed");
    assert!(nav.success);
    assert_eq!(nav.output["action"], "navigate");
}

#[tokio::test]
async fn agent_executes_vision_tool_e2e() {
    let kernel = Arc::new(RwLock::new(support::kernel_with_capabilities(&[
        "vision.describe",
    ])));
    let spec = support::agent_spec("dev-03");
    let mut registry = ToolRegistry::new();
    registry.register(VisionTool::new(Arc::new(MockVisionProvider::new())));
    let mut agent = Agent::with_tools(spec, kernel, registry);

    let result = agent
        .execute_tool(
            "vision.describe",
            json!({ "image": "iVBORw0KGgo=", "width": 100, "height": 100, "format": "png" }),
        )
        .await;
    assert!(result.is_some());
    let result = result.unwrap();
    assert!(result.success);
    assert_eq!(result.output["action"], "describe");
}

#[tokio::test]
async fn agent_executes_voice_tool_e2e() {
    let kernel = Arc::new(RwLock::new(support::kernel_with_capabilities(&[
        "voice",
    ])));
    let spec = support::agent_spec("dev-04");
    let mut registry = ToolRegistry::new();
    registry.register(VoiceTool::new(Arc::new(MockVoiceProvider::new())));
    let mut agent = Agent::with_tools(spec, kernel, registry);

    let result = agent
        .execute_tool(
            "voice",
            json!({ "action": "synthesize", "text": "hello", "format": "wav" }),
        )
        .await;
    assert!(result.is_some());
    let result = result.unwrap();
    assert!(result.success);
    assert_eq!(result.output["action"], "synthesize");
}

#[tokio::test]
async fn agent_denied_when_no_capability() {
    let kernel = Arc::new(RwLock::new(support::kernel_with_capabilities(&[])));
    let spec = support::agent_spec("dev-05");
    let registry = ToolRegistry::new();
    let mut agent = Agent::with_tools(spec, kernel, registry);

    let result = agent
        .execute_tool("computer.use", json!({ "action": "screenshot" }))
        .await;
    assert!(result.is_none(), "unregistered capability must be denied");
    assert!(matches!(agent.state, AgentState::Error(_)));
}

#[tokio::test]
async fn agent_blocks_after_emergency_stop() {
    let kernel = support::kernel_with_capabilities(&["computer.use"]);
    let kernel = Arc::new(RwLock::new(kernel));
    {
        let mut k = kernel.write().await;
        k.emergency_stop();
    }
    let spec = support::agent_spec("dev-06");
    let mut registry = ToolRegistry::new();
    registry.register(ComputerUseTool::new(Arc::new(MockComputerProvider::new())));
    let mut agent = Agent::with_tools(spec, kernel, registry);

    let result = agent
        .execute_tool("computer.use", json!({ "action": "screenshot" }))
        .await;
    assert!(result.is_none(), "emergency stop must block all execution");
}
