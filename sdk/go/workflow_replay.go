package alpgo

import (
	"fmt"
	"time"
)

// WorkflowReplayEngine — v80.0.0 Temporal Workflow Replay Engine
// Provides deterministic capture, time-travel debugging, step-back/step-forward
// replay, and diff comparison for autonomous agent execution traces.

// ReplayStatus tracks workflow trace lifecycle.
type ReplayStatus string

const (
	ReplayCapturing ReplayStatus = "CAPTURING"
	ReplayCompleted ReplayStatus = "COMPLETED"
	ReplayReplaying ReplayStatus = "REPLAYING"
)

// ReplayStep represents an atomic step snapshot in an execution trace.
type ReplayStep struct {
	StepIndex     int                    `json:"step_index"`
	Action        string                 `json:"action"`
	AgentID       string                 `json:"agent_id"`
	StateSnapshot map[string]interface{} `json:"state_snapshot"`
	Output        string                 `json:"output"`
	Timestamp     string                 `json:"timestamp"`
}

// ReplayTrace represents a captured workflow trace.
type ReplayTrace struct {
	TraceID    string       `json:"trace_id"`
	WorkflowID string       `json:"workflow_id"`
	Steps      []ReplayStep `json:"steps"`
	Status     ReplayStatus `json:"status"`
	CapturedAt string       `json:"captured_at"`
}

// ReplayDiff represents divergent steps when comparing two traces.
type ReplayDiff struct {
	StepIndex          int    `json:"step_index"`
	BaseAction         string `json:"base_action"`
	CompareAction      string `json:"compare_action"`
	HasStateDivergence bool   `json:"has_state_divergence"`
}

// WorkflowReplayEngine manages and replays execution traces.
type WorkflowReplayEngine struct {
	traces            map[string]*ReplayTrace
	activeStepPointer map[string]int
}

// NewWorkflowReplayEngine creates a new WorkflowReplayEngine instance.
func NewWorkflowReplayEngine() *WorkflowReplayEngine {
	return &WorkflowReplayEngine{
		traces:            make(map[string]*ReplayTrace),
		activeStepPointer: make(map[string]int),
	}
}

// StartTrace starts capturing a new execution trace for a workflow.
func (e *WorkflowReplayEngine) StartTrace(workflowID string) *ReplayTrace {
	traceID := fmt.Sprintf("trace-%s-%d", workflowID, time.Now().UnixNano())
	trace := &ReplayTrace{
		TraceID:    traceID,
		WorkflowID: workflowID,
		Steps:      make([]ReplayStep, 0),
		Status:     ReplayCapturing,
		CapturedAt: time.Now().UTC().Format(time.RFC3339),
	}
	e.traces[traceID] = trace
	e.activeStepPointer[traceID] = 0
	return trace
}

// CaptureStep records a single step snapshot into the active trace.
func (e *WorkflowReplayEngine) CaptureStep(traceID, action, agentID string, stateSnapshot map[string]interface{}, output string) *ReplayStep {
	trace, exists := e.traces[traceID]
	if !exists || trace.Status == ReplayCompleted {
		return nil
	}

	if stateSnapshot == nil {
		stateSnapshot = make(map[string]interface{})
	}

	stepIndex := len(trace.Steps)
	step := ReplayStep{
		StepIndex:     stepIndex,
		Action:        action,
		AgentID:       agentID,
		StateSnapshot: stateSnapshot,
		Output:        output,
		Timestamp:     time.Now().UTC().Format(time.RFC3339),
	}

	trace.Steps = append(trace.Steps, step)
	return &step
}

// CompleteTrace seals the trace for replay.
func (e *WorkflowReplayEngine) CompleteTrace(traceID string) bool {
	trace, exists := e.traces[traceID]
	if !exists {
		return false
	}
	trace.Status = ReplayCompleted
	return true
}

// SeekToStep moves the replay pointer to a specific step index.
func (e *WorkflowReplayEngine) SeekToStep(traceID string, stepIndex int) *ReplayStep {
	trace, exists := e.traces[traceID]
	if !exists || stepIndex < 0 || stepIndex >= len(trace.Steps) {
		return nil
	}

	e.activeStepPointer[traceID] = stepIndex
	return &trace.Steps[stepIndex]
}

// StepForward steps forward in the replay trajectory.
func (e *WorkflowReplayEngine) StepForward(traceID string) *ReplayStep {
	current, exists := e.activeStepPointer[traceID]
	if !exists {
		current = 0
	}
	return e.SeekToStep(traceID, current+1)
}

// StepBackward steps backward in the replay trajectory.
func (e *WorkflowReplayEngine) StepBackward(traceID string) *ReplayStep {
	current, exists := e.activeStepPointer[traceID]
	if !exists {
		current = 0
	}
	return e.SeekToStep(traceID, current-1)
}

// CompareTraces compares two replay traces to detect divergence.
func (e *WorkflowReplayEngine) CompareTraces(baseTraceID, compareTraceID string) []ReplayDiff {
	baseTrace, baseExists := e.traces[baseTraceID]
	compareTrace, compareExists := e.traces[compareTraceID]

	if !baseExists || !compareExists {
		return nil
	}

	maxSteps := len(baseTrace.Steps)
	if len(compareTrace.Steps) > maxSteps {
		maxSteps = len(compareTrace.Steps)
	}

	diffs := make([]ReplayDiff, 0, maxSteps)
	for i := 0; i < maxSteps; i++ {
		baseAction := "<NONE>"
		if i < len(baseTrace.Steps) {
			baseAction = baseTrace.Steps[i].Action
		}

		compareAction := "<NONE>"
		if i < len(compareTrace.Steps) {
			compareAction = compareTrace.Steps[i].Action
		}

		diffs = append(diffs, ReplayDiff{
			StepIndex:          i,
			BaseAction:         baseAction,
			CompareAction:      compareAction,
			HasStateDivergence: baseAction != compareAction,
		})
	}

	return diffs
}

// GetTrace retrieves a trace by ID.
func (e *WorkflowReplayEngine) GetTrace(traceID string) *ReplayTrace {
	return e.traces[traceID]
}
