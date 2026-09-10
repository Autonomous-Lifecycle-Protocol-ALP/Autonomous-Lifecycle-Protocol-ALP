mod support;

#[test]
fn kill_switch_starts_active() {
    let _env = support::TestEnv::new();
    let kernel = hydra_security::SecurityKernel::new();
    assert!(kernel.kill_switch.is_active());
}

#[test]
fn kill_switch_trigger_deactivates() {
    let _env = support::TestEnv::new();
    let mut kernel = hydra_security::SecurityKernel::new();
    kernel.kill_switch.trigger();
    assert!(!kernel.kill_switch.is_active());
}

#[test]
fn kill_switch_is_active_after_new() {
    let _env = support::TestEnv::new();
    let kernel = hydra_security::SecurityKernel::new();
    assert!(kernel.kill_switch.is_active());
}

#[test]
fn kill_switch_multiple_triggers_remain_inactive() {
    let _env = support::TestEnv::new();
    let mut kernel = hydra_security::SecurityKernel::new();
    kernel.kill_switch.trigger();
    kernel.kill_switch.trigger();
    assert!(!kernel.kill_switch.is_active());
}
