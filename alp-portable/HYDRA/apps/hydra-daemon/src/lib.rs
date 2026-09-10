use std::sync::Arc;
use tokio::sync::{RwLock, mpsc};
use axum::{
    Router,
    routing::{get, post},
    Json,
};
use serde::{Deserialize, Serialize};
use tracing::{info, warn, instrument};
use hydra_core::{HydraConfig};
use hydra_core::hardware::HardwareProfile;
use hydra_runtime::{ModelManager, ModelAdapter, ResourceBudget};
use hydra_scheduler::Scheduler;
use hydra_health::HealthMonitor;
use hydra_security::kill_switch::KillSwitch;
use hydra_orchestrator::{Pipeline, CreativePipeline, CreativeArtifact};

mod grpc;
pub mod proto;
pub use grpc::GrpcServer;

#[derive(Clone)]
pub struct HydraDaemon {
    pub config: HydraConfig,
    pub hardware: HardwareProfile,
    pub model_manager: Arc<RwLock<ModelManager>>,
    pub scheduler: Arc<Scheduler>,
    pub health: Arc<RwLock<HealthMonitor>>,
    pub kill_switch: Arc<RwLock<KillSwitch>>,
    pub state: Arc<RwLock<DaemonState>>,
    pub creative: Arc<RwLock<CreativePipeline>>,
    shutdown_tx: mpsc::Sender<()>,
    shutdown_rx: Arc<RwLock<Option<mpsc::Receiver<()>>>>,
}

#[derive(Clone)]
pub struct DaemonState {
    pub running: bool,
    pub tasks_processed: usize,
    pub start_time: Option<std::time::Instant>,
}

impl HydraDaemon {
    pub async fn new(config: HydraConfig) -> Self {
        let hardware = HardwareProfile::detect();
        let model_manager = Arc::new(RwLock::new(ModelManager::new()));
        let scheduler = Arc::new(Scheduler::new(config.max_concurrency));
        let health = Arc::new(RwLock::new(HealthMonitor::new()));
        let kill_switch = Arc::new(RwLock::new(KillSwitch::new()));
        let (shutdown_tx, shutdown_rx) = mpsc::channel::<()>(1);

        let mut health_guard = health.write().await;
        health_guard.register(hydra_health::HealthCheck {
            name: "daemon".into(),
            status: hydra_health::HealthStatus::Healthy,
            last_check: "boot".into(),
        });
        drop(health_guard);

        let creative = Arc::new(RwLock::new(CreativePipeline::new(
            ModelManager::new(),
            ResourceBudget { max_ram_mb: hardware.available_ram_mb.max(hardware.total_ram_mb), max_cpu_percent: 80, timeout_seconds: 60 },
        )));

        Self {
            config,
            hardware,
            model_manager,
            scheduler,
            health,
            kill_switch,
            state: Arc::new(RwLock::new(DaemonState {
                running: false,
                tasks_processed: 0,
                start_time: None,
            })),
            creative,
            shutdown_tx,
            shutdown_rx: Arc::new(RwLock::new(Some(shutdown_rx))),
        }
    }

    #[instrument(skip(self))]
    pub async fn start(&self) {
        let mut state = self.state.write().await;
        state.running = true;
        state.start_time = Some(std::time::Instant::now());
        drop(state);

        let discovered = self.discover_models().await;
        info!(model_count = discovered.len(), "daemon starting");

        let scheduler = self.scheduler.clone();
        let state = self.state.clone();
        let kill_switch = self.kill_switch.clone();
        let mut shutdown_rx = self.shutdown_rx.write().await.take().expect("shutdown receiver");

        tokio::spawn(async move {
            loop {
                if kill_switch.read().await.is_active() {
                    warn!("kill switch activated; stopping daemon loop");
                    break;
                }

                if let Ok(()) = shutdown_rx.try_recv() {
                    warn!("shutdown signal received; stopping daemon loop");
                    break;
                }

                match scheduler.process_next(|payload| {
                    let pipeline = Pipeline::new();
                    pipeline.run(&payload)
                }).await {
                    Some(hydra_scheduler::JobStatus::Completed(result)) => {
                        let mut s = state.write().await;
                        s.tasks_processed += 1;
                        info!(task_result = %result, "task completed");
                    }
                    Some(hydra_scheduler::JobStatus::Failed(err)) => {
                        warn!(error = %err, "task failed");
                    }
                    None => {
                        tokio::time::sleep(std::time::Duration::from_millis(50)).await;
                    }
                    _ => {}
                }
            }

            let mut s = state.write().await;
            s.running = false;
            info!("HYDRA daemon stopped");
        });
    }

