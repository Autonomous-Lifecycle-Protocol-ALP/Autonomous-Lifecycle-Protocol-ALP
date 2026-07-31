use alp_sdk::governance::GovernanceEngine;
use alp_sdk::identity::{create_did, generate_keypair, TrustRegistry, VerifiablePresentation};
use alp_sdk::policy::{PolicyEngine, PolicyQuery};
use alp_sdk::telemetry::{Span, TelemetryEngine};
use alp_sdk::vault::Vault;
use alp_sdk::{AlpObject, AlpWorkspace};
use std::collections::HashMap;

#[test]
fn test_identity_generate_keypair_and_did() {
    let kp = generate_keypair();
    assert!(!kp.public_key.is_empty());
    assert!(!kp.private_key.is_empty());

    let did = create_did("agent-1", &kp.public_key);
    assert!(did.starts_with("did:alp:agent-1:"));
}

#[test]
fn test_trust_registry_register_and_resolve() {
    let dir = std::env::temp_dir().join("alp-test-trust");
    let mut registry = TrustRegistry::new(dir.to_str().unwrap());
    let entry = registry.register(
        "did:alp:agent-1",
        "agent-1",
        vec!["read".into(), "write".into()],
        "standard",
    );
    assert_eq!(entry.agent_id, "agent-1");
    assert!(registry.has_scope("did:alp:agent-1", "read"));
}

#[test]
fn test_verifiable_presentation_verify() {
    let kp = generate_keypair();
    let did = create_did("agent-1", &kp.public_key);
    let mut claims = HashMap::new();
    claims.insert("role".into(), serde_json::Value::String("admin".into()));
    let mut vp = VerifiablePresentation::new(did.clone(), "agent-1", claims, "");
    vp.sign(&kp.private_key);
    assert!(vp.verify(&kp.private_key));
}

#[test]
fn test_governance_engine_propose_and_vote() {
    let dir = std::env::temp_dir().join("alp-test-gov");
    let mut engine = GovernanceEngine::new(dir.to_str().unwrap(), 2);
    engine.qualify("did:alp:agent-1");
    engine.qualify("did:alp:agent-2");

    let ballot = engine.propose("policy-1", "Test policy", Some(2));
    assert!(ballot.ballot_id().starts_with("ballot-"));

    let result = engine.vote(
        &ballot.ballot_id(),
        "did:alp:agent-1",
        "approve",
        "Looks good",
        "key1",
    );
    assert!(result
        .get("accepted")
        .and_then(|v| v.as_bool())
        .unwrap_or(false));
}

#[test]
fn test_governance_engine_rejects_unqualified_voter() {
    let dir = std::env::temp_dir().join("alp-test-gov-2");
    let mut engine = GovernanceEngine::new(dir.to_str().unwrap(), 2);
    let result = engine.vote("ballot-123", "did:alp:unknown", "approve", "", "");
    assert!(!result
        .get("accepted")
        .and_then(|v| v.as_bool())
        .unwrap_or(true));
}

#[test]
fn test_telemetry_engine_start_and_end_span() {
    let mut telemetry = TelemetryEngine::new();
    let mut attrs = HashMap::new();
    attrs.insert("key".into(), serde_json::Value::String("value".into()));
    let span = telemetry.start_span("test-action", Some(attrs));
    let ended = telemetry.end_span(&span.span_id, "OK", None);
    assert!(ended.is_some());
    let summary = telemetry.get_trace_summary();
    assert_eq!(summary.get("totalSpans").copied().unwrap_or(0), 1);
}

#[test]
fn test_telemetry_engine_inject_extract_context() {
    let telemetry = TelemetryEngine::new();
    let trace_id = telemetry.generate_trace_id();
    let span_id = telemetry.generate_span_id();
    let span = Span::new(
        format!("span-{}", span_id),
        trace_id.clone(),
        span_id.clone(),
        None,
        None,
        "test",
        0,
        "OK",
        HashMap::new(),
    );
    let traceparent = telemetry.inject_context(&span);
    let extracted = telemetry.extract_context(&traceparent);
    assert!(extracted.is_some());
    let extracted = extracted.unwrap();
    assert_eq!(extracted.get("traceId").unwrap(), &trace_id);
}

#[test]
fn test_policy_engine_evaluate_blocks_deny() {
    let objects = vec![AlpObject::new("p1", "policy")
        .with_property("kind", "deny_path")
        .with_property("value", "/etc/passwd")];
    let engine = PolicyEngine::new(&objects);
    let decision = engine.evaluate(&PolicyQuery::new("path", "/etc/passwd"));
    assert!(decision.blocked);
    assert!(!decision.allowed);
}

#[test]
fn test_vault_set_and_get_secret() {
    let mut vault = Vault::new();
    vault.set_secret("api-key", "secret-value", vec!["recipient-1".into()]);
    assert_eq!(vault.get_secret("api-key").unwrap(), "secret-value");
}

#[test]
fn test_vault_get_missing_returns_error() {
    let mut vault = Vault::new();
    assert!(vault.get_secret("missing").is_err());
}

#[test]
fn test_integration_identity_to_governance() {
    let dir = std::env::temp_dir().join("alp-test-integration");
    let mut registry = TrustRegistry::new(dir.to_str().unwrap());
    let _entry = registry.register(
        "did:alp:agent-1",
        "agent-1",
        vec!["vote".into()],
        "qualified",
    );

    let mut engine = GovernanceEngine::new(dir.to_str().unwrap(), 1);
    engine.qualify("did:alp:agent-1");
    let ballot = engine.propose("policy-1", "Integration test", Some(1));
    let result = engine.vote(
        &ballot.ballot_id(),
        "did:alp:agent-1",
        "approve",
        "ok",
        "key1",
    );
    assert!(result
        .get("accepted")
        .and_then(|v| v.as_bool())
        .unwrap_or(false));
}

#[test]
fn test_integration_telemetry_span_lifecycle() {
    let mut telemetry = TelemetryEngine::new();
    let span = telemetry.start_span("integration-test", None);
    let ended = telemetry.end_span(&span.span_id, "OK", None);
    assert!(ended.is_some());
    let summary = telemetry.get_trace_summary();
    assert_eq!(summary.get("totalSpans").copied().unwrap_or(0), 1);
    assert_eq!(summary.get("okCount").copied().unwrap_or(0), 1);
}

#[test]
fn test_integration_workspace_with_policy_and_vault() {
    let mut workspace = AlpWorkspace::new();
    let source = r#"id: main
type: workflow

id: policy-1
type: policy
kind: deny_path
value: /etc/passwd"#;
    workspace.load_string(source).unwrap();
    let objects = workspace.objects();
    assert!(!objects.is_empty());

    let engine = PolicyEngine::new(objects);
    let decision = engine.evaluate(&PolicyQuery::new("path", "/etc/passwd"));
    assert!(decision.blocked);

    let mut vault = Vault::new();
    vault.set_secret("test-secret", "secret-value", vec![]);
    assert_eq!(vault.get_secret("test-secret").unwrap(), "secret-value");
}
