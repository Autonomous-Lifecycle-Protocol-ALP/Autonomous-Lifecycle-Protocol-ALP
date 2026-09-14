use std::time::Duration;
use reqwest::Client;
use tempfile::TempDir;
use tokio::time::sleep;

mod support;

#[tokio::test]
async fn daemon_grpc_generate_returns_not_found_for_missing_model() {
    use hydra_daemon::proto::InferenceRequest;
    use hydra_daemon::proto::hydra_daemon_client::HydraDaemonClient;

    let env = support::TestEnv::new();
    let daemon = hydra_daemon::HydraDaemon::new(env.config).await;
    let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
    let addr = listener.local_addr().unwrap();
    drop(listener);

    let daemon_clone = daemon.clone();
    tokio::spawn(async move {
        let _ = daemon_clone.serve_grpc(addr).await;
    });

    sleep(Duration::from_millis(200)).await;

    let mut client = HydraDaemonClient::connect(format!("http://{addr}")).await.unwrap();
    let resp = client.generate(InferenceRequest {
        model_id: "nonexistent".into(),
        prompt: "hi".into(),
        max_tokens: 16,
        temperature: 0.7,
    }).await;

    assert!(resp.is_err());
    assert_eq!(resp.unwrap_err().code(), tonic::Code::NotFound);
}

#[tokio::test]
async fn daemon_http_submit_task_returns_id() {
    let env = support::TestEnv::new();
    let daemon = hydra_daemon::HydraDaemon::new(env.config).await;
    let app = daemon.daemon_router();
    let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
    let addr = listener.local_addr().unwrap();

    tokio::spawn(async move {
        axum::serve(listener, app.into_make_service()).await.ok();
    });

    let client = Client::new();
    let url = format!("http://{addr}/task");
    let resp = client.post(url).json(&hydra_daemon::SubmitTaskRequest { goal: "http-task".into() }).send().await.unwrap();
    assert!(resp.status().is_success());
    let body: hydra_daemon::SubmitTaskResponse = resp.json().await.unwrap();
    assert!(!body.id.is_empty());
}

#[tokio::test]
async fn daemon_http_status_reports_initial_state() {
    let env = support::TestEnv::new();
    let daemon = hydra_daemon::HydraDaemon::new(env.config).await;
    let app = daemon.daemon_router();
    let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
    let addr = listener.local_addr().unwrap();

    tokio::spawn(async move {
        axum::serve(listener, app.into_make_service()).await.ok();
    });

    let client = Client::new();
    let resp = client.get(format!("http://{addr}/status")).send().await.unwrap();
    assert!(resp.status().is_success());
    let body: hydra_daemon::DaemonStatus = resp.json().await.unwrap();
    assert!(!body.running);
    assert_eq!(body.tasks_processed, 0);
}

#[tokio::test]
async fn daemon_http_creative_returns_artifacts() {
    let env = support::TestEnv::new();
    let daemon = hydra_daemon::HydraDaemon::new(env.config).await;
    let app = daemon.daemon_router();
    let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
    let addr = listener.local_addr().unwrap();

    tokio::spawn(async move {
        axum::serve(listener, app.into_make_service()).await.ok();
    });

    let client = Client::new();
    let resp = client.post(format!("http://{addr}/creative")).json(&hydra_daemon::CreativeRequest { goal: "logo".into() }).send().await.unwrap();
    assert!(resp.status().is_success());
    let body: hydra_daemon::CreativeResponse = resp.json().await.unwrap();
    assert_eq!(body.goal, "logo");
    assert!(body.result.contains("[planned]"));
}

#[tokio::test]
async fn daemon_http_stop_returns_stopped() {
    let env = support::TestEnv::new();
    let daemon = hydra_daemon::HydraDaemon::new(env.config).await;
    let app = daemon.daemon_router();
    let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
    let addr = listener.local_addr().unwrap();

    tokio::spawn(async move {
        axum::serve(listener, app.into_make_service()).await.ok();
    });

    let client = Client::new();
    let resp = client.post(format!("http://{addr}/stop")).send().await.unwrap();
    assert!(resp.status().is_success());
}

#[tokio::test]
async fn daemon_http_emergency_stop_returns_status() {
    let env = support::TestEnv::new();
    let daemon = hydra_daemon::HydraDaemon::new(env.config).await;
    let app = daemon.daemon_router();
    let listener = tokio::net::TcpListener::bind("127.0.0.1:0").await.unwrap();
    let addr = listener.local_addr().unwrap();

    tokio::spawn(async move {
        axum::serve(listener, app.into_make_service()).await.ok();
    });

    let client = Client::new();
    let resp = client.post(format!("http://{addr}/emergency-stop")).send().await.unwrap();
    assert!(resp.status().is_success());
}
