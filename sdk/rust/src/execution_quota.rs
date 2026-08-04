use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Mutex;
use std::time::Duration;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QuotaUsage {
    pub agent_id: String,
    pub used: f64,
    pub limit: f64,
    pub remaining: f64,
    pub last_checked: String,
}

pub struct ExecutionQuotaEngine {
    quotas: Mutex<HashMap<String, QuotaUsage>>,
    reset_interval: Duration,
}

impl ExecutionQuotaEngine {
    pub fn new(reset_interval: Duration) -> Self {
        let interval = if reset_interval > Duration::ZERO { reset_interval } else { Duration::from_secs(3600) };
        Self {
            quotas: Mutex::new(HashMap::new()),
            reset_interval: interval,
        }
    }

    pub fn set_quota(&self, agent_id: &str, limit: f64) {
        let mut quotas = self.quotas.lock().unwrap();
        quotas.insert(agent_id.to_string(), QuotaUsage {
            agent_id: agent_id.to_string(),
            used: 0.0,
            limit,
            remaining: limit,
            last_checked: chrono::Utc::now().to_rfc3339(),
        });
    }

    pub fn consume(&self, agent_id: &str, amount: f64) -> Result<(), AlpError> {
        if amount <= 0.0 {
            return Ok(());
        }
        let mut quotas = self.quotas.lock().unwrap();
        let q = quotas.get_mut(agent_id).ok_or_else(|| AlpError::new(format!("quota not set for agent '{}'", agent_id)))?;
        if chrono::Utc::now().signed_duration_since(chrono::DateTime::parse_from_rfc3339(&q.last_checked).unwrap().fixed_offset()) >= chrono::Duration::from_std(self.reset_interval).unwrap() {
            q.used = 0.0;
            q.remaining = q.limit;
            q.last_checked = chrono::Utc::now().to_rfc3339();
        }
        if q.remaining < amount {
            return Err(AlpError::new(format!("quota exceeded for agent '{}': remaining={:.2}, requested={:.2}", agent_id, q.remaining, amount)));
        }
        q.used += amount;
        q.remaining -= amount;
        q.last_checked = chrono::Utc::now().to_rfc3339();
        Ok(())
    }

    pub fn remaining(&self, agent_id: &str) -> Result<f64, AlpError> {
        let quotas = self.quotas.lock().unwrap();
        let q = quotas.get(agent_id).ok_or_else(|| AlpError::new(format!("quota not set for agent '{}'", agent_id)))?;
        Ok(q.remaining)
    }

    pub fn reset(&self, agent_id: &str) {
        let mut quotas = self.quotas.lock().unwrap();
        if let Some(q) = quotas.get_mut(agent_id) {
            q.used = 0.0;
            q.remaining = q.limit;
            q.last_checked = chrono::Utc::now().to_rfc3339();
        }
    }

    pub fn reset_all(&self) {
        let mut quotas = self.quotas.lock().unwrap();
        for q in quotas.values_mut() {
            q.used = 0.0;
            q.remaining = q.limit;
            q.last_checked = chrono::Utc::now().to_rfc3339();
        }
    }
}
