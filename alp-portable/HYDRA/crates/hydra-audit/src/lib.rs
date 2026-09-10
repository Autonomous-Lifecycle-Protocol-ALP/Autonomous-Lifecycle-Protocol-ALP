use chrono::Utc;
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::collections::VecDeque;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AuditEntry {
    pub id: String,
    pub timestamp: String,
    pub task_id: String,
    pub actor: String,
    pub action: String,
    pub target: String,
    pub capability: String,
    pub result: String,
    pub risk: String,
    pub prev_hash: Option<String>,
    pub entry_hash: String,
}

impl AuditEntry {
    pub fn new(
        task_id: String,
        actor: String,
        action: String,
        target: String,
        capability: String,
        result: String,
        risk: String,
    ) -> Self {
        Self::new_with_prev(
            task_id,
            actor,
            action,
            target,
            capability,
            result,
            risk,
            None,
        )
    }

    pub fn new_with_prev(
        task_id: String,
        actor: String,
        action: String,
        target: String,
        capability: String,
        result: String,
        risk: String,
        prev_hash: Option<String>,
    ) -> Self {
        let id = uuid::Uuid::new_v4().to_string();
        let timestamp = Utc::now().to_rfc3339();

        let entry_content = serde_json::json!({
            "id": id,
            "timestamp": timestamp,
            "task_id": task_id,
            "actor": actor,
            "action": action,
            "target": target,
            "capability": capability,
            "result": result,
            "risk": risk,
            "prev_hash": &prev_hash,
        });

        let canonical = serde_json::to_string(&entry_content).unwrap_or_default();
        let entry_hash = {
            let mut hasher = Sha256::new();
            hasher.update(&canonical);
            let result = hasher.finalize();
            format!("{:x}", result)
        };

        Self {
            id,
            timestamp,
            task_id,
            actor,
            action,
            target,
            capability,
            result,
            risk,
            prev_hash,
            entry_hash,
        }
    }

    pub fn verify_hash(&self) -> bool {
        let entry_content = serde_json::json!({
            "id": self.id,
            "timestamp": self.timestamp,
            "task_id": self.task_id,
            "actor": self.actor,
            "action": self.action,
            "target": self.target,
            "capability": self.capability,
            "result": self.result,
            "risk": self.risk,
            "prev_hash": &self.prev_hash,
        });

        let canonical = serde_json::to_string(&entry_content).unwrap_or_default();
        let mut hasher = Sha256::new();
        hasher.update(&canonical);
        let computed = format!("{:x}", hasher.finalize());

        computed == self.entry_hash
    }
}

pub struct AuditLog {
    pub entries: VecDeque<AuditEntry>,
    max_entries: usize,
}

impl Default for AuditLog {
    fn default() -> Self {
        Self::new()
    }
}

impl AuditLog {
    pub fn new() -> Self {
        Self {
            entries: VecDeque::new(),
            max_entries: 10000,
        }
    }

    pub fn with_max_entries(max: usize) -> Self {
        Self {
            entries: VecDeque::with_capacity(max),
            max_entries: max,
        }
    }

    pub fn record(&mut self, entry: AuditEntry) {
        self.entries.push_back(entry);
        while self.entries.len() > self.max_entries {
            self.entries.pop_front();
        }
    }

    pub fn record_event(
        &mut self,
        task_id: String,
        actor: String,
        action: String,
        target: String,
        capability: String,
        result: String,
        risk: String,
    ) {
        let prev_hash = self.last_hash();
        let entry = AuditEntry::new_with_prev(
            task_id,
            actor,
            action,
            target,
            capability,
            result,
            risk,
            prev_hash,
        );
        self.record(entry);
    }

    pub fn last_hash(&self) -> Option<String> {
        self.entries.back().map(|e| e.entry_hash.clone())
    }

    pub fn verify_chain(&self) -> bool {
        let mut prev_hash: Option<String> = None;

        for (_i, entry) in self.entries.iter().enumerate() {
            if entry.prev_hash != prev_hash {
                return false;
            }
            if !entry.verify_hash() {
                return false;
            }
            prev_hash = Some(entry.entry_hash.clone());
        }

        true
    }

    pub fn len(&self) -> usize {
        self.entries.len()
    }

    pub fn is_empty(&self) -> bool {
        self.entries.is_empty()
    }

    pub fn export_jsonl(&self) -> String {
        let mut output = String::new();
        for entry in &self.entries {
            if let Ok(json) = serde_json::to_string(entry) {
                output.push_str(&json);
                output.push('\n');
            }
        }
        output
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn audit_log_records_entries() {
        let mut log = AuditLog::new();
        log.record_event(
            "t1".into(),
            "user".into(),
            "read".into(),
            "file".into(),
            "read".into(),
            "ok".into(),
            "low".into(),
        );
        assert_eq!(log.len(), 1);
        assert_eq!(log.entries[0].actor, "user");
    }

    #[test]
    fn audit_chain_is_consistent() {
        let mut log = AuditLog::new();
        log.record_event("t1".into(), "user".into(), "read".into(), "file".into(), "read".into(), "ok".into(), "low".into());
        log.record_event("t1".into(), "user".into(), "write".into(), "file".into(), "write".into(), "ok".into(), "medium".into());
        assert_eq!(log.entries[1].prev_hash, Some(log.entries[0].entry_hash.clone()));
        assert!(log.verify_chain());
    }

    #[test]
    fn audit_chain_detects_tampering() {
        let mut log = AuditLog::new();
        log.record_event("t1".into(), "user".into(), "read".into(), "file".into(), "read".into(), "ok".into(), "low".into());
        let mut tampered = log.entries[0].clone();
        tampered.action = "delete".to_string();
        assert!(!tampered.verify_hash());
    }

    #[test]
    fn audit_last_hash_is_none_when_empty() {
        let log = AuditLog::new();
        assert!(log.last_hash().is_none());
    }
}