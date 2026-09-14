#[test]
fn sandbox_manager_create_sets_pending() {
    let manager = hydra_sandbox::SandboxManager::new();
    let config = hydra_sandbox::SandboxSpec {
        cpu_limit: Some(1),
        memory_mb: 128,
        disk_mb: 512,
        network: hydra_sandbox::NetworkMode::None,
        workspace: "/tmp/test".into(),
        timeout_seconds: 60,
        env: std::collections::HashMap::new(),
    };
    let sb = manager.create(config);
    assert_eq!(sb.state, hydra_sandbox::SandboxState::Pending);
}

#[test]
fn sandbox_manager_list_is_empty_initially() {
    let manager = hydra_sandbox::SandboxManager::new();
    let list = manager.list();
    assert!(list.is_empty());
}

#[test]
fn sandbox_network_mode_as_str() {
    assert_eq!(hydra_sandbox::NetworkMode::None.as_str(), "none");
    assert_eq!(
        hydra_sandbox::NetworkMode::Restricted(vec!["a".into()]).as_str(),
        "restricted"
    );
    assert_eq!(hydra_sandbox::NetworkMode::Full.as_str(), "full");
}
