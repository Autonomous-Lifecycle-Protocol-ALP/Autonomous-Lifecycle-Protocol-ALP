package alpgo

import (
	"testing"
)

func objects() []*AlpObject {
	return []*AlpObject{
		NewAlpObject("p-strict", "policy").WithProperty("allow_commands", []string{"run"}).WithProperty("deny_commands", []string{"rm"}).WithProperty("enforcement", "strict"),
		NewAlpObject("p-warn", "policy").WithProperty("allow_commands", []string{"run"}).WithProperty("deny_commands", []string{"rm"}).WithProperty("enforcement", "warn"),
	}
}

func TestAnomalyScoreIsAnomalous(t *testing.T) {
	score := NewAnomalyScore(0.8, []string{"high_failure_rate"}, map[string]interface{}{}, "require_approval")
	if !score.IsAnomalous(0.7) {
		t.Error("expected anomalous at 0.7")
	}
	if score.IsAnomalous(0.9) {
		t.Error("expected not anomalous at 0.9")
	}
}

func TestBaselineProfileToMap(t *testing.T) {
	bp := NewBaselineProfile("command", "run", 10, 1.0, 0.5, 0.1, "2026-01-01T00:00:00Z")
	m := bp.ToMap()
	if m["kind"] != "command" {
		t.Errorf("expected kind command, got %v", m["kind"])
	}
}

func TestPredictivePolicyEngineNoEventStore(t *testing.T) {
	engine := NewPredictivePolicyEngine(objects())
	query := NewPolicyQuery("command", "run")
	decision := engine.Evaluate(query)
	if decision.Audit == nil {
		t.Fatal("expected audit map")
	}
	anomaly, ok := decision.Audit["anomaly"].(map[string]interface{})
	if !ok {
		t.Fatal("expected anomaly in audit")
	}
	if anomaly["score"] == nil {
		t.Error("expected score in anomaly")
	}
}

func TestPredictivePolicyEngineAttachesAnomaly(t *testing.T) {
	engine := NewPredictivePolicyEngine(objects())
	query := NewPolicyQuery("command", "run")
	decision := engine.Evaluate(query)
	anomaly, ok := decision.Audit["anomaly"].(map[string]interface{})
	if !ok {
		t.Fatal("expected anomaly in audit")
	}
	if _, ok := anomaly["factors"]; !ok {
		t.Error("expected factors in anomaly")
	}
	if _, ok := anomaly["recommendation"]; !ok {
		t.Error("expected recommendation in anomaly")
	}
}

func TestPredictivePolicyEngineDenyOnly(t *testing.T) {
	engine := NewPredictivePolicyEngine(objects())
	query := NewPolicyQuery("command", "rm")
	decision := engine.EvaluateDenyOnly(query)
	anomaly, ok := decision.Audit["anomaly"].(map[string]interface{})
	if !ok {
		t.Fatal("expected anomaly in audit")
	}
	if anomaly["score"] == nil {
		t.Error("expected score in anomaly")
	}
}

func TestPredictivePolicyEngineProposal(t *testing.T) {
	engine := NewPredictivePolicyEngine(objects())
	decision := engine.EvaluateProposal("noop")
	anomaly, ok := decision.Audit["anomaly"].(map[string]interface{})
	if !ok {
		t.Fatal("expected anomaly in audit")
	}
	if anomaly["score"] != 0.0 {
		t.Errorf("expected score 0.0 for proposal, got %v", anomaly["score"])
	}
}

func TestPredictivePolicyEngineLearning(t *testing.T) {
	engine := NewPredictivePolicyEngine(objects())
	events := []EventEntry{
		{"command", "run", "[x]", false, "2026-01-01T00:00:00Z"},
		{"command", "run", "[!]", true, "2026-01-01T00:01:00Z"},
		{"command", "run", "[x]", false, "2026-01-01T00:02:00Z"},
	}
	engine.LearnFromEvents(events)
	baselines := engine.GetBaselines()
	if len(baselines) != 1 {
		t.Fatalf("expected 1 baseline, got %d", len(baselines))
	}
	if baselines[0].Kind != "command" {
		t.Errorf("expected kind command, got %s", baselines[0].Kind)
	}
	if baselines[0].SampleCount != 3 {
		t.Errorf("expected sample_count 3, got %d", baselines[0].SampleCount)
	}
}

func TestPredictivePolicyEngineGetBaseline(t *testing.T) {
	engine := NewPredictivePolicyEngine(objects())
	events := []EventEntry{
		{"command", "run", "[x]", false, "2026-01-01T00:00:00Z"},
	}
	engine.LearnFromEvents(events)
	bp := engine.GetBaseline("command", "run")
	if bp == nil {
		t.Fatal("expected baseline")
	}
	if bp.Kind != "command" {
		t.Errorf("expected kind command, got %s", bp.Kind)
	}
}

func TestPredictivePolicyEngineHistory(t *testing.T) {
	engine := NewPredictivePolicyEngine(objects())
	engine.Evaluate(NewPolicyQuery("command", "run"))
	engine.Evaluate(NewPolicyQuery("command", "run"))
	if len(engine.GetHistory()) != 2 {
		t.Errorf("expected history length 2, got %d", len(engine.GetHistory()))
	}
}

func TestPredictivePolicyEngineAnomaliesSummary(t *testing.T) {
	engine := NewPredictivePolicyEngine(objects())
	engine.Evaluate(NewPolicyQuery("command", "rm"))
	engine.Evaluate(NewPolicyQuery("command", "run"))
	policyID := "p-strict"
	summary := engine.AnomaliesSummary(&policyID)
	if summary["total"] == nil {
		t.Error("expected total in summary")
	}
}
