use std::collections::HashMap;

pub struct HealthMonitor {
    pub checks: HashMap<String, HealthCheck>,
}

pub struct HealthCheck {
    pub name: String,
    pub status: HealthStatus,
    pub last_check: String,
}

#[derive(Debug, Clone, PartialEq)]
pub enum HealthStatus {
    Healthy,
    Degraded(String),
    Unhealthy(String),
}

impl HealthMonitor {
    pub fn new() -> Self {
        Self { checks: HashMap::new() }
    }

    pub fn register(&mut self, check: HealthCheck) {
        self.checks.insert(check.name.clone(), check);
    }

    pub fn overall(&self) -> HealthStatus {
        let mut worst = HealthStatus::Healthy;
        for check in self.checks.values() {
            match (&check.status, &worst) {
                (HealthStatus::Unhealthy(_), _) => worst = check.status.clone(),
                (HealthStatus::Degraded(_), HealthStatus::Healthy) => worst = check.status.clone(),
                _ => {}
            }
        }
        worst
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn health_monitor_overall_healthy() {
        let mut monitor = HealthMonitor::new();
        monitor.register(HealthCheck { name: "cpu".into(), status: HealthStatus::Healthy, last_check: "".into() });
        assert_eq!(monitor.overall(), HealthStatus::Healthy);
    }

    #[test]
    fn health_monitor_overall_degraded() {
        let mut monitor = HealthMonitor::new();
        monitor.register(HealthCheck { name: "cpu".into(), status: HealthStatus::Degraded("high load".into()), last_check: "".into() });
        assert!(matches!(monitor.overall(), HealthStatus::Degraded(_)));
    }
}
