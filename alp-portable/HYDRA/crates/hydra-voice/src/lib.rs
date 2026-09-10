use async_trait::async_trait;
use hydra_tools::{Tool, ToolManifest, ToolRequest, ToolResult};
use serde::{Deserialize, Serialize};
use std::sync::Arc;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum VoiceFormat {
    Pcm,
    Wav,
    Mp3,
    Ogg,
    Flac,
}

impl VoiceFormat {
    pub fn as_str(&self) -> &'static str {
        match self {
            VoiceFormat::Pcm => "pcm",
            VoiceFormat::Wav => "wav",
            VoiceFormat::Mp3 => "mp3",
            VoiceFormat::Ogg => "ogg",
            VoiceFormat::Flac => "flac",
        }
    }

    pub fn from_str(s: &str) -> Self {
        match s.to_lowercase().as_str() {
            "wav" => VoiceFormat::Wav,
            "mp3" => VoiceFormat::Mp3,
            "ogg" => VoiceFormat::Ogg,
            "flac" => VoiceFormat::Flac,
            _ => VoiceFormat::Pcm,
        }
    }

    pub fn sample_rate(&self) -> u32 {
        match self {
            VoiceFormat::Pcm => 16000,
            VoiceFormat::Wav => 16000,
            VoiceFormat::Mp3 => 22050,
            VoiceFormat::Ogg => 22050,
            VoiceFormat::Flac => 16000,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Transcription {
    pub text: String,
    pub confidence: f64,
    pub language: String,
    pub format: VoiceFormat,
}

impl Transcription {
    pub fn new(text: String, confidence: f64, language: String, format: VoiceFormat) -> Self {
        Self {
            text,
            confidence,
            language,
            format,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SynthesisResult {
    pub data: Vec<u8>,
    pub format: VoiceFormat,
    pub sample_rate: u32,
}

impl SynthesisResult {
    pub fn new(data: Vec<u8>, format: VoiceFormat, sample_rate: u32) -> Self {
        Self {
            data,
            format,
            sample_rate,
        }
    }
}

#[async_trait]
pub trait VoiceProvider: Send + Sync {
    async fn transcribe(&self, audio: &[u8], format: VoiceFormat) -> Result<Transcription, String>;
    async fn synthesize(
        &self,
        text: &str,
        format: VoiceFormat,
    ) -> Result<SynthesisResult, String>;
}

pub struct MockVoiceProvider {
    pub transcriptions: Arc<tokio::sync::Mutex<Vec<Transcription>>>,
    pub syntheses: Arc<tokio::sync::Mutex<Vec<(String, VoiceFormat)>>>,
}

impl MockVoiceProvider {
    pub fn new() -> Self {
        Self {
            transcriptions: Arc::new(tokio::sync::Mutex::new(Vec::new())),
            syntheses: Arc::new(tokio::sync::Mutex::new(Vec::new())),
        }
    }
}

impl Default for MockVoiceProvider {
    fn default() -> Self {
        Self::new()
    }
}

#[async_trait]
impl VoiceProvider for MockVoiceProvider {
    async fn transcribe(&self, audio: &[u8], format: VoiceFormat) -> Result<Transcription, String> {
        let text = if audio.is_empty() {
            "no speech detected".into()
        } else {
            format!("transcribed {} bytes of {}", audio.len(), format.as_str())
        };
        let transcription = Transcription::new(text.clone(), 0.95, "en".into(), format);
        self.transcriptions.lock().await.push(transcription.clone());
        Ok(transcription)
    }

    async fn synthesize(
        &self,
        text: &str,
        format: VoiceFormat,
    ) -> Result<SynthesisResult, String> {
        let sample_rate = format.sample_rate();
        let data = text.as_bytes().to_vec();
        self.syntheses
            .lock()
            .await
            .push((text.to_string(), format.clone()));
        Ok(SynthesisResult::new(data, format, sample_rate))
    }
}

pub struct VoiceTool {
    pub name: String,
    pub provider: Arc<dyn VoiceProvider>,
}

impl VoiceTool {
    pub fn new(provider: Arc<dyn VoiceProvider>) -> Self {
        Self {
            name: "voice".into(),
            provider,
        }
    }
}

#[async_trait]
impl Tool for VoiceTool {
    fn name(&self) -> &str {
        &self.name
    }

    fn manifest(&self) -> ToolManifest {
        ToolManifest {
            name: "voice".into(),
            version: "1.0.0".into(),
            capabilities: vec!["voice.transcribe".into(), "voice.synthesize".into()],
            risk: "medium".into(),
            sandbox_required: false,
        }
    }

    async fn execute(&self, request: ToolRequest) -> ToolResult {
        let action = request
            .params
            .get("action")
            .and_then(|v| v.as_str())
            .unwrap_or("transcribe");

        match action {
            "transcribe" => {
                let audio_data = request
                    .params
                    .get("audio")
                    .and_then(|v| v.as_str())
                    .unwrap_or("");

                if audio_data.is_empty() {
                    return ToolResult::err("audio data is required".into());
                }

                let format_str = request
                    .params
                    .get("format")
                    .and_then(|v| v.as_str())
                    .unwrap_or("pcm");
                let format = VoiceFormat::from_str(format_str);

                let audio_bytes = decode_base64_fallback(audio_data);

                match self.provider.transcribe(&audio_bytes, format).await {
                    Ok(transcription) => ToolResult::ok(serde_json::json!({
                        "action": "transcribe",
                        "text": transcription.text,
                        "confidence": transcription.confidence,
                        "language": transcription.language,
                    })),
                    Err(e) => ToolResult::err(e),
                }
            }
            "synthesize" => {
                let text = request
                    .params
                    .get("text")
                    .and_then(|v| v.as_str())
                    .unwrap_or("");

                if text.is_empty() {
                    return ToolResult::err("text is required for synthesis".into());
                }

                let format_str = request
                    .params
                    .get("format")
                    .and_then(|v| v.as_str())
                    .unwrap_or("wav");
                let format = VoiceFormat::from_str(format_str);

                match self.provider.synthesize(text, format).await {
                    Ok(result) => {
                        let encoded = encode_base64(&result.data);
                        ToolResult::ok(serde_json::json!({
                            "action": "synthesize",
                            "data": encoded,
                            "format": format.as_str(),
                            "sample_rate": result.sample_rate,
                            "bytes": result.data.len(),
                        }))
                    }
                    Err(e) => ToolResult::err(e),
                }
            }
            _ => ToolResult::err(format!("unknown voice action: {action}")),
        }
    }
}

fn decode_base64_fallback(s: &str) -> Vec<u8> {
    let decoded = base64_engine::decode_config(s, base64_engine::STANDARD);
    decoded.unwrap_or_else(|_| s.bytes().collect())
}

fn encode_base64(data: &[u8]) -> String {
    base64_engine::encode_config(data, base64_engine::STANDARD)
}

mod base64_engine {
    pub fn decode_config(s: &str, _config: ()) -> Result<Vec<u8>, ()> {
        use std::collections::HashMap;
        let mut lookup: HashMap<char, u8> = HashMap::new();
        let chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
        for (i, c) in chars.chars().enumerate() {
            lookup.insert(c, i as u8);
        }
        let bytes: Vec<u8> = s
            .chars()
            .filter(|c| !c.is_whitespace() && *c != '=')
            .filter_map(|c| lookup.get(&c).copied())
            .collect();
        let mut out = Vec::with_capacity(bytes.len() * 3 / 4);
        for chunk in bytes.chunks(4) {
        let b0 = chunk.get(0).copied().unwrap_or(0) as u32;
        let b1 = chunk.get(1).copied().unwrap_or(0) as u32;
        let b2 = chunk.get(2).copied().unwrap_or(0) as u32;
        let b3 = chunk.get(3).copied().unwrap_or(0) as u32;
        let triple = (b0 << 18) | (b1 << 12) | (b2 << 6) | b3;
            out.push((triple >> 16) as u8);
            if chunk.len() > 2 {
                out.push(((triple >> 8) & 0xff) as u8);
            }
            if chunk.len() > 3 {
                out.push((triple & 0xff) as u8);
            }
        }
        Ok(out)
    }

    pub fn encode_config(data: &[u8], _config: ()) -> String {
        const CHARS: &[u8] =
            b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
        let mut out = String::with_capacity((data.len() + 2) / 3 * 4);
        for chunk in data.chunks(3) {
            let b0 = chunk.get(0).copied().unwrap_or(0) as u32;
            let b1 = chunk.get(1).copied().unwrap_or(0) as u32;
            let b2 = chunk.get(2).copied().unwrap_or(0) as u32;
            let triple = (b0 << 16) | (b1 << 8) | b2;
            out.push(CHARS[((triple >> 18) & 0x3f) as usize] as char);
            out.push(CHARS[((triple >> 12) & 0x3f) as usize] as char);
            if chunk.len() > 1 {
                out.push(CHARS[((triple >> 6) & 0x3f) as usize] as char);
            } else {
                out.push('=');
            }
            if chunk.len() > 2 {
                out.push(CHARS[(triple & 0x3f) as usize] as char);
            } else {
                out.push('=');
            }
        }
        out
    }

    pub const STANDARD: () = ();
}

#[cfg(test)]
mod tests {
    use super::*;
    use hydra_tools::ToolRegistry;
    use serde_json::json;

    #[tokio::test]
    async fn voice_format_as_str() {
        assert_eq!(VoiceFormat::Pcm.as_str(), "pcm");
        assert_eq!(VoiceFormat::Wav.as_str(), "wav");
        assert_eq!(VoiceFormat::Mp3.as_str(), "mp3");
    }

    #[tokio::test]
    async fn voice_format_from_str() {
        assert_eq!(VoiceFormat::from_str("wav"), VoiceFormat::Wav);
        assert_eq!(VoiceFormat::from_str("mp3"), VoiceFormat::Mp3);
        assert_eq!(VoiceFormat::from_str("unknown"), VoiceFormat::Pcm);
    }

    #[tokio::test]
    async fn voice_format_sample_rate() {
        assert_eq!(VoiceFormat::Pcm.sample_rate(), 16000);
        assert_eq!(VoiceFormat::Mp3.sample_rate(), 22050);
    }

    #[tokio::test]
    async fn transcription_construction() {
        let t = Transcription::new("hello".into(), 0.9, "en".into(), VoiceFormat::Wav);
        assert_eq!(t.text, "hello");
        assert_eq!(t.confidence, 0.9);
    }

    #[tokio::test]
    async fn synthesis_result_construction() {
        let s = SynthesisResult::new(vec![1, 2, 3], VoiceFormat::Pcm, 16000);
        assert_eq!(s.data, vec![1, 2, 3]);
        assert_eq!(s.sample_rate, 16000);
    }

    #[tokio::test]
    async fn mock_voice_provider_transcribe() {
        let provider = MockVoiceProvider::new();
        let audio = vec![0u8; 160];
        let result = provider.transcribe(&audio, VoiceFormat::Pcm).await;
        assert!(result.is_ok());
        assert!(result.unwrap().text.contains("transcribed"));
    }

    #[tokio::test]
    async fn mock_voice_provider_transcribe_empty() {
        let provider = MockVoiceProvider::new();
        let result = provider.transcribe(&[], VoiceFormat::Wav).await;
        assert!(result.is_ok());
        assert_eq!(result.unwrap().text, "no speech detected");
    }

    #[tokio::test]
    async fn mock_voice_provider_synthesize() {
        let provider = MockVoiceProvider::new();
        let result = provider.synthesize("hello world", VoiceFormat::Wav).await;
        assert!(result.is_ok());
        let s = result.unwrap();
        assert_eq!(s.format, VoiceFormat::Wav);
        assert_eq!(s.data, b"hello world");
    }

    #[tokio::test]
    async fn voice_tool_manifest() {
        let tool = VoiceTool::new(Arc::new(MockVoiceProvider::new()));
        let manifest = tool.manifest();
        assert_eq!(manifest.name, "voice");
        assert_eq!(manifest.risk, "medium");
        assert!(!manifest.sandbox_required);
        assert!(manifest.capabilities.contains(&"voice.transcribe".into()));
        assert!(manifest.capabilities.contains(&"voice.synthesize".into()));
    }

    #[tokio::test]
    async fn voice_tool_transcribe() {
        let tool = VoiceTool::new(Arc::new(MockVoiceProvider::new()));
        let audio = "dGVzdA==";
        let result = tool
            .execute(ToolRequest {
                tool: "voice".into(),
                params: json!({
                    "action": "transcribe",
                    "audio": audio,
                    "format": "wav"
                }),
            })
            .await;
        assert!(result.success);
        assert_eq!(result.output["action"], "transcribe");
    }

    #[tokio::test]
    async fn voice_tool_transcribe_requires_audio() {
        let tool = VoiceTool::new(Arc::new(MockVoiceProvider::new()));
        let result = tool
            .execute(ToolRequest {
                tool: "voice".into(),
                params: json!({ "action": "transcribe" }),
            })
            .await;
        assert!(!result.success);
        assert!(result.error.unwrap().contains("audio data"));
    }

    #[tokio::test]
    async fn voice_tool_synthesize() {
        let tool = VoiceTool::new(Arc::new(MockVoiceProvider::new()));
        let result = tool
            .execute(ToolRequest {
                tool: "voice".into(),
                params: json!({
                    "action": "synthesize",
                    "text": "hello world",
                    "format": "wav"
                }),
            })
            .await;
        assert!(result.success);
        assert_eq!(result.output["action"], "synthesize");
        assert_eq!(result.output["format"], "wav");
    }

    #[tokio::test]
    async fn voice_tool_synthesize_requires_text() {
        let tool = VoiceTool::new(Arc::new(MockVoiceProvider::new()));
        let result = tool
            .execute(ToolRequest {
                tool: "voice".into(),
                params: json!({ "action": "synthesize" }),
            })
            .await;
        assert!(!result.success);
        assert!(result.error.unwrap().contains("text is required"));
    }

    #[tokio::test]
    async fn voice_tool_unknown_action() {
        let tool = VoiceTool::new(Arc::new(MockVoiceProvider::new()));
        let result = tool
            .execute(ToolRequest {
                tool: "voice".into(),
                params: json!({ "action": "sing" }),
            })
            .await;
        assert!(!result.success);
        assert!(result.error.unwrap().contains("unknown voice action"));
    }

    #[tokio::test]
    async fn voice_tool_registers_in_registry() {
        let mut registry = ToolRegistry::new();
        registry.register(VoiceTool::new(Arc::new(MockVoiceProvider::new())));
        assert!(registry.has("voice"));
        assert!(registry.has_capability("voice", "voice.transcribe"));
        assert!(registry.has_capability("voice", "voice.synthesize"));
        assert!(registry.requires_approval("voice", "transcribe"));
    }

    #[test]
    fn base64_encode_decode_roundtrip() {
        let original = b"Hello, World!";
        let encoded = encode_base64(original);
        let decoded = decode_base64_fallback(&encoded);
        assert_eq!(decoded, original.to_vec());
    }
}
