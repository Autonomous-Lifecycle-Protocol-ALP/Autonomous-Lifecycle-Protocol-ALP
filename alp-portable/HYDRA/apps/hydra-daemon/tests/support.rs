use std::path::PathBuf;
use tempfile::TempDir;

pub struct TestEnv {
    pub dir: TempDir,
    pub config: hydra_core::HydraConfig,
}

impl TestEnv {
    pub fn new() -> Self {
        let dir = TempDir::new().expect("failed to create temp dir for test");
        let root = dir.path().to_path_buf();
        let mut config = hydra_core::HydraConfig::default();
        config.root = root.to_string_lossy().into();
        config.data_dir = root.join("data").to_string_lossy().into();
        config.model_dir = root.join("models").to_string_lossy().into();
        config.cache_dir = root.join("cache").to_string_lossy().into();
        config.projects_dir = root.join("projects").to_string_lossy().into();
        config.network_enabled = false;
        config.telemetry_enabled = false;
        Self { dir, config }
    }

    pub fn model_dir(&self) -> PathBuf {
        PathBuf::from(&self.config.model_dir)
    }
}

impl Default for TestEnv {
    fn default() -> Self {
        Self::new()
    }
}
