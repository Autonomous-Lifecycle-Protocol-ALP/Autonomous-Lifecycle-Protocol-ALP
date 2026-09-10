package alpgo

import (
	"testing"
)

func TestWorkflowReplayEngine(t *testing.T) {
	engine := NewWorkflowReplayEngine()

	// Start trace
	trace := engine.StartTrace("wf-daily-etl")
	if trace.Status != ReplayCapturing {
		t.Fatalf("expected status %s, got %s", ReplayCapturing, trace.Status)
	}

	// Capture steps
	s1 := engine.CaptureStep(trace.TraceID, "extract_data", "agent-etl", map[string]interface{}{"rows": 100}, "ok")
	if s1 == nil || s1.StepIndex != 0 {
		t.Fatalf("expected step index 0, got %v", s1)
	}

	s2 := engine.CaptureStep(trace.TraceID, "transform_data", "agent-etl", map[string]interface{}{"cleaned": true}, "ok")
	if s2 == nil || s2.StepIndex != 1 {
		t.Fatalf("expected step index 1, got %v", s2)
	}

	// Complete trace
	ok := engine.CompleteTrace(trace.TraceID)
	if !ok || trace.Status != ReplayCompleted {
		t.Fatalf("expected completed status, got %s", trace.Status)
	}

	// Time travel seek
	seekStep := engine.SeekToStep(trace.TraceID, 0)
	if seekStep == nil || seekStep.Action != "extract_data" {
		t.Fatalf("expected extract_data, got %v", seekStep)
	}

	// Step forward
	fwdStep := engine.StepForward(trace.TraceID)
	if fwdStep == nil || fwdStep.Action != "transform_data" {
		t.Fatalf("expected transform_data, got %v", fwdStep)
	}

	// Step backward
	backStep := engine.StepBackward(trace.TraceID)
	if backStep == nil || backStep.Action != "extract_data" {
		t.Fatalf("expected extract_data on backward, got %v", backStep)
	}

	// Compare traces
	trace2 := engine.StartTrace("wf-daily-etl-v2")
	engine.CaptureStep(trace2.TraceID, "extract_data", "agent-etl", nil, "ok")
	engine.CaptureStep(trace2.TraceID, "transform_parquet_v2", "agent-etl", nil, "ok")
	engine.CompleteTrace(trace2.TraceID)

	diffs := engine.CompareTraces(trace.TraceID, trace2.TraceID)
	if len(diffs) != 2 {
		t.Fatalf("expected 2 diff steps, got %d", len(diffs))
	}
	if diffs[0].HasStateDivergence {
		t.Errorf("step 0 should match")
	}
	if !diffs[1].HasStateDivergence {
		t.Errorf("step 1 should diverge")
	}
}
