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
}
