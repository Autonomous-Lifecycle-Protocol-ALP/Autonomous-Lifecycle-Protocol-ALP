package alpgo

import (
	"encoding/json"
	"errors"
	"os"
	"testing"
	"time"
)

func TestHealingStrategyValues(t *testing.T) {
	assertEqual(t, string(HealingStrategyRetry), "retry")
	assertEqual(t, string(HealingStrategySkip), "skip")
	assertEqual(t, string(HealingStrategyRollback), "rollback")
	assertEqual(t, string(HealingStrategyEscalate), "escalate")
}

func TestHealingActionToMap(t *testing.T) {
	action := HealingAction{
		Strategy:   HealingStrategyRetry,
		TaskID:     "t1",
		WorkflowID: "wf1",
		Attempt:    2,
		Reason:     "Retry succeeded",
		Succeeded:  true,
		Timestamp:  "2026-01-01T00:00:00Z",
		Metadata:   map[string]interface{}{"key": "val"},
	}
	d := action.ToMap()
	assertEqual(t, d["strategy"], "retry")
	assertEqual(t, d["task_id"], "t1")
	assertEqual(t, d["attempt"], 2)
	assertEqual(t, d["succeeded"], true)
}

func TestHealingReportAddActionAndSummary(t *testing.T) {
	report := HealingReport{WorkflowID: "wf1"}
	report.AddAction(HealingAction{Strategy: HealingStrategyRetry, TaskID: "t1", WorkflowID: "wf1", Attempt: 1, Reason: "ok", Succeeded: true})
	report.AddAction(HealingAction{Strategy: HealingStrategySkip, TaskID: "t2", WorkflowID: "wf1", Attempt: 1, Reason: "skipped", Succeeded: true})
	report.FinishedAt = "2026-01-01T00:00:01Z"
	d := report.ToMap()
	assertEqual(t, d["total_actions"], 2)
	assertEqual(t, d["succeeded"], 2)
	assertEqual(t, d["failed"], 0)
	s := report.Summary()
	assertContains(t, s, "wf1")
	assertContains(t, s, "actions=2")
}

func TestHealingReportEmpty(t *testing.T) {
	report := HealingReport{WorkflowID: "wf1"}
	d := report.ToMap()
	assertEqual(t, d["total_actions"], 0)
	assertEqual(t, d["succeeded"], 0)
	assertEqual(t, d["failed"], 0)
}

func TestCircuitBreakerClosedInitially(t *testing.T) {
	cb := NewCircuitBreaker(2, 0)
	assertFalse(t, cb.IsOpen("t1"))
}

func TestCircuitBreakerOpensAfterThreshold(t *testing.T) {
	cb := NewCircuitBreaker(2, 0)
	cb.RecordFailure("t1")
	assertFalse(t, cb.IsOpen("t1"))
	cb.RecordFailure("t1")
	assertTrue(t, cb.IsOpen("t1"))
}

func TestCircuitBreakerSuccessResets(t *testing.T) {
	cb := NewCircuitBreaker(2, 0)
	cb.RecordFailure("t1")
	cb.RecordSuccess("t1")
	assertFalse(t, cb.IsOpen("t1"))
}

func TestCircuitBreakerResetClears(t *testing.T) {
	cb := NewCircuitBreaker(2, 0)
	cb.RecordFailure("t1")
	cb.RecordFailure("t1")
	assertTrue(t, cb.IsOpen("t1"))
	cb.Reset("t1")
	assertFalse(t, cb.IsOpen("t1"))
}

func TestCircuitBreakerRecoveryTimeout(t *testing.T) {
	cb := NewCircuitBreaker(2, 10*time.Millisecond)
	cb.RecordFailure("t1")
	cb.RecordFailure("t1")
	assertTrue(t, cb.IsOpen("t1"))
	time.Sleep(20 * time.Millisecond)
	assertFalse(t, cb.IsOpen("t1"))
}

