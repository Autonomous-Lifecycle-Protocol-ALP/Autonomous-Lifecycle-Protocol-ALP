use hydra_core::HydraConfig;
use tempfile::TempDir;

pub struct TestEnv {
    pub _temp: TempDir,
    pub config: HydraConfig,
}

impl TestEnv {
    pub fn new() -> Self {
        let temp = TempDir::new().expect("create temp dir");
        let root = temp.path().to_string_lossy().to_string();
        let config = HydraConfig {
            root: root.clone(),
            data_dir: format!("{root}/data"),
            model_dir: format!("{root}/models"),
            cache_dir: format!("{root}/cache"),
            projects_dir: format!("{root}/projects"),
            log_level: "INFO".into(),
            max_concurrency: 2,
            default_timeout: 600,
            network_enabled: false,
            telemetry_enabled: false,
        };
        Self { _temp: temp, config }
    }
}

impl Default for TestEnv {
    fn default() -> Self {
        Self::new()
    }
}