    #[instrument(skip(self))]
    pub async fn stop(&self) {
        let _ = self.shutdown_tx.send(()).await;
        let mut state = self.state.write().await;
        state.running = false;
        info!("daemon stop requested");
    }

    pub async fn discover_models(&self) -> Vec<ModelAdapter> {
        let mut manager = self.model_manager.write().await;
        manager.discover(&self.config.model_dir)
    }

    #[instrument(skip(self, payload))]
    pub async fn submit_task(&self, payload: impl Into<String>) -> String {
        let job = hydra_scheduler::Job::new(
            uuid::Uuid::new_v4().to_string(),
            payload,
        );
        let id = job.id.clone();
        self.scheduler.enqueue(job).await;
        info!(task_id = %id, "task submitted");
        id
    }

    #[instrument(skip(self))]
    pub async fn status(&self) -> DaemonStatus {
        let state = self.state.read().await;
        let mut manager = self.model_manager.write().await;
        let model_count = manager.discover(&self.config.model_dir).len();
        info!(running = state.running, tasks_processed = state.tasks_processed, models_loaded = model_count, uptime = ?state.start_time.map(|t| t.elapsed().as_secs()), "daemon status checked");
        DaemonStatus {
            running: state.running,
            tasks_processed: state.tasks_processed,
            models_loaded: model_count,
            uptime: state.start_time.map(|t| t.elapsed().as_secs()),
        }
    }

    #[instrument(skip(self, addr))]
    pub async fn serve(&self, addr: std::net::SocketAddr) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        let state = self.state.clone();
        let scheduler = self.scheduler.clone();
        let kill_switch = self.kill_switch.clone();
        let creative = self.creative.clone();
        let shutdown_tx = self.shutdown_tx.clone();

        self.start().await;
        info!(%addr, "daemon HTTP server starting");

        let app = Router::new()
            .route("/task", post({
                let scheduler = scheduler.clone();
                let state = state.clone();
                move |payload| submit_task_handler(scheduler, state, payload)
            }))
            .route("/creative", post({
                let creative = creative.clone();
                move |payload| creative_handler(creative, payload)
            }))
            .route("/status", get({
                let state = state.clone();
                move || status_handler(state.clone())
            }))
            .route("/stop", post({
                let shutdown_tx = shutdown_tx.clone();
                move || async move { stop_handler(shutdown_tx).await }
            }))
            .route("/emergency-stop", post({
                let kill_switch = kill_switch.clone();
                move || async move { emergency_stop_handler(kill_switch).await }
            }));