func TestHealingEngineRetrySucceeds(t *testing.T) {
	tmpdir, err := os.MkdirTemp("", "healing-test")
	if err != nil {
		t.Fatal(err)
	}
	defer os.RemoveAll(tmpdir)

	engine := NewHealingEngine(tmpdir, "", nil, 2, HealingStrategyRetry)
	var ctx HealingContext
	report := engine.Heal("t1", "transient", 1, func(c HealingContext) error {
		ctx = c
		return nil
	}, "", nil)
	assertEqual(t, len(report.Actions), 1)
	assertEqual(t, report.Actions[0].Strategy, HealingStrategyRetry)
	assertTrue(t, report.Actions[0].Succeeded)
	assertEqual(t, report.Actions[0].Reason, "Retry succeeded")
	assertEqual(t, ctx.TaskID, "t1")
}

func TestHealingEngineRetryFailsEscalates(t *testing.T) {
	tmpdir, err := os.MkdirTemp("", "healing-test")
	if err != nil {
		t.Fatal(err)
	}
	defer os.RemoveAll(tmpdir)

	engine := NewHealingEngine(tmpdir, "", nil, 2, HealingStrategyRetry)
	engine.Heal("t1", "always fails", 1, func(c HealingContext) error {
		return nil
	}, "", nil)
	report := engine.Heal("t1", "always fails", 2, func(c HealingContext) error {
		return nil
	}, "", nil)
	assertEqual(t, len(report.Actions), 2)
	assertEqual(t, report.Actions[1].Strategy, HealingStrategyEscalate)
	assertFalse(t, report.Actions[1].Succeeded)
	assertContains(t, report.Actions[1].Reason, "max attempts")
}

func TestHealingEngineSkipNonRetryable(t *testing.T) {
	tmpdir, err := os.MkdirTemp("", "healing-test")
	if err != nil {
		t.Fatal(err)
	}
	defer os.RemoveAll(tmpdir)

	engine := NewHealingEngine(tmpdir, "", nil, 2, HealingStrategyRetry)
	report := engine.Heal("t1", "cannot retry: bad input", 1, func(c HealingContext) error {
		return nil
	}, "", nil)
	assertEqual(t, report.Actions[0].Strategy, HealingStrategySkip)
	assertTrue(t, report.Actions[0].Succeeded)
	assertContains(t, report.Actions[0].Reason, "Skipped")
}

func TestHealingEngineCircuitBreakerTriggersEscalate(t *testing.T) {
	tmpdir, err := os.MkdirTemp("", "healing-test")
	if err != nil {
		t.Fatal(err)
	}
	defer os.RemoveAll(tmpdir)

	cb := NewCircuitBreaker(1, time.Hour)
	engine := NewHealingEngine(tmpdir, "", cb, 5, HealingStrategyRetry)
	engine.Heal("t1", "fail", 1, func(c HealingContext) error {
		return errors.New("fail")
	}, "", nil)
	report := engine.Heal("t1", "fail", 2, func(c HealingContext) error {
		return nil
	}, "", nil)
	assertEqual(t, report.Actions[1].Strategy, HealingStrategyEscalate)
	assertContains(t, report.Actions[1].Reason, "circuit breaker")
}

func TestHealingEngineRollbackWhenCheckpointPresent(t *testing.T) {
	tmpdir, err := os.MkdirTemp("", "healing-test")
	if err != nil {
		t.Fatal(err)
	}
	defer os.RemoveAll(tmpdir)

	engine := NewHealingEngine(tmpdir, "", nil, 3, HealingStrategyRetry)
	engine.Heal("t1", "fail", 1, func(c HealingContext) error {
		return errors.New("fail")
	}, "", map[string]interface{}{"checkpoint": true})
	report := engine.Heal("t1", "fail", 2, func(c HealingContext) error {
		return nil
	}, "", map[string]interface{}{"checkpoint": true})
	assertEqual(t, report.Actions[0].Strategy, HealingStrategyRetry)
	assertFalse(t, report.Actions[0].Succeeded)
	assertEqual(t, report.Actions[1].Strategy, HealingStrategyRollback)
	assertTrue(t, report.Actions[1].Succeeded)
}

