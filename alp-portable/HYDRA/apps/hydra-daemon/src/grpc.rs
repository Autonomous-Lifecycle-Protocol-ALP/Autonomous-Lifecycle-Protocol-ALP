use std::sync::Arc;

use crate::HydraDaemon;
use crate::proto::{
    Event, InferenceRequest, InferenceResponse, TaskCreated, TaskStarted,
};
use crate::proto::hydra_daemon_server::{HydraDaemon as GrpcHydraDaemon};
use hydra_runtime::{GenerationOutput, GenerationRequest, Modality, ResourceBudget};
use tonic::{Request, Response, Status};
use tracing::{info, instrument};
use tokio_stream::StreamExt;

#[derive(Clone)]
pub struct GrpcServer {
    pub daemon: Arc<HydraDaemon>,
}

impl GrpcServer {
    pub fn new(daemon: Arc<HydraDaemon>) -> Self {
        Self { daemon }
    }
}

#[tonic::async_trait]
impl GrpcHydraDaemon for GrpcServer {
    #[instrument(skip(self))]
    async fn run_goal(
        &self,
        request: Request<TaskCreated>,
    ) -> Result<Response<TaskStarted>, Status> {
        let task = request.into_inner();
        let id = self.daemon.submit_task(task.goal).await;
        info!(task_id = %id, "gRPC RunGoal received");
        Ok(Response::new(TaskStarted { task_id: id }))
    }

    #[instrument(skip(self))]
    async fn generate(
        &self,
        request: Request<InferenceRequest>,
    ) -> Result<Response<InferenceResponse>, Status> {
        let req = request.into_inner();
        let model_manager = self.daemon.model_manager.read().await;
        let model = model_manager
            .get_model(&req.model_id)
            .ok_or_else(|| Status::not_found(format!("model {} not found", req.model_id)))?;

        let runtime_req = GenerationRequest {
            prompt: req.prompt.clone(),
            modality: Modality::Text,
            context_tokens: 0,
            resource_budget: ResourceBudget {
                max_ram_mb: 4096,
                max_cpu_percent: 80,
                timeout_seconds: 60,
            },
        };
        let result = model.infer(&runtime_req);
        let text = match result.output {
            GenerationOutput::Text(t) => t,
            _ => result.output.to_string(),
        };
        info!(model_id = %req.model_id, tokens = result.tokens_used, "gRPC Generate completed");
        Ok(Response::new(InferenceResponse {
            model_id: req.model_id,
            text,
            tokens_used: result.tokens_used as u32,
            latency_ms: result.latency_ms,
        }))
    }

    type StreamEventsStream =
        std::pin::Pin<Box<dyn tokio_stream::Stream<Item = Result<Event, Status>> + Send>>;

    #[instrument(skip(self))]
    async fn stream_events(
        &self,
        request: Request<tonic::Streaming<Event>>,
    ) -> Result<Response<Self::StreamEventsStream>, Status> {
        let mut inbound = request.into_inner();
        let (tx, rx) = tokio::sync::mpsc::channel(32);

        let daemon = self.daemon.clone();
        tokio::spawn(async move {
            while let Ok(Some(event)) = inbound.message().await {
                info!(?event, "gRPC event received");
                let _ = daemon.submit_task(format!("gRPC event: {:?}", event)).await;
            }
            drop(tx);
        });

        let output = tokio_stream::wrappers::ReceiverStream::new(rx).map(Ok);
        Ok(Response::new(Box::pin(output) as Self::StreamEventsStream))
    }
}
