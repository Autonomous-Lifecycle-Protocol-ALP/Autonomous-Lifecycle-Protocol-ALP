package alpgo_test

import (
	"testing"

	"github.com/Autonomous-Lifecycle-Protocol-ALP/Autonomous-Lifecycle-Protocol-ALP/sdk/go"
	"github.com/stretchr/testify/assert"
)

func TestIntegrationIdentityToGovernance(t *testing.T) {
	kp := alpgo.GenerateKeypair()
	assert.NotEmpty(t, kp.PublicKey)
	assert.NotEmpty(t, kp.PrivateKey)

	did := alpgo.CreateDID("agent-1", kp.PublicKey)
	assert.Contains(t, did, "did:alp:agent-1:")

	identity := alpgo.NewAgentIdentity(did, "agent-1", kp.PublicKey, "", nil)
	assert.Equal(t, did, identity.DID)

	registry := alpgo.NewTrustRegistry("/tmp/alp-integration-test")
	entry := registry.Register(did, "agent-1", []string{"read", "write"}, "trusted")
	assert.Equal(t, "agent-1", entry.AgentID)
	assert.True(t, registry.HasScope(did, "read"))

	claims := map[string]any{"role": "admin"}
	vp := alpgo.NewVerifiablePresentation(did, "agent-1", claims, "", "")
	// Note: signature verification is simplified in Go SDK; ensure structure is valid
	assert.NotEmpty(t, vp.DID)
	assert.Equal(t, "agent-1", vp.AgentID)

	engine := alpgo.NewGovernanceEngineDefault("/tmp/alp-integration-gov")
	engine.Qualify(did)
	engine.Qualify(did + "-2")
	engine.Qualify(did + "-3")
	ballot := engine.Propose("policy-1", "Test policy", nil)
	assert.Contains(t, ballot.BallotID, "ballot-")

	engine.Vote(ballot.BallotID, did, "approve", "Looks good", kp.PrivateKey)
	engine.Vote(ballot.BallotID, did+"-2", "approve", "Also good", kp.PrivateKey+"-2")
	engine.Vote(ballot.BallotID, did+"-3", "approve", "Third vote", kp.PrivateKey+"-3")

	report := engine.CloseAndTally(ballot.BallotID)
	assert.Equal(t, "approved", report.Result)
	assert.GreaterOrEqual(t, report.Tally["approve"], 2)
}

func TestIntegrationTelemetrySpanLifecycle(t *testing.T) {
	telemetry := alpgo.NewTelemetryEngine()
	span := telemetry.StartSpanSimple("test-action")
	span.Attributes["key"] = "value"
	ended := telemetry.EndSpanSimple(span.SpanID)
	assert.NotNil(t, ended)
	assert.Equal(t, "OK", ended.Status)

	summary := telemetry.GetTraceSummary()
	assert.Equal(t, 1, summary["totalSpans"])
	assert.Equal(t, 1, summary["okCount"])
	assert.Equal(t, 0, summary["errorCount"])

	traceparent := telemetry.InjectContext(ended)
	assert.Contains(t, traceparent, "00-")
	assert.Contains(t, traceparent, span.TraceID)

	extracted := telemetry.ExtractContext(traceparent)
	assert.NotNil(t, extracted)
	assert.Equal(t, span.TraceID, extracted["traceId"])
}

func TestIntegrationWorkspaceWithPolicyAndVault(t *testing.T) {
	workspace := alpgo.NewAlpWorkspace()
	source := `id: task-1
type: task

id: policy-1
type: policy
`

	err := workspace.LoadString(source)
	assert.NoError(t, err)
	assert.Len(t, workspace.Objects(), 2)

	order := workspace.ExecutionOrder()
	assert.Len(t, order, 2)

	graph := workspace.Graph()
	assert.NotNil(t, graph.GetNode("task-1"))
	assert.NotNil(t, graph.GetNode("policy-1"))
}

func TestIntegrationBridgeA2ARoundTrip(t *testing.T) {
	bridge := alpgo.NewProtocolBridge()
	wf := map[string]interface{}{
		"id":   "wf-ai",
		"name": "AI Pipeline",
		"steps": []interface{}{
			map[string]interface{}{"id": "s1", "name": "train"},
			map[string]interface{}{"id": "s2", "name": "eval"},
		},
	}

	exported, err := bridge.ExportWorkflow(wf, "a2a")
	assert.NoError(t, err)
	assert.Equal(t, "a2a", exported.Format)

	card, ok := exported.Spec.(map[string]interface{})
	assert.True(t, ok)
	assert.Equal(t, "AgentCard", card["@type"])
	skills, ok := card["skills"].([]interface{})
	assert.True(t, ok)
	assert.Len(t, skills, 2)

	imported, err := bridge.ImportSpec(card, "a2a")
	assert.NoError(t, err)
	assert.Equal(t, "a2a", imported.Format)
	steps, ok := imported.Workflow["steps"].([]map[string]interface{})
	assert.True(t, ok)
	assert.Len(t, steps, 2)
	assert.Equal(t, "train", steps[0]["name"])
}

func TestIntegrationPredictivePolicyWithBaselines(t *testing.T) {
	objects := []*alpgo.AlpObject{
		alpgo.NewAlpObject("p-strict", "policy").WithProperty("allow_commands", []string{"run"}).WithProperty("deny_commands", []string{"rm"}).WithProperty("enforcement", "strict"),
	}
	engine := alpgo.NewPredictivePolicyEngine(objects)

	events := []alpgo.EventEntry{
		{"command", "run", "[x]", false, "2026-01-01T00:00:00Z"},
		{"command", "run", "[x]", false, "2026-01-01T00:01:00Z"},
		{"command", "run", "[!]", true, "2026-01-01T00:02:00Z"},
		{"command", "run", "[x]", false, "2026-01-01T00:03:00Z"},
		{"command", "run", "[x]", false, "2026-01-01T00:04:00Z"},
	}
	engine.LearnFromEvents(events)

	query := alpgo.NewPolicyQuery("command", "run")
	decision := engine.Evaluate(query)
	assert.NotNil(t, decision)
	assert.NotNil(t, decision.Audit)

	anomaly, ok := decision.Audit["anomaly"].(map[string]interface{})
	assert.True(t, ok)
	score, ok := anomaly["score"].(float64)
	assert.True(t, ok)
	assert.True(t, score >= 0.0)

	summary := engine.AnomaliesSummary(nil)
	assert.Equal(t, 1, summary["total"])
}

func TestIntegrationBridgeExportFormats(t *testing.T) {
	bridge := alpgo.NewProtocolBridge()
	wf := map[string]interface{}{
		"id":   "wf-multi",
		"name": "Multi-Format",
		"steps": []interface{}{
			map[string]interface{}{"id": "s1", "name": "step-one"},
		},
	}

	for _, format := range []string{"openapi", "graphql", "grpc", "asyncapi", "a2a"} {
		result, err := bridge.ExportWorkflow(wf, format)
		assert.NoError(t, err, format)
		assert.Equal(t, format, result.Format)
		assert.NotNil(t, result.Spec)
		assert.Equal(t, "wf-multi", result.SourceWorkflowID)
	}
}

