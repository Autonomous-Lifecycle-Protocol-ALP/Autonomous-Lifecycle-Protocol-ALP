package alpgo

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"sync"
	"time"
)

const (
	healingDir  = ".healing"
	healingFile = "healing.jsonl"
)

type HealingStrategy string

const (
	HealingStrategyRetry    HealingStrategy = "retry"
	HealingStrategySkip     HealingStrategy = "skip"
	HealingStrategyRollback HealingStrategy = "rollback"
	HealingStrategyEscalate HealingStrategy = "escalate"
)

type HealingContext struct {
	TaskID      string
	WorkflowID  string
	Attempt     int
	Error       string
	Timestamp   string
	Metadata    map[string]interface{}
}

type HealingAction struct {
	Strategy   HealingStrategy
	TaskID     string
	WorkflowID string
	Attempt    int
	Reason     string
	Succeeded  bool
	Timestamp  string
	Metadata   map[string]interface{}
}

func (a HealingAction) ToMap() map[string]interface{} {
	return map[string]interface{}{
		"strategy":   string(a.Strategy),
		"task_id":    a.TaskID,
		"workflow_id": a.WorkflowID,
		"attempt":    a.Attempt,
		"reason":     a.Reason,
		"succeeded":  a.Succeeded,
		"timestamp":  a.Timestamp,
		"metadata":   a.Metadata,
	}
}

type HealingReport struct {
	WorkflowID string
	Actions    []HealingAction
	StartedAt  string
	FinishedAt string
}

func (r *HealingReport) AddAction(action HealingAction) {
	r.Actions = append(r.Actions, action)
}

func (r HealingReport) ToMap() map[string]interface{} {
	succeeded := 0
	failed := 0
	for _, a := range r.Actions {
		if a.Succeeded {
			succeeded++
		} else {
			failed++
		}
	}
	return map[string]interface{}{
		"workflow_id":   r.WorkflowID,
		"started_at":    r.StartedAt,
		"finished_at":   r.FinishedAt,
		"actions":       actionsToMaps(r.Actions),
		"total_actions": len(r.Actions),
		"succeeded":     succeeded,
		"failed":        failed,
	}
}

func (r HealingReport) Summary() string {
	d := r.ToMap()
	return fmt.Sprintf("HealingReport(workflow=%s, actions=%d, succeeded=%d, failed=%d)",
		d["workflow_id"], d["total_actions"], d["succeeded"], d["failed"])
}

func actionsToMaps(actions []HealingAction) []map[string]interface{} {
	out := make([]map[string]interface{}, len(actions))
	for i, a := range actions {
		out[i] = a.ToMap()
	}
	return out
}

func nowISO() string {
	return time.Now().UTC().Format(time.RFC3339)
}

type CircuitBreaker struct {
	FailureThreshold int
	RecoveryTimeout  time.Duration
	mu               sync.Mutex
	failures         map[string]int
	lastFailureTS    map[string]time.Time
}

func NewCircuitBreaker(failureThreshold int, recoveryTimeout time.Duration) *CircuitBreaker {
	return &CircuitBreaker{
		FailureThreshold: failureThreshold,
		RecoveryTimeout:  recoveryTimeout,
		failures:        make(map[string]int),
		lastFailureTS:   make(map[string]time.Time),
	}
}

func (cb *CircuitBreaker) RecordFailure(taskID string) {
	cb.mu.Lock()
	defer cb.mu.Unlock()
	cb.failures[taskID]++
	cb.lastFailureTS[taskID] = time.Now()
}

func (cb *CircuitBreaker) RecordSuccess(taskID string) {
	cb.mu.Lock()
	defer cb.mu.Unlock()
	delete(cb.failures, taskID)
	delete(cb.lastFailureTS, taskID)
}

func (cb *CircuitBreaker) IsOpen(taskID string) bool {
	cb.mu.Lock()
	defer cb.mu.Unlock()
	failures := cb.failures[taskID]
	if failures < cb.FailureThreshold {
		return false
	}
	last := cb.lastFailureTS[taskID]
	if time.Since(last) > cb.RecoveryTimeout {
		delete(cb.failures, taskID)
		delete(cb.lastFailureTS, taskID)
		return false
	}
	return true
}

func (cb *CircuitBreaker) Reset(taskID string) {
	cb.mu.Lock()
	defer cb.mu.Unlock()
	delete(cb.failures, taskID)
	delete(cb.lastFailureTS, taskID)
}

type HealingEngine struct {
	alpDir           string
	Version          string
	CircuitBreaker   *CircuitBreaker
	MaxAttempts      int
	DefaultStrategy  HealingStrategy
	mu               sync.Mutex
	Reports          map[string]*HealingReport
}

func NewHealingEngine(alpDir string, version string, circuitBreaker *CircuitBreaker, maxAttempts int, defaultStrategy HealingStrategy) *HealingEngine {
	if circuitBreaker == nil {
		circuitBreaker = NewCircuitBreaker(3, 60*time.Second)
	}
	if version == "" {
		version = "16.1.0"
	}
	if defaultStrategy == "" {
		defaultStrategy = HealingStrategyRetry
	}
	return &HealingEngine{
		alpDir:          alpDir,
		Version:         version,
		CircuitBreaker:  circuitBreaker,
		MaxAttempts:     maxAttempts,
		DefaultStrategy: defaultStrategy,
		Reports:         make(map[string]*HealingReport),
	}
}

