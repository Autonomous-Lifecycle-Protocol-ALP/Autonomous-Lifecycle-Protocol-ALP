use std::sync::Arc;
use tokio::sync::RwLock;

pub struct Verifier {
    pub checks: Arc<RwLock<Vec<VerificationCheck>>>,
}

pub struct VerificationCheck {
    pub id: String,
    pub name: String,
    pub passed: bool,
    pub detail: String,
}

impl Verifier {
    pub fn new() -> Self {
        Self { checks: Arc::new(RwLock::new(Vec::new())) }
    }

    pub async fn add_check(&self, check: VerificationCheck) {
        self.checks.write().await.push(check);
    }

    pub async fn verify(&self) -> VerificationReport {
        let checks = self.checks.read().await;
        let total = checks.len();
        let passed = checks.iter().filter(|c| c.passed).count();
        VerificationReport { total, passed, failed: total - passed }
    }
}

pub struct VerificationReport {
    pub total: usize,
    pub passed: usize,
    pub failed: usize,
}

impl VerificationReport {
    pub fn is_success(&self) -> bool {
        self.failed == 0
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn verifier_success_report() {
        let verifier = Verifier::new();
        verifier.add_check(VerificationCheck { id: "c1".into(), name: "test".into(), passed: true, detail: "".into() }).await;
        let report = verifier.verify().await;
        assert!(report.is_success());
        assert_eq!(report.total, 1);
        assert_eq!(report.passed, 1);
    }

    #[tokio::test]
    async fn verifier_failure_report() {
        let verifier = Verifier::new();
        verifier.add_check(VerificationCheck { id: "c1".into(), name: "test".into(), passed: false, detail: "fail".into() }).await;
        let report = verifier.verify().await;
        assert!(!report.is_success());
        assert_eq!(report.failed, 1);
    }
}
