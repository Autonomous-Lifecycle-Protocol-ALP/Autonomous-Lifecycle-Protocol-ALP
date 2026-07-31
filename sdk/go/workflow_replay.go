package alp

import (
	"fmt"
	"time"
)

// WorkflowReplayEngine — v76.0.0 Temporal Workflow Replay Engine
// Deterministic capture, time-travel debugging, step-back/step-forward replay.

type ReplayStep struct {
	StepIndex     int                    `json:"step_index"`
	Action        string                 `json:"action"`
	AgentID       string                 `json:"agent_id"`
	StateSnapshot map[string]interface{} `json:"state_snapshot"`
	Output        string                 `json:"output"`
	Timestamp     string                 `json:"timestamp"`
}

type ReplayTrace struct {
	TraceID    string        `json:"trace_id"`
	WorkflowID string        `json:"workflow_id"`
	Steps      []*ReplayStep `json:"steps"`
	Status     string        `json:"status"`
	CapturedAt string        `json:"captured_at"`
}

type WorkflowReplayEngine struct {
	traces map[string]*ReplayTrace
}

func NewWorkflowReplayEngine() *WorkflowReplayEngine {
	return &WorkflowReplayEngine{
		traces: make(map[string]*ReplayTrace),
	}
}

func (wre *WorkflowReplayEngine) StartTrace(workflowID string) *ReplayTrace {
	traceID := fmt.Sprintf("trace-%s-%d", workflowID, time.Now().UnixNano())
	trace := &ReplayTrace{
		TraceID:    traceID,
		WorkflowID: workflowID,
		Steps:      make([]*ReplayStep, 0),
		Status:     "CAPTURING",
		CapturedAt: time.Now().UTC().Format(time.RFC3339),
	}
	wre.traces[traceID] = trace
	return trace
}

func (wre *WorkflowReplayEngine) CaptureStep(traceID, action, agentID string, snapshot map[string]interface{}, output string) *ReplayStep {
	trace, ok := wre.traces[traceID]
	if !ok || trace.Status == "COMPLETED" {
		return nil
	}
	stepIndex := len(trace.Steps)
	step := &ReplayStep{
		StepIndex:     stepIndex,
		Action:        action,
		AgentID:       agentID,
		StateSnapshot: snapshot,
		Output:        output,
		Timestamp:     time.Now().UTC().Format(time.RFC3339),
	}
	trace.Steps = append(trace.Steps, step)
	return step
}

func (wre *WorkflowReplayEngine) CompleteTrace(traceID string) bool {
	trace, ok := wre.traces[traceID]
	if !ok {
		return false
	}
	trace.Status = "COMPLETED"
	return true
}

func (wre *WorkflowReplayEngine) GetTrace(traceID string) *ReplayTrace {
	return wre.traces[traceID]
}
