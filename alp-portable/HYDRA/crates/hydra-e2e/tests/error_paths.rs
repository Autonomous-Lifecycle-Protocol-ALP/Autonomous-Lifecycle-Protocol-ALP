use hydra_inference::InferenceBackend;

mod support;

#[tokio::test]
async fn pipeline_skips_modality_when_no_model_available() {
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

    let result = pipeline.run("Generate a video");
    assert_eq!(result.goal, "Generate a video");
    assert!(!result.summary.is_empty());
}

#[tokio::test]
async fn inference_backend_rejects_missing_model_path() {
    let backend = hydra_inference::StubBackend::new();
    let err = backend.generate(hydra_inference::GenerationRequest {
        model_id: "missing".into(),
        prompt: "hi".into(),
        max_tokens: None,
        temperature: None,
        context: vec![],
    }).unwrap_err();
    assert!(err.contains("not loaded"));
}

#[tokio::test]
async fn daemon_status_returns_zero_models_when_dir_empty() {
    let env = support::TestEnv::new();
    let daemon = hydra_daemon::HydraDaemon::new(env.config).await;
    let status = daemon.status().await;
    assert_eq!(status.models_loaded, 0);
}

#[tokio::test]
async fn scheduler_enqueue_then_process_maintains_order() {
    let scheduler = hydra_scheduler::Scheduler::new(2);
    let id1 = scheduler.enqueue(hydra_scheduler::Job::new("a", "first")).await;
    let id2 = scheduler.enqueue(hydra_scheduler::Job::new("b", "second")).await;
    assert_eq!(id1, "a");
    assert_eq!(id2, "b");

    let first = scheduler.process_next(|p| Ok(format!("ok:{p}"))).await;
    assert_eq!(first, Some(hydra_scheduler::JobStatus::Completed("ok:first".into())));
}