        let listener = tokio::net::TcpListener::bind(addr).await?;
        info!("HYDRA daemon listening on http://{addr}");
        axum::serve(listener, app.into_make_service()).await?;
        Ok(())
    }

    pub fn daemon_router(self) -> Router {
        let state = self.state.clone();
        let scheduler = self.scheduler.clone();
        let kill_switch = self.kill_switch.clone();
        let creative = self.creative.clone();
        let shutdown_tx = self.shutdown_tx.clone();
        Router::new()
            .route("/task", post({
                let scheduler = scheduler.clone();
                let state = state.clone();
                move |payload| submit_task_handler(scheduler, state, payload)
            }))
            .route("/creative", post({
                let creative = creative.clone();
                move |payload| creative_handler(creative, payload)
            }))
            .route("/status", get({
                let state = state.clone();
                move || status_handler(state.clone())
            }))
            .route("/stop", post({
                let shutdown_tx = shutdown_tx.clone();
                move || async move { stop_handler(shutdown_tx).await }
            }))
            .route("/emergency-stop", post({
                let kill_switch = kill_switch.clone();
                move || async move { emergency_stop_handler(kill_switch).await }
            }))
    }

    pub async fn serve_grpc(&self, addr: std::net::SocketAddr) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        use tonic::transport::Server;
        use crate::proto::hydra_daemon_server::HydraDaemonServer;
        let server = GrpcServer::new(Arc::new(self.clone()));
        info!(%addr, "HYDRA daemon gRPC server starting");
        Server::builder()
            .add_service(HydraDaemonServer::new(server))
            .serve(addr)
            .await?;
        Ok(())
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SubmitTaskRequest {
    pub goal: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SubmitTaskResponse {
    pub id: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreativeRequest {
    pub goal: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreativeResponse {
    pub goal: String,
    pub result: String,
    pub artifacts: Vec<CreativeArtifact>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum StopResponse {
    Stopped,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EmergencyStopResponse {
    pub status: String,
}

pub async fn submit_task_handler(
    scheduler: Arc<Scheduler>,
    _state: Arc<RwLock<DaemonState>>,
    Json(req): Json<SubmitTaskRequest>,
) -> Json<SubmitTaskResponse> {
    let id = scheduler.enqueue(hydra_scheduler::Job::new(
        uuid::Uuid::new_v4().to_string(),
        req.goal,
    )).await;
    Json(SubmitTaskResponse { id })
}

pub async fn creative_handler(
    creative: Arc<RwLock<CreativePipeline>>,
    Json(req): Json<CreativeRequest>,
) -> Json<CreativeResponse> {
    let pipeline = creative.read().await;
    let result = pipeline.run(&req.goal);

    Json(CreativeResponse {
        goal: result.goal,
        result: result.summary,
        artifacts: result.artifacts,
    })
}

pub async fn status_handler(
    daemon_state: Arc<RwLock<DaemonState>>,
) -> Json<DaemonStatus> {
    let state_guard = daemon_state.read().await;
    Json(DaemonStatus {
        running: state_guard.running,
        tasks_processed: state_guard.tasks_processed,
        models_loaded: 0,
        uptime: state_guard.start_time.map(|t| t.elapsed().as_secs()),
    })
}

pub async fn stop_handler(
    shutdown_tx: mpsc::Sender<()>,
) -> Json<StopResponse> {
    let _ = shutdown_tx.send(()).await;
    Json(StopResponse::Stopped)
}

pub async fn emergency_stop_handler(
    kill_switch: Arc<RwLock<KillSwitch>>,
) -> Json<EmergencyStopResponse> {
    kill_switch.write().await.trigger();
    Json(EmergencyStopResponse { status: "kill switch activated".into() })
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct DaemonStatus {
    pub running: bool,
    pub tasks_processed: usize,
    pub models_loaded: usize,
    pub uptime: Option<u64>,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn daemon_submit_task_returns_id() {
        let config = HydraConfig::default();
        let daemon = HydraDaemon::new(config).await;
        let id = daemon.submit_task("test payload").await;
        assert!(!id.is_empty());
    }

    #[tokio::test]
    async fn daemon_status_reports_initial_state() {
        let config = HydraConfig::default();
        let daemon = HydraDaemon::new(config).await;
        let status = daemon.status().await;
        assert!(!status.running);
        assert_eq!(status.tasks_processed, 0);
    }

    #[tokio::test]
    async fn daemon_processes_submitted_task() {
        let config = HydraConfig::default();
        let daemon = HydraDaemon::new(config).await;
        daemon.kill_switch.write().await.trigger();
        daemon.start().await;
        let id = daemon.submit_task("execute goal").await;
        assert!(!id.is_empty());
        for _ in 0..20 {
            let status = daemon.status().await;
            if status.tasks_processed > 0 {
                assert!(status.running);
                daemon.stop().await;
                return;
            }
            tokio::time::sleep(std::time::Duration::from_millis(50)).await;
        }
        panic!("task was not processed by daemon event loop");
    }

    #[tokio::test]
    async fn daemon_creative_handler_returns_result() {
        let config = HydraConfig::default();
        let daemon = HydraDaemon::new(config).await;
        let req = Json(CreativeRequest { goal: "Create a logo".into() });
        let resp = creative_handler(daemon.creative.clone(), req).await;
        assert_eq!(resp.goal, "Create a logo");
        assert!(resp.result.contains("[planned]"));
    }
}

