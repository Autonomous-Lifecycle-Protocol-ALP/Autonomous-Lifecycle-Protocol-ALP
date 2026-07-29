#[cfg(test)]
mod tests {
    use crate::{AlpGraph, AlpObject, AlpParser, AlpWorkspace, PolicyEngine, PolicyQuery, Vault};
    use std::collections::HashMap;

    #[test]
    fn policy_engine_evaluate_blocks_deny() {
        let objects = vec![
            AlpObject::new("p1", "policy").with_property("kind", "deny_path").with_property("value", "/etc/passwd"),
        ];
        let engine = PolicyEngine::new(&objects);
        let decision = engine.evaluate(&PolicyQuery::new("path", "/etc/passwd"));
        assert!(decision.blocked);
        assert!(!decision.allowed);
    }

    #[test]
    fn vault_set_and_get_secret() {
        let mut vault = Vault::new();
        vault.set_secret("api-key", "secret-value", vec!["recipient-1".into()]);
        assert_eq!(vault.get_secret("api-key").unwrap(), "secret-value");
    }

    #[test]
    fn vault_get_missing_returns_error() {
        let vault = Vault::new();
        assert!(vault.get_secret("missing").is_err());
    }

    #[test]
    fn telemetry_engine_start_and_end_span() {
        let mut telemetry = crate::telemetry::TelemetryEngine::new();
        let mut attrs = HashMap::new();
        attrs.insert("key".into(), serde_json::Value::String("value".into()));
        let span = telemetry.start_span("test-action", Some(attrs));
        let ended = telemetry.end_span(&span.span_id, "OK", None);
        assert!(ended.is_some());
        let summary = telemetry.get_trace_summary();
        assert_eq!(summary.get("totalSpans").copied().unwrap_or(0), 1);
    }

    #[test]
    fn telemetry_engine_inject_extract_context() {
        let telemetry = crate::telemetry::TelemetryEngine::new();
        let trace_id = telemetry.generate_trace_id();
        let span_id = telemetry.generate_span_id();
        let span = crate::telemetry::Span::new(
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
    fn governance_engine_propose_and_vote() {
        let mut engine = crate::governance::GovernanceEngine::new("/tmp/alp-test-gov", 2);
        engine.qualify("did:alp:agent-1".into());
        engine.qualify("did:alp:agent-2".into());

        let ballot = engine.propose("policy-1", "Test policy", Some(2));
        assert_eq!(ballot.ballot_id.len(), "ballot-".len() + 16);

        let result = engine.vote(&ballot.ballot_id, "did:alp:agent-1", "approve", "Looks good", "key1");
        assert!(result.get("accepted").and_then(|v| v.as_bool()).unwrap_or(false));
    }

    #[test]
    fn governance_engine_rejects_unqualified_voter() {
        let engine = crate::governance::GovernanceEngine::new("/tmp/alp-test-gov", 2);
        let result = engine.vote("ballot-123", "did:alp:unknown", "approve", "", "");
        assert!(!result.get("accepted").and_then(|v| v.as_bool()).unwrap_or(true));
    }

    #[test]
    fn identity_generate_keypair_and_did() {
        let kp = crate::identity::generate_keypair();
        assert!(!kp.public_key.is_empty());
        assert!(!kp.private_key.is_empty());

        let did = crate::identity::create_did("agent-1", &kp.public_key);
        assert!(did.starts_with("did:alp:agent-1:"));
    }

    #[test]
    fn identity_verifiable_presentation_verify() {
        let kp = crate::identity::generate_keypair();
        let did = crate::identity::create_did("agent-1", &kp.public_key);
        let mut claims = HashMap::new();
        claims.insert("role".into(), serde_json::Value::String("admin".into()));
        let vp = crate::identity::VerifiablePresentation::new(did, "agent-1", claims, "");
        let payload = serde_json::json!({"did": vp.did, "agent_id": vp.agent_id, "claims": vp.claims});
        let expected = crate::identity::simple_hash(&(payload.to_string() + &kp.private_key));
        let vp_signed = crate::identity::VerifiablePresentation::new(vp.did, vp.agent_id, vp.claims, expected);
        assert!(vp_signed.verify(&kp.public_key));
    }
}
