use async_trait::async_trait;
use hydra_tools::{Tool, ToolManifest, ToolRequest, ToolResult};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tokio::sync::RwLock;

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub enum BrowserState {
    Active,
    Loading,
    Closed,
    Error(String),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BrowserSession {
    pub id: String,
    pub url: String,
    pub title: String,
    pub state: BrowserState,
    pub created_at: String,
    pub last_activity: String,
}

impl BrowserSession {
    pub fn new(url: &str) -> Self {
        let now = chrono::Utc::now().to_rfc3339();
        Self {
            id: format!("browser-{}", uuid::Uuid::new_v4().simple()),
            url: url.into(),
            title: url.into(),
            state: BrowserState::Active,
            created_at: now.clone(),
            last_activity: now,
        }
    }

    pub fn navigate(&mut self, url: &str) {
        self.url = url.into();
        self.state = BrowserState::Loading;
        self.last_activity = chrono::Utc::now().to_rfc3339();
    }

    pub fn mark_loaded(&mut self, title: &str) {
        self.title = title.into();
        self.state = BrowserState::Active;
        self.last_activity = chrono::Utc::now().to_rfc3339();
    }
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub enum BrowserAction {
    Navigate { url: String },
    Click {
        target: ClickTarget,
    },
    Type {
        target: ClickTarget,
        text: String,
    },
    Read {
        target: Option<ClickTarget>,
        max_length: Option<usize>,
    },
    Download {
        url: String,
        filename: Option<String>,
    },
    Upload {
        target: ClickTarget,
        file_path: String,
    },
    Screenshot {
        full_page: bool,
    },
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub enum ClickTarget {
    AccessibilityId(String),
    CssSelector(String),
    Xpath(String),
    Coordinates { x: u32, y: u32 },
    Url(String),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BrowserResult {
    pub action: String,
    pub session_id: Option<String>,
    pub output: String,
    pub success: bool,
}

#[async_trait]
pub trait BrowserProvider: Send + Sync {
    async fn navigate(&self, session_id: &str, url: &str) -> Result<BrowserResult, String>;
    async fn click(&self, session_id: &str, target: &ClickTarget) -> Result<BrowserResult, String>;
    async fn type_text(
        &self,
        session_id: &str,
        target: &ClickTarget,
        text: &str,
    ) -> Result<BrowserResult, String>;
    async fn read(
        &self,
        session_id: &str,
        target: Option<&ClickTarget>,
        max_length: Option<usize>,
    ) -> Result<BrowserResult, String>;
    async fn download(
        &self,
        session_id: &str,
        url: &str,
        filename: Option<&str>,
    ) -> Result<BrowserResult, String>;
    async fn upload(
        &self,
        session_id: &str,
        target: &ClickTarget,
        file_path: &str,
    ) -> Result<BrowserResult, String>;
    async fn screenshot(&self, session_id: &str, full_page: bool) -> Result<BrowserResult, String>;
}

pub struct MockBrowserProvider {
    pub actions: Arc<RwLock<Vec<BrowserAction>>>,
}

impl MockBrowserProvider {
    pub fn new() -> Self {
        Self {
            actions: Arc::new(RwLock::new(Vec::new())),
        }
    }
}

impl Default for MockBrowserProvider {
    fn default() -> Self {
        Self::new()
    }
}

#[async_trait]
impl BrowserProvider for MockBrowserProvider {
    async fn navigate(&self, session_id: &str, url: &str) -> Result<BrowserResult, String> {
        self.actions
            .write()
            .await
            .push(BrowserAction::Navigate { url: url.into() });
        Ok(BrowserResult {
            action: "navigate".into(),
            session_id: Some(session_id.into()),
            output: format!("navigated to {url}"),
            success: true,
        })
    }

    async fn click(&self, session_id: &str, target: &ClickTarget) -> Result<BrowserResult, String> {
        self.actions.write().await.push(BrowserAction::Click {
            target: target.clone(),
        });
        Ok(BrowserResult {
            action: "click".into(),
            session_id: Some(session_id.into()),
            output: format!("clicked {:?}", target),
            success: true,
        })
    }

    async fn type_text(
        &self,
        session_id: &str,
        target: &ClickTarget,
        text: &str,
    ) -> Result<BrowserResult, String> {
        self.actions.write().await.push(BrowserAction::Type {
            target: target.clone(),
            text: text.into(),
        });
        Ok(BrowserResult {
            action: "type".into(),
            session_id: Some(session_id.into()),
            output: format!("typed into {:?}", target),
            success: true,
        })
    }

    async fn read(
        &self,
        session_id: &str,
        _target: Option<&ClickTarget>,
        _max_length: Option<usize>,
    ) -> Result<BrowserResult, String> {
        Ok(BrowserResult {
            action: "read".into(),
            session_id: Some(session_id.into()),
            output: "mock page content".into(),
            success: true,
        })
    }

    async fn download(
        &self,
        session_id: &str,
        url: &str,
        filename: Option<&str>,
    ) -> Result<BrowserResult, String> {
        self.actions.write().await.push(BrowserAction::Download {
            url: url.into(),
            filename: filename.map(String::from),
        });
        Ok(BrowserResult {
            action: "download".into(),
            session_id: Some(session_id.into()),
            output: format!("downloaded {url}"),
            success: true,
        })
    }

    async fn upload(
        &self,
        session_id: &str,
        target: &ClickTarget,
        file_path: &str,
    ) -> Result<BrowserResult, String> {
        self.actions
            .write()
            .await
            .push(BrowserAction::Upload {
                target: target.clone(),
                file_path: file_path.into(),
            });
        Ok(BrowserResult {
            action: "upload".into(),
            session_id: Some(session_id.into()),
            output: format!("uploaded {file_path} to {:?}", target),
            success: true,
        })
    }

    async fn screenshot(&self, session_id: &str, full_page: bool) -> Result<BrowserResult, String> {
        self.actions.write().await.push(BrowserAction::Screenshot { full_page });
        Ok(BrowserResult {
            action: "screenshot".into(),
            session_id: Some(session_id.into()),
            output: format!("screenshot captured (full_page={full_page})"),
            success: true,
        })
    }
}

pub struct BrowserController {
    pub sessions: Arc<RwLock<Vec<BrowserSession>>>,
}

impl BrowserController {
    pub fn new() -> Self {
        Self {
            sessions: Arc::new(RwLock::new(Vec::new())),
        }
    }

    pub async fn open(&self, url: &str) -> BrowserSession {
        let session = BrowserSession::new(url);
        self.sessions.write().await.push(session.clone());
        session
    }

    pub async fn get(&self, id: &str) -> Option<BrowserSession> {
        self.sessions.read().await.iter().find(|s| s.id == id).cloned()
    }

    pub async fn list(&self) -> Vec<BrowserSession> {
        self.sessions.read().await.clone()
    }

    pub async fn close(&self, id: &str) -> bool {
        let mut sessions = self.sessions.write().await;
        if let Some(pos) = sessions.iter().position(|s| s.id == id) {
            sessions.remove(pos);
            true
        } else {
            false
        }
    }

    pub async fn len(&self) -> usize {
        self.sessions.read().await.len()
    }
}

impl Default for BrowserController {
    fn default() -> Self {
        Self::new()
    }
}

pub struct BrowserTool {
    pub name: String,
    pub provider: Arc<dyn BrowserProvider>,
    pub controller: Arc<BrowserController>,
}

impl BrowserTool {
    pub fn new(provider: Arc<dyn BrowserProvider>) -> Self {
        Self {
            name: "browser".into(),
            provider,
            controller: Arc::new(BrowserController::new()),
        }
    }

    pub async fn open_session(&self, url: &str) -> BrowserSession {
        self.controller.open(url).await
    }
}

#[async_trait]
impl Tool for BrowserTool {
    fn name(&self) -> &str {
        &self.name
    }

    fn manifest(&self) -> ToolManifest {
        ToolManifest {
            name: "browser".into(),
            version: "1.0.0".into(),
            capabilities: vec![
                "browser.navigate".into(),
                "browser.read".into(),
                "browser.click".into(),
                "browser.type".into(),
                "browser.download".into(),
                "browser.upload".into(),
            ],
            risk: "high".into(),
            sandbox_required: true,
        }
    }

    async fn execute(&self, request: ToolRequest) -> ToolResult {
        let action = request
            .params
            .get("action")
            .and_then(|v| v.as_str())
            .unwrap_or("read");

        let session_id = request
            .params
            .get("session_id")
            .and_then(|v| v.as_str())
            .map(|s| s.to_string());

        if session_id.is_none() && action != "open" {
            return ToolResult::err("session_id is required".into());
        }
        let session_id = session_id.unwrap_or_default();

        match action {
            "open" => {
                let url = request
                    .params
                    .get("url")
                    .and_then(|v| v.as_str())
                    .unwrap_or("about:blank");
                let session = self.open_session(url).await;
                ToolResult::ok(serde_json::json!({
                    "action": "open",
                    "session_id": session.id,
                    "url": session.url,
                }))
            }
            "navigate" => {
                let url = request
                    .params
                    .get("url")
                    .and_then(|v| v.as_str())
                    .unwrap_or("");
                match self.provider.navigate(&session_id, url).await {
                    Ok(r) => ToolResult::ok(serde_json::json!({
                        "action": "navigate",
                        "output": r.output,
                        "session_id": r.session_id,
                    })),
                    Err(e) => ToolResult::err(e),
                }
            }
            "click" => {
                let target = parse_click_target(request.params.get("target"));
                match self.provider.click(&session_id, &target).await {
                    Ok(r) => ToolResult::ok(serde_json::json!({ "action": "click", "output": r.output })),
                    Err(e) => ToolResult::err(e),
                }
            }
            "type" => {
                let target = parse_click_target(request.params.get("target"));
                let text = request
                    .params
                    .get("text")
                    .and_then(|v| v.as_str())
                    .unwrap_or("");
                match self.provider.type_text(&session_id, &target, text).await {
                    Ok(r) => ToolResult::ok(serde_json::json!({ "action": "type", "output": r.output })),
                    Err(e) => ToolResult::err(e),
                }
            }
            "read" => {
                match self.provider.read(&session_id, None, None).await {
                    Ok(r) => ToolResult::ok(serde_json::json!({
                        "action": "read",
                        "output": r.output,
                        "length": r.output.len(),
                    })),
                    Err(e) => ToolResult::err(e),
                }
            }
            "download" => {
                let url = request
                    .params
                    .get("url")
                    .and_then(|v| v.as_str())
                    .unwrap_or("");
                let filename = request
                    .params
                    .get("filename")
                    .and_then(|v| v.as_str());
                match self.provider.download(&session_id, url, filename).await {
                    Ok(r) => ToolResult::ok(serde_json::json!({ "action": "download", "output": r.output })),
                    Err(e) => ToolResult::err(e),
                }
            }
            "screenshot" => {
                let full_page = request
                    .params
                    .get("full_page")
                    .and_then(|v| v.as_bool())
                    .unwrap_or(false);
                match self.provider.screenshot(&session_id, full_page).await {
                    Ok(r) => ToolResult::ok(serde_json::json!({ "action": "screenshot", "output": r.output })),
                    Err(e) => ToolResult::err(e),
                }
            }
            _ => ToolResult::err(format!("unknown browser action: {action}")),
        }
    }
}

fn parse_click_target(value: Option<&serde_json::Value>) -> ClickTarget {
    match value {
        Some(v) if v.get("type").and_then(|t| t.as_str()) == Some("css") => ClickTarget::CssSelector(
            v.get("value")
                .and_then(|v| v.as_str())
                .unwrap_or("")
                .into(),
        ),
        Some(v) if v.get("type").and_then(|t| t.as_str()) == Some("xpath") => {
            ClickTarget::Xpath(
                v.get("value")
                    .and_then(|v| v.as_str())
                    .unwrap_or("")
                    .into(),
            )
        }
        Some(v) if v.get("type").and_then(|t| t.as_str()) == Some("accessibility_id") => {
            ClickTarget::AccessibilityId(
                v.get("value")
                    .and_then(|v| v.as_str())
                    .unwrap_or("")
                    .into(),
            )
        }
        _ => ClickTarget::Url("".into()),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use hydra_tools::ToolRegistry;
    use serde_json::json;

    #[tokio::test]
    async fn browser_controller_open_and_list() {
        let controller = BrowserController::new();
        let session = controller.open("https://example.com").await;
        assert_eq!(session.url, "https://example.com");
        assert_eq!(session.state, BrowserState::Active);
        let list = controller.list().await;
        assert_eq!(list.len(), 1);
    }

    #[tokio::test]
    async fn browser_controller_close() {
        let controller = BrowserController::new();
        let session = controller.open("https://example.com").await;
        assert!(controller.close(&session.id).await);
        assert_eq!(controller.len().await, 0);
        assert!(!controller.close(&session.id).await);
    }

    #[tokio::test]
    async fn browser_tool_manifest_declares_capabilities() {
        let tool = BrowserTool::new(Arc::new(MockBrowserProvider::new()));
        let manifest = tool.manifest();
        assert_eq!(manifest.name, "browser");
        assert_eq!(manifest.risk, "high");
        assert!(manifest.sandbox_required);
        assert!(manifest.capabilities.contains(&"browser.navigate".into()));
        assert!(manifest.capabilities.contains(&"browser.click".into()));
        assert!(manifest.capabilities.contains(&"browser.read".into()));
    }

    #[tokio::test]
    async fn browser_tool_open_creates_session() {
        let tool = BrowserTool::new(Arc::new(MockBrowserProvider::new()));
        let result = tool
            .execute(ToolRequest {
                tool: "browser".into(),
                params: json!({ "action": "open", "url": "https://example.com" }),
            })
            .await;
        assert!(result.success);
        assert_eq!(result.output["action"], "open");
    }

    #[tokio::test]
    async fn browser_tool_navigate() {
        let tool = BrowserTool::new(Arc::new(MockBrowserProvider::new()));
        let open = tool
            .execute(ToolRequest {
                tool: "browser".into(),
                params: json!({ "action": "open", "url": "https://example.com" }),
            })
            .await;
        let session_id = open.output["session_id"].as_str().unwrap();
        let result = tool
            .execute(ToolRequest {
                tool: "browser".into(),
                params: json!({
                    "action": "navigate",
                    "session_id": session_id,
                    "url": "https://example.org"
                }),
            })
            .await;
        assert!(result.success);
        assert_eq!(result.output["action"], "navigate");
    }

    #[tokio::test]
    async fn browser_tool_read() {
        let tool = BrowserTool::new(Arc::new(MockBrowserProvider::new()));
        let open = tool
            .execute(ToolRequest {
                tool: "browser".into(),
                params: json!({ "action": "open", "url": "https://example.com" }),
            })
            .await;
        let session_id = open.output["session_id"].as_str().unwrap();
        let result = tool
            .execute(ToolRequest {
                tool: "browser".into(),
                params: json!({ "action": "read", "session_id": session_id }),
            })
            .await;
        assert!(result.success);
        assert_eq!(result.output["action"], "read");
    }

    #[tokio::test]
    async fn browser_tool_requires_session_id() {
        let tool = BrowserTool::new(Arc::new(MockBrowserProvider::new()));
        let result = tool
            .execute(ToolRequest {
                tool: "browser".into(),
                params: json!({ "action": "navigate", "url": "https://example.com" }),
            })
            .await;
        assert!(!result.success);
        assert!(result.error.unwrap().contains("session_id"));
    }

    #[tokio::test]
    async fn browser_tool_click() {
        let tool = BrowserTool::new(Arc::new(MockBrowserProvider::new()));
        let open = tool
            .execute(ToolRequest {
                tool: "browser".into(),
                params: json!({ "action": "open", "url": "https://example.com" }),
            })
            .await;
        let session_id = open.output["session_id"].as_str().unwrap();
        let result = tool
            .execute(ToolRequest {
                tool: "browser".into(),
                params: json!({
                    "action": "click",
                    "session_id": session_id,
                    "target": { "type": "accessibility_id", "value": "submit" }
                }),
            })
            .await;
        assert!(result.success);
    }

    #[tokio::test]
    async fn browser_tool_registers_in_registry() {
        let mut registry = ToolRegistry::new();
        registry.register(BrowserTool::new(Arc::new(MockBrowserProvider::new())));
        assert!(registry.has("browser"));
        assert!(registry.has_capability("browser", "browser.navigate"));
        assert!(registry.requires_approval("browser", "navigate"));
    }

    #[tokio::test]
    async fn browser_tool_recorded_actions() {
        let provider = Arc::new(MockBrowserProvider::new());
        let tool = BrowserTool::new(provider.clone());
        let open = tool
            .execute(ToolRequest {
                tool: "browser".into(),
                params: json!({ "action": "open", "url": "https://example.com" }),
            })
            .await;
        let session_id = open.output["session_id"].as_str().unwrap().to_string();
        let _ = tool
            .execute(ToolRequest {
                tool: "browser".into(),
                params: json!({
                    "action": "navigate",
                    "session_id": session_id,
                    "url": "https://example.org"
                }),
            })
            .await;
        assert_eq!(provider.actions.read().await.len(), 1);
    }
}
