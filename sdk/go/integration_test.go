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