func (e *HealingEngine) healingPath() (string, error) {
	d := filepath.Join(e.alpDir, healingDir)
	if err := os.MkdirAll(d, 0755); err != nil {
		return "", err
	}
	return filepath.Join(d, healingFile), nil
}

func (e *HealingEngine) appendAction(action HealingAction) error {
	path, err := e.healingPath()
	if err != nil {
		return err
	}
	f, err := os.OpenFile(path, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
	if err != nil {
		return err
	}
	defer f.Close()

	data, err := json.Marshal(action.ToMap())
	if err != nil {
		return err
	}
	_, err = f.Write(append(data, '\n'))
	return err
}

func (e *HealingEngine) selectStrategy(ctx HealingContext) HealingStrategy {
	if e.CircuitBreaker.IsOpen(ctx.TaskID) {
		return HealingStrategyEscalate
	}
	if ctx.Attempt >= e.MaxAttempts {
		return HealingStrategyEscalate
	}
	if containsLower(ctx.Error, "cannot retry") {
		return HealingStrategySkip
	}
	if ctx.Metadata != nil {
		if _, ok := ctx.Metadata["checkpoint"]; ok && ctx.Attempt > 1 {
			return HealingStrategyRollback
		}
	}
	return e.DefaultStrategy
}

func containsLower(s, substr string) bool {
	return len(s) >= len(substr) && (s == substr || containsLowerInner(s, substr))
}

func containsLowerInner(s, substr string) bool {
	for i := 0; i <= len(s)-len(substr); i++ {
		if toLower(s[i:i+len(substr)]) == toLower(substr) {
			return true
		}
	}
	return false
}

func toLower(s string) string {
	out := make([]byte, len(s))
	for i := range s {
		c := s[i]
		if c >= 'A' && c <= 'Z' {
			out[i] = c + ('a' - 'A')
		} else {
			out[i] = c
		}
	}
	return string(out)
}

func (e *HealingEngine) Heal(taskID, errorStr string, attempt int, executor func(HealingContext) error, workflowID string, context map[string]interface{}) *HealingReport {
	wfID := workflowID
	if wfID == "" {
		wfID = "_global"
	}

	e.mu.Lock()
	if e.Reports[wfID] == nil {
		e.Reports[wfID] = &HealingReport{WorkflowID: wfID, StartedAt: nowISO()}
	}
	report := e.Reports[wfID]
	e.mu.Unlock()

	ctx := HealingContext{
		TaskID:     taskID,
		WorkflowID: workflowID,
		Attempt:    attempt,
		Error:      errorStr,
		Timestamp:  nowISO(),
		Metadata:   context,
	}

	strategy := e.selectStrategy(ctx)
	succeeded := false
	reason := ""

	switch strategy {
	case HealingStrategyRetry:
		err := executor(ctx)
		if err == nil {
			succeeded = true
			reason = "Retry succeeded"
			e.CircuitBreaker.RecordSuccess(taskID)
		} else {
			succeeded = false
			reason = fmt.Sprintf("Retry failed: %v", err)
			e.CircuitBreaker.RecordFailure(taskID)
		}
	case HealingStrategySkip:
		reason = "Skipped with justification: non-retryable error"
		succeeded = true
	case HealingStrategyRollback:
		err := executor(ctx)
		if err == nil {
			succeeded = true
			reason = "Rollback and re-execute succeeded"
			e.CircuitBreaker.RecordSuccess(taskID)
		} else {
			succeeded = false
			reason = fmt.Sprintf("Rollback failed: %v", err)
			e.CircuitBreaker.RecordFailure(taskID)
		}
	case HealingStrategyEscalate:
		reason = "Escalated to human-in-the-loop: circuit breaker open or max attempts reached"
		succeeded = false
		e.CircuitBreaker.RecordFailure(taskID)
	}

	action := HealingAction{
		Strategy:   strategy,
		TaskID:     taskID,
		WorkflowID: workflowID,
		Attempt:    attempt,
		Reason:     reason,
		Succeeded:  succeeded,
		Timestamp:  nowISO(),
		Metadata:   map[string]interface{}{"error": errorStr},
	}
	report.AddAction(action)
	_ = e.appendAction(action)
	return report
}

func (e *HealingEngine) GetReport(workflowID string) *HealingReport {
	e.mu.Lock()
	defer e.mu.Unlock()
	return e.Reports[workflowID]
}

func (e *HealingEngine) ReadPastActions(workflowID string) ([]map[string]interface{}, error) {
	path, err := e.healingPath()
	if err != nil {
		return nil, err
	}
	data, err := os.ReadFile(path)
	if err != nil {
		if os.IsNotExist(err) {
			return nil, nil
		}
		return nil, err
	}
	var actions []map[string]interface{}
	lines := splitLines(string(data))
	for _, line := range lines {
		if line == "" {
			continue
		}
		var m map[string]interface{}
		if err := json.Unmarshal([]byte(line), &m); err != nil {
			continue
		}
		if workflowID == "" || m["workflow_id"] == workflowID {
			actions = append(actions, m)
		}
	}
	return actions, nil
}
