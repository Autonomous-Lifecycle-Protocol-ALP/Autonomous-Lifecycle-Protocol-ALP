use serde::Deserialize;
use dirs;
use std::path::PathBuf;

fn expand_tilde(path: &str) -> String {
    if let Some(stripped) = path.strip_prefix("~/") {
        if let Some(home) = dirs::home_dir() {
            return home.join(stripped).to_string_lossy().to_string();
        }
    }
    path.to_string()
}

#[derive(Debug, Deserialize, Clone)]
pub struct HydraConfig {
    pub root: String,
    pub data_dir: String,
    pub model_dir: String,
    pub cache_dir: String,
    pub projects_dir: String,
    pub log_level: String,
    pub max_concurrency: usize,
    pub default_timeout: u64,
    pub network_enabled: bool,
    pub telemetry_enabled: bool,
}

impl Default for HydraConfig {
    fn default() -> Self {
        let home = dirs::home_dir().unwrap_or_default().to_string_lossy().to_string();
        Self {
            root: format!("{home}/.hydra"),
            data_dir: format!("{home}/.hydra/data"),
            model_dir: format!("{home}/.hydra/models"),
            cache_dir: format!("{home}/.hydra/cache"),
            projects_dir: format!("{home}/.hydra/projects"),
            log_level: "INFO".into(),
            max_concurrency: 2,
            default_timeout: 600,
            network_enabled: false,
            telemetry_enabled: false,
        }
    }
}

#[derive(Debug)]
pub enum ConfigLoadError {
    Io(std::io::Error),
    Parse(toml::de::Error),
}

impl From<std::io::Error> for ConfigLoadError {
    fn from(e: std::io::Error) -> Self {
        ConfigLoadError::Io(e)
    }
}

impl From<toml::de::Error> for ConfigLoadError {
    fn from(e: toml::de::Error) -> Self {
        ConfigLoadError::Parse(e)
    }
}

impl std::fmt::Display for ConfigLoadError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            ConfigLoadError::Io(e) => write!(f, "IO error: {e}"),
            ConfigLoadError::Parse(e) => write!(f, "Parse error: {e}"),
        }
    }
}

impl std::error::Error for ConfigLoadError {}

pub struct ConfigLoader;

impl ConfigLoader {
    pub fn load(path: impl Into<PathBuf>) -> Result<HydraConfig, ConfigLoadError> {
        let content = std::fs::read_to_string(path.into())?;
        let mut cfg: HydraConfig = toml::from_str(&content)?;
        cfg.root = expand_tilde(&cfg.root);
        cfg.data_dir = expand_tilde(&cfg.data_dir);
        cfg.model_dir = expand_tilde(&cfg.model_dir);
        cfg.cache_dir = expand_tilde(&cfg.cache_dir);
        cfg.projects_dir = expand_tilde(&cfg.projects_dir);
        Ok(cfg)
    }

    pub fn load_or_default(path: impl Into<PathBuf>) -> HydraConfig {
        Self::load(path).unwrap_or_default()
    }
}
