use std::process::Command;

#[test]
fn cli_status_prints_system_info() {
    let output = Command::new("cargo")
        .args(["run", "-p", "hydra-cli", "--", "status"])
        .output()
        .expect("failed to run hydra status");

    if !output.status.success() {
        let stdout = String::from_utf8_lossy(&output.stdout);
        let stderr = String::from_utf8_lossy(&output.stderr);
        panic!("hydra status failed: stdout={stdout}, stderr={stderr}");
    }
    let stdout = String::from_utf8_lossy(&output.stdout);
    assert!(stdout.contains("HYDRA Portable"));
    assert!(stdout.contains("cpu_cores"));
}

#[test]
fn cli_security_scan_reports_kill_switch() {
    let output = Command::new("cargo")
        .args(["run", "-p", "hydra-cli", "--", "security-scan"])
        .output()
        .expect("failed to run security scan");

    if !output.status.success() {
        let stdout = String::from_utf8_lossy(&output.stdout);
        let stderr = String::from_utf8_lossy(&output.stderr);
        panic!("hydra security-scan failed: stdout={stdout}, stderr={stderr}");
    }
    let stdout = String::from_utf8_lossy(&output.stdout);
    assert!(stdout.contains("Kill switch"));
}

#[test]
fn cli_emergency_stop_triggers() {
    let output = Command::new("cargo")
        .args(["run", "-p", "hydra-cli", "--", "emergency-stop"])
        .output()
        .expect("failed to run emergency stop");

    if !output.status.success() {
        let stdout = String::from_utf8_lossy(&output.stdout);
        let stderr = String::from_utf8_lossy(&output.stderr);
        panic!("hydra emergency-stop failed: stdout={stdout}, stderr={stderr}");
    }
    let stdout = String::from_utf8_lossy(&output.stdout);
    assert!(stdout.contains("Emergency stop triggered"));
}

#[test]
fn cli_creative_run_completes() {
    let output = Command::new("cargo")
        .args(["run", "-p", "hydra-cli", "--", "creative", "run", "Create a logo"])
        .output()
        .expect("failed to run creative pipeline");

    if !output.status.success() {
        let stdout = String::from_utf8_lossy(&output.stdout);
        let stderr = String::from_utf8_lossy(&output.stderr);
        panic!("hydra creative failed: stdout={stdout}, stderr={stderr}");
    }
    let stdout = String::from_utf8_lossy(&output.stdout);
    assert!(stdout.contains("Create a logo"));
}
