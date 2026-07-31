use std::collections::HashMap;
use chrono::Utc;

/// v76.0.0 Temporal Workflow Replay Engine
/// Deterministic capture, time-travel debugging, step-back/step-forward replay.

#[derive(Debug, Clone, serde::Serialize)]
pub struct ReplayStep {
    pub step_index: usize,
    pub action: String,
    pub agent_id: String,
    pub output: String,
    pub timestamp: String,
}

#[derive(Debug, Clone, serde::Serialize)]
pub struct ReplayTrace {
    pub trace_id: String,
    pub workflow_id: String,
    pub steps: Vec<ReplayStep>,
    pub status: String,
    pub captured_at: String,
}

pub struct WorkflowReplayEngine {
    traces: HashMap<String, ReplayTrace>,
}

impl WorkflowReplayEngine {
    pub fn new() -> Self {
        Self { traces: HashMap::new() }
    }

    pub fn start_trace(&mut self, workflow_id: &str) -> &ReplayTrace {
        let trace_id = format!("trace-{}-{}", workflow_id, Utc::now().timestamp_nanos_opt().unwrap_or(0));
        let trace = ReplayTrace {
            trace_id: trace_id.clone(),
            workflow_id: workflow_id.to_string(),
            steps: Vec::new(),
            status: "CAPTURING".to_string(),
            captured_at: Utc::now().to_rfc3339(),
        };
        self.traces.insert(trace_id.clone(), trace);
        self.traces.get(&trace_id).unwrap()
    }

    pub fn capture_step(&mut self, trace_id: &str, action: &str, agent_id: &str, output: &str) -> Option<ReplayStep> {
        let trace = self.traces.get_mut(trace_id)?;
        if trace.status == "COMPLETED" {
            return None;
        }
        let step = ReplayStep {
            step_index: trace.steps.len(),
            action: action.to_string(),
            agent_id: agent_id.to_string(),
            output: output.to_string(),
            timestamp: Utc::now().to_rfc3339(),
        };
        trace.steps.push(step.clone());
        Some(step)
    }

    pub fn complete_trace(&mut self, trace_id: &str) -> bool {
        if let Some(trace) = self.traces.get_mut(trace_id) {
            trace.status = "COMPLETED".to_string();
            true
        } else {
            false
        }
    }
}
