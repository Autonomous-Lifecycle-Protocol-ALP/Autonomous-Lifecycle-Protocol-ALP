#[derive(Debug, Clone)]
pub struct HardwareProfile {
    pub cpu_cores: usize,
    pub total_ram_mb: u64,
    pub available_ram_mb: u64,
    pub cpu_model: String,
    pub os: String,
    pub arch: String,
    pub has_gpu: bool,
    pub gpu_name: Option<String>,
    pub disk_free_gb: f64,
}

impl HardwareProfile {
    pub fn detect() -> Self {
        let cpu_cores = std::thread::available_parallelism()
            .map(|n| n.get())
            .unwrap_or(1);

        let mut profile = Self {
            cpu_cores,
            total_ram_mb: 0,
            available_ram_mb: 0,
            cpu_model: "unknown".into(),
            os: std::env::consts::OS.into(),
            arch: std::env::consts::ARCH.into(),
            has_gpu: false,
            gpu_name: None,
            disk_free_gb: 0.0,
        };

        #[cfg(target_os = "linux")]
        {
            profile.detect_linux();
        }

        #[cfg(target_os = "macos")]
        {
            profile.detect_macos();
        }

        #[cfg(target_os = "windows")]
        {
            profile.detect_windows();
        }

        profile
    }

    #[cfg(target_os = "linux")]
    fn detect_linux(&mut self) {
        if let Ok(content) = std::fs::read_to_string("/proc/meminfo") {
            for line in content.lines() {
                if let Some(val) = line.strip_prefix("MemTotal:") {
                    let kb: u64 = val.trim().split_whitespace().next().and_then(|s| s.parse().ok()).unwrap_or(0);
                    self.total_ram_mb = kb / 1024;
                }
                if let Some(val) = line.strip_prefix("MemAvailable:") {
                    let kb: u64 = val.trim().split_whitespace().next().and_then(|s| s.parse().ok()).unwrap_or(0);
                    self.available_ram_mb = kb / 1024;
                }
            }
        }
    }

    #[cfg(target_os = "macos")]
    fn detect_macos(&mut self) {
        if let Ok(output) = std::process::Command::new("sysctl").args(["-n", "hw.memsize"]).output() {
            if output.status.success() {
                let bytes: u64 = String::from_utf8_lossy(&output.stdout).trim().parse().unwrap_or(0);
                self.total_ram_mb = bytes / 1024 / 1024;
            }
        }
    }

    #[cfg(target_os = "windows")]
    fn detect_windows(&mut self) {
        if let Ok(output) = std::process::Command::new("wmic").args(["ComputerSystem", "get", "TotalPhysicalMemory", "/value"]).output() {
            if output.status.success() {
                for line in String::from_utf8_lossy(&output.stdout).lines() {
                    if let Some(val) = line.strip_prefix("TotalPhysicalMemory=") {
                        if let Ok(bytes) = val.trim().parse::<u64>() {
                            self.total_ram_mb = bytes / 1024 / 1024;
                        }
                    }
                }
            }
        }
    }
}