func TestHealingEnginePersistsActionsToFile(t *testing.T) {
	tmpdir, err := os.MkdirTemp("", "healing-test")
	if err != nil {
		t.Fatal(err)
	}
	defer os.RemoveAll(tmpdir)

	engine := NewHealingEngine(tmpdir, "", nil, 2, HealingStrategyRetry)
	engine.Heal("t1", "fail", 1, func(c HealingContext) error {
		return nil
	}, "", nil)
	path := tmpdir + "/" + healingDir + "/" + healingFile
	if !fileExists(path) {
		t.Fatalf("expected file to exist at %s", path)
	}
	data, err := os.ReadFile(path)
	if err != nil {
		t.Fatal(err)
	}
	lines := splitLines(string(data))
	assertEqual(t, len(lines), 1)
	var m map[string]interface{}
	if err := json.Unmarshal([]byte(lines[0]), &m); err != nil {
		t.Fatal(err)
	}
	assertEqual(t, m["task_id"], "t1")
	assertEqual(t, m["strategy"], "retry")
}

func TestHealingEngineGetReport(t *testing.T) {
	tmpdir, err := os.MkdirTemp("", "healing-test")
	if err != nil {
		t.Fatal(err)
	}
	defer os.RemoveAll(tmpdir)

	engine := NewHealingEngine(tmpdir, "", nil, 2, HealingStrategyRetry)
	if engine.GetReport("nonexistent") != nil {
		t.Fatal("expected nil")
	}
	engine.Heal("t1", "fail", 1, func(c HealingContext) error { return nil }, "", nil)
	fetched := engine.GetReport("_global")
	if fetched == nil {
		t.Fatal("expected report")
	}
	assertEqual(t, len(fetched.Actions), 1)
}

func TestHealingEngineReadPastActionsFilters(t *testing.T) {
	tmpdir, err := os.MkdirTemp("", "healing-test")
	if err != nil {
		t.Fatal(err)
	}
	defer os.RemoveAll(tmpdir)

	engine := NewHealingEngine(tmpdir, "", nil, 2, HealingStrategyRetry)
	engine.Heal("t1", "fail", 1, func(c HealingContext) error { return nil }, "wf1", nil)
	engine.Heal("t2", "fail", 1, func(c HealingContext) error { return nil }, "wf2", nil)
	actions, err := engine.ReadPastActions("wf1")
	if err != nil {
		t.Fatal(err)
	}
	assertEqual(t, len(actions), 1)
	assertEqual(t, actions[0]["task_id"], "t1")
	all, err := engine.ReadPastActions("")
	if err != nil {
		t.Fatal(err)
	}
	assertEqual(t, len(all), 2)
}

func fileExists(path string) bool {
	_, err := os.Stat(path)
	return err == nil
}

func assertEqual(t *testing.T, got, want interface{}) {
	t.Helper()
	if got != want {
		t.Fatalf("got %v, want %v", got, want)
	}
}

func assertTrue(t *testing.T, cond bool) {
	t.Helper()
	if !cond {
		t.Fatal("expected true")
	}
}

func assertFalse(t *testing.T, cond bool) {
	t.Helper()
	if cond {
		t.Fatal("expected false")
	}
}

func assertContains(t *testing.T, s, substr string) {
	t.Helper()
	if !containsStr(s, substr) {
		t.Fatalf("expected %q to contain %q", s, substr)
	}
}

func containsStr(s, substr string) bool {
	return len(s) >= len(substr) && containsStrInner(s, substr)
}

func containsStrInner(s, substr string) bool {
	for i := 0; i <= len(s)-len(substr); i++ {
		if s[i:i+len(substr)] == substr {
			return true
		}
	}
	return false
}
