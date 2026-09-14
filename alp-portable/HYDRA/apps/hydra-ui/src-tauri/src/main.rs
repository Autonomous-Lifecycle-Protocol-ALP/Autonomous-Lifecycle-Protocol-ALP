use tauri::Manager;

fn main() {
    run()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            get_hardware_profile,
            list_models,
            get_daemon_status,
            run_creative,
            emergency_stop,
            security_scan
        ])
        .setup(|app| {
            #[cfg(debug_assertions)]
            {
                let window = app.get_webview_window("main").unwrap();
                window.open_devtools();
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[tauri::command]
fn get_hardware_profile() -> String {
    let profile = hydra_core::hardware::HardwareProfile::detect();
    format!("{profile:?}")
}

#[tauri::command]
fn list_models(model_dir: String) -> Vec<String> {
    let mut manager = hydra_runtime::ModelManager::new();
    let adapters = manager.discover(model_dir);
    adapters.into_iter().map(|a| a.name).collect()
}

#[tauri::command]
async fn get_daemon_status() -> String {
    let config = hydra_core::HydraConfig::default();
    let daemon = hydra_daemon::HydraDaemon::new(config).await;
    let status = daemon.status().await;
    serde_json::to_string(&status).unwrap_or_default()
}

#[tauri::command]
fn run_creative(goal: String) -> String {
    let manager = hydra_runtime::ModelManager::new();
    let budget = hydra_runtime::ResourceBudget {
        max_ram_mb: 4096,
        max_cpu_percent: 80,
        timeout_seconds: 60,
    };
    let pipeline = hydra_orchestrator::CreativePipeline::new(manager, budget);
    let result = pipeline.run(&goal);
    serde_json::to_string(&result).unwrap_or_default()
}

#[tauri::command]
fn emergency_stop() -> String {
    let mut kernel = hydra_security::SecurityKernel::new();
    kernel.emergency_stop();
    let response = hydra_daemon::EmergencyStopResponse {
        status: "kill switch activated".into(),
    };
    serde_json::to_string(&response).unwrap_or_default()
}

#[tauri::command]
fn security_scan() -> String {
    let kernel = hydra_security::SecurityKernel::new();
    if kernel.is_active() {
        "Security scan: Kill switch is ACTIVE - system is in safe mode".to_string()
    } else {
        "Security scan: Kill switch is INACTIVE - emergency stop triggered".to_string()
    }
}
