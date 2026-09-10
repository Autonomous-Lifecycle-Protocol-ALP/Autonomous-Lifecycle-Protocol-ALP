use async_trait::async_trait;
use hydra_tools::{Tool, ToolManifest, ToolRequest, ToolResult};
use serde::{Deserialize, Serialize};
use std::sync::Arc;

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum VisionFormat {
    Png,
    Jpeg,
    WebP,
}

impl VisionFormat {
    pub fn as_str(&self) -> &'static str {
        match self {
            VisionFormat::Png => "png",
            VisionFormat::Jpeg => "jpeg",
            VisionFormat::WebP => "webp",
        }
    }

    pub fn from_str(s: &str) -> Self {
        match s.to_lowercase().as_str() {
            "jpeg" | "jpg" => VisionFormat::Jpeg,
            "webp" => VisionFormat::WebP,
            _ => VisionFormat::Png,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ImageFrame {
    pub format: VisionFormat,
    pub width: u32,
    pub height: u32,
    pub data: String,
}

impl ImageFrame {
    pub fn new(format: VisionFormat, width: u32, height: u32, data: String) -> Self {
        Self {
            format,
            width,
            height,
            data,
        }
    }

    pub fn data_uri(&self) -> String {
        format!("data:image/{};base64,{}", self.format.as_str(), self.data)
    }
}

#[async_trait]
pub trait VisionProvider: Send + Sync {
    async fn describe(
        &self,
        image: ImageFrame,
        prompt: Option<String>,
    ) -> Result<String, String>;
}

pub struct MockVisionProvider {
    pub descriptions: Arc<tokio::sync::Mutex<Vec<(String, Option<String>)>>>,
}

impl MockVisionProvider {
    pub fn new() -> Self {
        Self {
            descriptions: Arc::new(tokio::sync::Mutex::new(Vec::new())),
        }
    }
}

impl Default for MockVisionProvider {
    fn default() -> Self {
        Self::new()
    }
}

#[async_trait]
impl VisionProvider for MockVisionProvider {
    async fn describe(
        &self,
        image: ImageFrame,
        prompt: Option<String>,
    ) -> Result<String, String> {
        self.descriptions
            .lock()
            .await
            .push((image.data.clone(), prompt.clone()));
        Ok(format!(
            "Image is {}x{} {} pixels.{}",
            image.width,
            image.height,
            image.format.as_str(),
            prompt
                .as_ref()
                .map(|p| format!(" Prompt: {p}"))
                .unwrap_or_default()
        ))
    }
}

pub struct VisionTool {
    pub name: String,
    pub provider: Arc<dyn VisionProvider>,
}

impl VisionTool {
    pub fn new(provider: Arc<dyn VisionProvider>) -> Self {
        Self {
            name: "vision.describe".into(),
            provider,
        }
    }
}

#[async_trait]
impl Tool for VisionTool {
    fn name(&self) -> &str {
        &self.name
    }

    fn manifest(&self) -> ToolManifest {
        ToolManifest {
            name: "vision.describe".into(),
            version: "1.0.0".into(),
            capabilities: vec!["vision.describe".into()],
            risk: "medium".into(),
            sandbox_required: false,
        }
    }

    async fn execute(&self, request: ToolRequest) -> ToolResult {
        let image_data = request
            .params
            .get("image")
            .and_then(|v| v.as_str())
            .unwrap_or("");

        let width = request
            .params
            .get("width")
            .and_then(|v| v.as_u64())
            .unwrap_or(0) as u32;
        let height = request
            .params
            .get("height")
            .and_then(|v| v.as_u64())
            .unwrap_or(0) as u32;
        let format_str = request
            .params
            .get("format")
            .and_then(|v| v.as_str())
            .unwrap_or("png");
        let format = VisionFormat::from_str(format_str);
        let prompt = request
            .params
            .get("prompt")
            .and_then(|v| v.as_str())
            .map(String::from);

        if image_data.is_empty() {
            return ToolResult::err("image data is required (base64)".into());
        }

        let image = ImageFrame::new(format, width, height, image_data.into());

        match self.provider.describe(image, prompt).await {
            Ok(description) => ToolResult::ok(serde_json::json!({
                "action": "describe",
                "description": description,
            })),
            Err(e) => ToolResult::err(e),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use hydra_tools::ToolRegistry;
    use serde_json::json;

    #[tokio::test]
    async fn vision_format_as_str() {
        assert_eq!(VisionFormat::Png.as_str(), "png");
        assert_eq!(VisionFormat::Jpeg.as_str(), "jpeg");
        assert_eq!(VisionFormat::WebP.as_str(), "webp");
    }

    #[tokio::test]
    async fn vision_format_from_str() {
        assert_eq!(VisionFormat::from_str("jpeg"), VisionFormat::Jpeg);
        assert_eq!(VisionFormat::from_str("png"), VisionFormat::Png);
        assert_eq!(VisionFormat::from_str("webp"), VisionFormat::WebP);
        assert_eq!(VisionFormat::from_str("jpg"), VisionFormat::Jpeg);
        assert_eq!(VisionFormat::from_str("unknown"), VisionFormat::Png);
    }

    #[tokio::test]
    async fn image_frame_data_uri() {
        let frame = ImageFrame::new(VisionFormat::Png, 800, 600, "base64data".into());
        assert_eq!(
            frame.data_uri(),
            "data:image/png;base64,base64data"
        );
    }

    #[tokio::test]
    async fn vision_tool_manifest() {
        let tool = VisionTool::new(Arc::new(MockVisionProvider::new()));
        let manifest = tool.manifest();
        assert_eq!(manifest.name, "vision.describe");
        assert_eq!(manifest.risk, "medium");
        assert!(!manifest.sandbox_required);
        assert_eq!(manifest.capabilities, vec!["vision.describe"]);
    }

    #[tokio::test]
    async fn vision_tool_describe() {
        let tool = VisionTool::new(Arc::new(MockVisionProvider::new()));
        let result = tool
            .execute(ToolRequest {
                tool: "vision.describe".into(),
                params: json!({
                    "image": "iVBORw0KGgo=",
                    "width": 100,
                    "height": 100,
                    "format": "png",
                    "prompt": "what is in the image?"
                }),
            })
            .await;
        assert!(result.success);
        assert_eq!(result.output["action"], "describe");
    }

    #[tokio::test]
    async fn vision_tool_requires_image() {
        let tool = VisionTool::new(Arc::new(MockVisionProvider::new()));
        let result = tool
            .execute(ToolRequest {
                tool: "vision.describe".into(),
                params: json!({}),
            })
            .await;
        assert!(!result.success);
        assert!(result.error.unwrap().contains("image data"));
    }

    #[tokio::test]
    async fn vision_tool_registers_in_registry() {
        let mut registry = ToolRegistry::new();
        registry.register(VisionTool::new(Arc::new(MockVisionProvider::new())));
        assert!(registry.has("vision.describe"));
        assert!(registry.has_capability("vision.describe", "vision.describe"));
        assert!(registry.requires_approval("vision.describe", "describe"));
    }
}
