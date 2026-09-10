use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct SandboxSpec {
    pub cpu_limit: Option<u32>,
    pub memory_mb: u32,
    pub disk_mb: u32,
    pub network: NetworkMode,
    pub workspace: String,
    pub timeout_seconds: u64,
    pub env: HashMap<String, String>,
}

impl Default for SandboxSpec {
    fn default() -> Self {
        Self {
            cpu_limit: Some(1),
            memory_mb: 512,
            disk_mb: 1024,
            network: NetworkMode::None,
            workspace: "/tmp/sandbox".into(),
            timeout_seconds: 1800,
            env: HashMap::new(),
        }
    }
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub enum NetworkMode {
    None,
    Restricted(Vec<String>),
    Full,
}

impl NetworkMode {
    pub fn as_str(&self) -> &str {
        match self {
            NetworkMode::None => "none",
            NetworkMode::Restricted(_) => "restricted",
            NetworkMode::Full => "full",
        }
    }

    pub fn allows_network(&self) -> bool {
        matches!(self, NetworkMode::Full)
    }
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub enum SandboxState {
    Pending,
    Running,
    Stopped,
    Failed(String),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Sandbox {
    pub id: String,
    pub spec: SandboxSpec,
    pub state: SandboxState,
    pub pid: Option<u32>,
    pub created_at: String,
    pub started_at: Option<String>,
    pub stopped_at: Option<String>,
}

pub trait SandboxProvider: Send + Sync {
    fn create(&self, spec: SandboxSpec) -> SandboxId;
    fn start(&self, id: &SandboxId);
    fn stop(&self, id: &SandboxId);
    fn destroy(&self, id: &SandboxId);
    fn export(&self, id: &SandboxId) -> Vec<u8>;
}

#[derive(Debug, Clone, PartialEq, Eq, Hash)]
pub struct SandboxId(pub String);

impl SandboxId {
    pub fn new() -> Self {
        Self(format!("sb-{}", uuid::Uuid::new_v4().simple()))
    }
}

impl Default for SandboxId {
    fn default() -> Self {
        Self::new()
    }
}

#[derive(Debug, Clone, PartialEq)]
pub enum SandboxEvent {
    Created(SandboxId),
    Started(SandboxId),
    Stopped(SandboxId),
    Destroyed(SandboxId),
    Exported(SandboxId),
    Error(SandboxId, String),
}

pub struct SandboxManager {
    sandboxes: std::sync::RwLock<HashMap<String, Sandbox>>,
    events: std::sync::RwLock<Vec<SandboxEvent>>,
    next_id: std::sync::atomic::AtomicU64,
}

impl Default for SandboxManager {
    fn default() -> Self {
        Self::new()
    }
}

impl SandboxManager {
    pub fn new() -> Self {
        Self {
            sandboxes: std::sync::RwLock::new(HashMap::new()),
            events: std::sync::RwLock::new(Vec::new()),
            next_id: std::sync::atomic::AtomicU64::new(1),
        }
    }

    pub fn create(&self, spec: SandboxSpec) -> Sandbox {
        let id = SandboxId::new();
        let now = chrono::Utc::now().to_rfc3339();
        let sandbox = Sandbox {
            id: id.0.clone(),
            spec,
            state: SandboxState::Pending,
            pid: None,
            created_at: now,
            started_at: None,
            stopped_at: None,
        };
        self.sandboxes
            .write()
            .unwrap()
            .insert(id.0.clone(), sandbox.clone());
        self.record_event(SandboxEvent::Created(id.clone()));
        sandbox
    }

    pub fn start(&self, id: &str) -> bool {
        let mut guard = self.sandboxes.write().unwrap();
        if let Some(sb) = guard.get_mut(id) {
            sb.state = SandboxState::Running;
            sb.started_at = Some(chrono::Utc::now().to_rfc3339());
            sb.pid = Some(self.next_id.fetch_add(1, std::sync::atomic::Ordering::SeqCst) as u32);
            drop(guard);
            self.record_event(SandboxEvent::Started(SandboxId(id.to_string())));
            return true;
        }
        false
    }

    pub fn stop(&self, id: &str) -> bool {
        let mut guard = self.sandboxes.write().unwrap();
        if let Some(sb) = guard.get_mut(id) {
            sb.state = SandboxState::Stopped;
            sb.stopped_at = Some(chrono::Utc::now().to_rfc3339());
            sb.pid = None;
            drop(guard);
            self.record_event(SandboxEvent::Stopped(SandboxId(id.to_string())));
            return true;
        }
        false
    }

    pub fn destroy(&self, id: &str) -> bool {
        let removed = self.sandboxes.write().unwrap().remove(id);
        if removed.is_some() {
            self.record_event(SandboxEvent::Destroyed(SandboxId(id.to_string())));
            true
        } else {
            false
        }
    }

    pub fn export(&self, id: &str) -> Option<Vec<u8>> {
        let guard = self.sandboxes.read().unwrap();
        if let Some(sb) = guard.get(id) {
            let data = serde_json::to_vec(&sb).unwrap_or_default();
            self.record_event(SandboxEvent::Exported(SandboxId(id.to_string())));
            Some(data)
        } else {
            None
        }
    }

    pub fn list(&self) -> Vec<Sandbox> {
        self.sandboxes
            .read()
            .unwrap()
            .values()
            .cloned()
            .collect()
    }

    pub fn get(&self, id: &str) -> Option<Sandbox> {
        self.sandboxes.read().unwrap().get(id).cloned()
    }

    pub fn get_running(&self) -> Vec<Sandbox> {
        self.sandboxes
            .read()
            .unwrap()
            .values()
            .filter(|sb| matches!(sb.state, SandboxState::Running))
            .cloned()
            .collect()
    }

    pub fn stop_all(&self) {
        let ids: Vec<String> = self
            .sandboxes
            .read()
            .unwrap()
            .keys()
            .cloned()
            .collect();
        for id in ids {
            self.stop(&id);
        }
    }

    pub fn events(&self) -> Vec<SandboxEvent> {
        self.events.read().unwrap().clone()
    }

    fn record_event(&self, event: SandboxEvent) {
        self.events.write().unwrap().push(event);
    }

    pub fn len(&self) -> usize {
        self.sandboxes.read().unwrap().len()
    }

    pub fn is_empty(&self) -> bool {
        self.sandboxes.read().unwrap().is_empty()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn sandbox_manager_create_and_list() {
        let manager = SandboxManager::new();
        let config = SandboxSpec {
            cpu_limit: Some(1),
            memory_mb: 128,
            disk_mb: 512,
            network: NetworkMode::None,
            workspace: "/tmp/test".into(),
            timeout_seconds: 60,
            env: HashMap::new(),
        };
        let sb = manager.create(config);
        assert_eq!(sb.state, SandboxState::Pending);
        assert!(sb.id.starts_with("sb-"));
        let list = manager.list();
        assert_eq!(list.len(), 1);
    }

    #[test]
    fn sandbox_manager_start_and_stop() {
        let manager = SandboxManager::new();
        let sb = manager.create(SandboxSpec::default());
        assert!(manager.start(&sb.id));
        assert_eq!(
            manager.get(&sb.id).unwrap().state,
            SandboxState::Running
        );
        assert!(manager.stop(&sb.id));
        assert_eq!(
            manager.get(&sb.id).unwrap().state,
            SandboxState::Stopped
        );
    }

    #[test]
    fn sandbox_manager_destroy_removes_sandbox() {
        let manager = SandboxManager::new();
        let sb = manager.create(SandboxSpec::default());
        assert!(manager.destroy(&sb.id));
        assert!(manager.get(&sb.id).is_none());
        assert_eq!(manager.len(), 0);
    }

    #[test]
    fn sandbox_manager_export_serializes_sandbox() {
        let manager = SandboxManager::new();
        let sb = manager.create(SandboxSpec::default());
        let data = manager.export(&sb.id).unwrap();
        assert!(!data.is_empty());
    }

    #[test]
    fn sandbox_manager_start_nonexistent_fails() {
        let manager = SandboxManager::new();
        assert!(!manager.start("sb-nonexistent"));
    }

    #[test]
    fn sandbox_manager_stop_nonexistent_fails() {
        let manager = SandboxManager::new();
        assert!(!manager.stop("sb-nonexistent"));
    }

    #[test]
    fn sandbox_manager_stop_all_stops_running() {
        let manager = SandboxManager::new();
        let sb1 = manager.create(SandboxSpec::default());
        let sb2 = manager.create(SandboxSpec::default());
        manager.start(&sb1.id);
        manager.start(&sb2.id);
        manager.stop_all();
        assert_eq!(manager.get_running().len(), 0);
    }

    #[test]
    fn sandbox_manager_records_events() {
        let manager = SandboxManager::new();
        let sb = manager.create(SandboxSpec::default());
        manager.start(&sb.id);
        manager.stop(&sb.id);
        let events = manager.events();
        assert_eq!(events.len(), 3);
    }

    #[test]
    fn sandbox_manager_list_empty() {
        let manager = SandboxManager::new();
        assert!(manager.list().is_empty());
    }

    #[test]
    fn network_mode_allows_network() {
        assert!(!NetworkMode::None.allows_network());
        assert!(!NetworkMode::Restricted(vec!["example.com".into()]).allows_network());
        assert!(NetworkMode::Full.allows_network());
    }

    #[test]
    fn sandbox_spec_default_has_no_network() {
        let spec = SandboxSpec::default();
        assert_eq!(spec.network, NetworkMode::None);
        assert_eq!(spec.timeout_seconds, 1800);
    }
}
