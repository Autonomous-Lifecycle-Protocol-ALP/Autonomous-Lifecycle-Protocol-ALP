use std::time::Duration;
use tokio::time::sleep;

mod support;

#[tokio::test]
async fn daemon_submit_and_status() {
    let env = support::TestEnv::new();
    let daemon = hydra_daemon::HydraDaemon::new(env.config).await;

    let id = daemon.submit_task("integration-test-goal").await;
    assert!(!id.is_empty(), "submitted task id should not be empty");

    let status = daemon.status().await;
    assert!(!status.running);
    assert_eq!(status.tasks_processed, 0);
}

#[tokio::test]
async fn daemon_creative_handler_returns_artifacts() {
    let env = support::TestEnv::new();
    let daemon = hydra_daemon::HydraDaemon::new(env.config).await;
    let req = axum::Json(hydra_daemon::CreativeRequest {
        goal: "Create a logo and a website".into(),
    });
    let resp = hydra_daemon::creative_handler(daemon.creative.clone(), req).await;

    assert_eq!(resp.goal, "Create a logo and a website");
    assert!(resp.result.contains("[planned]"));
}

#[tokio::test]
async fn e2e_pipeline_creative_run_populates_artifacts() {
    let _env = support::TestEnv::new();
    let hw = hydra_core::HardwareProfile::detect();
    let budget = hydra_runtime::ResourceBudget {
        max_ram_mb: hw.available_ram_mb.max(hw.total_ram_mb),
        max_cpu_percent: 80,
        timeout_seconds: 60,
    };
    let pipeline = hydra_orchestrator::CreativePipeline::new(
        hydra_runtime::ModelManager::new(),
        budget,
    );

    let result = pipeline.run("Create a logo");
    assert_eq!(result.goal, "Create a logo");
    assert!(!result.summary.is_empty());
}

#[tokio::test]
async fn scheduler_processes_jobs_and_daemon_counts_them() {
    let env = support::TestEnv::new();
    let daemon = hydra_daemon::HydraDaemon::new(env.config).await;
    daemon.kill_switch.write().await.trigger();
    daemon.start().await;

    let _id = daemon.submit_task("e2e-job").await;

    for _ in 0..50 {
        let status = daemon.status().await;
        if status.tasks_processed > 0 {
            assert!(status.running);
            daemon.stop().await;
            return;
        }
        sleep(Duration::from_millis(50)).await;
    }

    daemon.stop().await;
    panic!("scheduler did not process any jobs within timeout");
}

#[tokio::test]
async fn daemon_stop_gracefully() {
    let env = support::TestEnv::new();
    let daemon = hydra_daemon::HydraDaemon::new(env.config).await;
    daemon.kill_switch.write().await.trigger();
    daemon.start().await;

    sleep(Duration::from_millis(100)).await;
    daemon.stop().await;
    sleep(Duration::from_millis(100)).await;

    let status = daemon.status().await;
    assert!(!status.running);
}

#[tokio::test]
async fn daemon_emergency_stop_deactivates_kill_switch() {
    let env = support::TestEnv::new();
    let daemon = hydra_daemon::HydraDaemon::new(env.config).await;
    let _resp = hydra_daemon::emergency_stop_handler(daemon.kill_switch.clone()).await;

    let active = daemon.kill_switch.read().await.is_active();
    assert!(!active, "kill switch should be deactivated after emergency stop");
}
