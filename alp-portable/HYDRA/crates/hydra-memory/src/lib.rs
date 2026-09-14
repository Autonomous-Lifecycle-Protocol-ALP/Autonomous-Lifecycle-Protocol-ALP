use chrono::Utc;
use hydra_audit::AuditLog;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum MemoryScope {
    Project,
    Session,
    Global,
}

impl MemoryScope {
    pub fn as_str(&self) -> &'static str {
        match self {
            MemoryScope::Project => "project",
            MemoryScope::Session => "session",
            MemoryScope::Global => "global",
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum MemoryClassification {
    Trusted,
    Pending,
    Untrusted,
}

impl MemoryClassification {
    pub fn as_str(&self) -> &'static str {
        match self {
            MemoryClassification::Trusted => "trusted",
            MemoryClassification::Pending => "pending",
            MemoryClassification::Untrusted => "untrusted",
        }
    }

    pub fn is_trusted(&self) -> bool {
        matches!(self, MemoryClassification::Trusted)
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MemoryEntry {
    pub id: String,
    pub source: String,
    pub timestamp: String,
    pub scope: MemoryScope,
    pub confidence: f64,
    pub provenance: String,
    pub classification: MemoryClassification,
    pub version: u32,
    pub tags: Vec<String>,
    pub content: HashMap<String, String>,
}

impl MemoryEntry {
    pub fn new(
        source: &str,
        scope: MemoryScope,
        provenance: &str,
        content: HashMap<String, String>,
    ) -> Self {
        Self {
            id: uuid::Uuid::new_v4().to_string(),
            source: source.into(),
            timestamp: Utc::now().to_rfc3339(),
            scope,
            confidence: 1.0,
            provenance: provenance.into(),
            classification: MemoryClassification::Untrusted,
            version: 1,
            tags: Vec::new(),
            content,
        }
    }

    pub fn trust(mut self) -> Self {
        self.classification = MemoryClassification::Trusted;
        self.version += 1;
        self
    }

    pub fn is_trusted(&self) -> bool {
        self.classification.is_trusted()
    }

    pub fn matches_query(&self, query: &str) -> bool {
        let q = query.to_lowercase();
        self.source.to_lowercase().contains(&q)
            || self.provenance.to_lowercase().contains(&q)
            || self.tags.iter().any(|t| t.to_lowercase().contains(&q))
            || self
                .content
                .values()
                .any(|v| v.to_lowercase().contains(&q))
    }
}

#[derive(Debug, Clone)]
pub struct WorkingMemory {
    entries: Arc<RwLock<HashMap<String, String>>>,
}

impl WorkingMemory {
    pub fn new() -> Self {
        Self {
            entries: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    pub async fn set(&self, key: &str, value: &str) {
        self.entries.write().await.insert(key.into(), value.into());
    }

    pub async fn get(&self, key: &str) -> Option<String> {
        self.entries.read().await.get(key).cloned()
    }

    pub async fn keys(&self) -> Vec<String> {
        self.entries.read().await.keys().cloned().collect()
    }

    pub async fn clear_all(&self) {
        self.entries.write().await.clear();
    }

    pub async fn len(&self) -> usize {
        self.entries.read().await.len()
    }
}

impl Default for WorkingMemory {
    fn default() -> Self {
        Self::new()
    }
}

pub struct ProjectMemory {
    entries: Arc<RwLock<Vec<MemoryEntry>>>,
}

impl ProjectMemory {
    pub fn new() -> Self {
        Self {
            entries: Arc::new(RwLock::new(Vec::new())),
        }
    }

    pub async fn add(&self, entry: MemoryEntry) -> String {
        let id = entry.id.clone();
        self.entries.write().await.push(entry);
        id
    }

    pub async fn search(&self, query: &str) -> Vec<MemoryEntry> {
        self.entries
            .read()
            .await
            .iter()
            .filter(|e| e.is_trusted() && e.matches_query(query))
            .cloned()
            .collect()
    }

    pub async fn search_all(&self, query: &str) -> Vec<MemoryEntry> {
        self.entries
            .read()
            .await
            .iter()
            .filter(|e| e.matches_query(query))
            .cloned()
            .collect()
    }

    pub async fn get(&self, id: &str) -> Option<MemoryEntry> {
        self.entries.read().await.iter().find(|e| e.id == id).cloned()
    }

    pub async fn promote(&self, id: &str) -> Option<MemoryEntry> {
        let mut entries = self.entries.write().await;
        if let Some(entry) = entries.iter_mut().find(|e| e.id == id) {
            entry.classification = MemoryClassification::Trusted;
            entry.version += 1;
            Some(entry.clone())
        } else {
            None
        }
    }

    pub async fn len(&self) -> usize {
        self.entries.read().await.len()
    }
}

impl Default for ProjectMemory {
    fn default() -> Self {
        Self::new()
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Experience {
    pub id: String,
    pub timestamp: String,
    pub outcome: String,
    pub tags: Vec<String>,
    pub summary: String,
}

pub struct EpisodicMemory {
    experiences: Arc<RwLock<Vec<Experience>>>,
}

impl EpisodicMemory {
    pub fn new() -> Self {
        Self {
            experiences: Arc::new(RwLock::new(Vec::new())),
        }
    }

    pub async fn add_experience(&self, outcome: &str, tags: Vec<String>, summary: &str) -> String {
        let exp = Experience {
            id: uuid::Uuid::new_v4().to_string(),
            timestamp: Utc::now().to_rfc3339(),
            outcome: outcome.into(),
            tags,
            summary: summary.into(),
        };
        let id = exp.id.clone();
        self.experiences.write().await.push(exp);
        id
    }

    pub async fn recent(&self, count: usize) -> Vec<Experience> {
        let exps = self.experiences.read().await;
        let start = exps.len().saturating_sub(count);
        exps[start..].to_vec()
    }

    pub async fn search(&self, query: &str) -> Vec<Experience> {
        let q = query.to_lowercase();
        self.experiences
            .read()
            .await
            .iter()
            .filter(|e| {
                e.outcome.to_lowercase().contains(&q)
                    || e.summary.to_lowercase().contains(&q)
                    || e.tags.iter().any(|t| t.to_lowercase().contains(&q))
            })
            .cloned()
            .collect()
    }

    pub async fn len(&self) -> usize {
        self.experiences.read().await.len()
    }
}

impl Default for EpisodicMemory {
    fn default() -> Self {
        Self::new()
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Skill {
    pub name: String,
    pub version: String,
    pub description: String,
    pub steps: Vec<String>,
    pub tags: Vec<String>,
}

pub struct SkillMemory {
    skills: Arc<RwLock<HashMap<String, Skill>>>,
}

impl SkillMemory {
    pub fn new() -> Self {
        Self {
            skills: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    pub async fn register_skill(&self, skill: Skill) -> Result<(), String> {
        if self.skills.read().await.contains_key(&skill.name) {
            return Err(format!("skill '{}' already registered", skill.name));
        }
        self
            .skills
            .write()
            .await
            .insert(skill.name.clone(), skill);
        Ok(())
    }

    pub async fn get_skill(&self, name: &str) -> Option<Skill> {
        self.skills.read().await.get(name).cloned()
    }

    pub async fn list_skills(&self) -> Vec<Skill> {
        self.skills.read().await.values().cloned().collect()
    }

    pub async fn len(&self) -> usize {
        self.skills.read().await.len()
    }
}

impl Default for SkillMemory {
    fn default() -> Self {
        Self::new()
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Document {
    pub id: String,
    pub name: String,
    pub source: String,
    pub timestamp: String,
    pub classification: MemoryClassification,
    pub tags: Vec<String>,
    pub content: String,
}

impl Document {
    pub fn trust(mut self) -> Self {
        self.classification = MemoryClassification::Trusted;
        self
    }

    pub fn is_trusted(&self) -> bool {
        self.classification.is_trusted()
    }
}

pub struct KnowledgeBase {
    documents: Arc<RwLock<Vec<Document>>>,
}

impl KnowledgeBase {
    pub fn new() -> Self {
        Self {
            documents: Arc::new(RwLock::new(Vec::new())),
        }
    }

    pub async fn add_document(&self, doc: Document) -> String {
        let id = doc.id.clone();
        self.documents.write().await.push(doc);
        id
    }

    pub async fn get_document(&self, id: &str) -> Option<Document> {
        self.documents
            .read()
            .await
            .iter()
            .find(|d| d.id == id)
            .cloned()
    }

    pub async fn trusted_documents(&self) -> Vec<Document> {
        self.documents
            .read()
            .await
            .iter()
            .filter(|d| d.is_trusted())
            .cloned()
            .collect()
    }

    pub async fn len(&self) -> usize {
        self.documents.read().await.len()
    }
}

impl Default for KnowledgeBase {
    fn default() -> Self {
        Self::new()
    }
}

pub struct MemoryStore {
    pub working: WorkingMemory,
    pub project: ProjectMemory,
    pub episodic: EpisodicMemory,
    pub skills: SkillMemory,
    pub knowledge: KnowledgeBase,
    pub audit: AuditLog,
}

impl MemoryStore {
    pub fn new() -> Self {
        Self {
            working: WorkingMemory::new(),
            project: ProjectMemory::new(),
            episodic: EpisodicMemory::new(),
            skills: SkillMemory::new(),
            knowledge: KnowledgeBase::new(),
            audit: AuditLog::new(),
        }
    }

    pub fn audit_record(
        &mut self,
        task_id: &str,
        actor: &str,
        action: &str,
        target: &str,
        capability: &str,
        result: &str,
        risk: &str,
    ) {
        self.audit.record_event(
            task_id.into(),
            actor.into(),
            action.into(),
            target.into(),
            capability.into(),
            result.into(),
            risk.into(),
        );
    }

    pub fn verify_chain(&self) -> bool {
        self.audit.verify_chain()
    }

    pub fn export_audit(&self) -> String {
        self.audit.export_jsonl()
    }

    pub fn audit_len(&self) -> usize {
        self.audit.len()
    }

    pub fn last_hash(&self) -> Option<String> {
        self.audit.last_hash()
    }
}

impl Default for MemoryStore {
    fn default() -> Self {
        Self::new()
    }
}

pub enum MemoryContentType {
    Fact,
    Instruction,
    Decision,
    Code,
    Unknown,
}

impl MemoryContentType {
    pub fn as_str(&self) -> &'static str {
        match self {
            MemoryContentType::Fact => "fact",
            MemoryContentType::Instruction => "instruction",
            MemoryContentType::Decision => "decision",
            MemoryContentType::Code => "code",
            MemoryContentType::Unknown => "unknown",
        }
    }
}

pub struct MemoryPipeline {
    store: Arc<RwLock<MemoryStore>>,
}

impl MemoryPipeline {
    pub fn new(store: Arc<RwLock<MemoryStore>>) -> Self {
        Self { store }
    }

    pub async fn ingest(
        &self,
        source: &str,
        scope: MemoryScope,
        provenance: &str,
        content: HashMap<String, String>,
    ) -> String {
        let classification = match provenance {
            "user_approved" => MemoryClassification::Trusted,
            "internal" => MemoryClassification::Pending,
            _ => MemoryClassification::Untrusted,
        };

        let mut entry = MemoryEntry::new(source, scope, provenance, content);
        entry.classification = classification;
        entry.version = 1;

        let entry_type = self.classify(&entry);
        entry.tags.push(entry_type.as_str().to_string());

        let id = self.store.write().await.project.add(entry).await;

        self.store
            .write()
            .await
            .audit_record("pipeline", "memory", "ingest", source, "memory.write", "ok", "low");

        id
    }

    fn classify(&self, entry: &MemoryEntry) -> MemoryContentType {
        let combined: String = entry
            .content
            .values()
            .map(|v| v.to_lowercase())
            .collect::<String>();

        if combined.contains("decid") || combined.contains("architect") {
            MemoryContentType::Decision
        } else if combined.contains("code") || combined.contains("fn ") || combined.contains("impl ") {
            MemoryContentType::Code
        } else if combined.contains("fact") {
            MemoryContentType::Fact
        } else if combined.contains("instruction") || combined.contains("rule") {
            MemoryContentType::Instruction
        } else {
            MemoryContentType::Unknown
        }
    }

    pub async fn validate(&self, entry_id: &str) -> bool {
        self.store
            .read()
            .await
            .project
            .get(entry_id)
            .await
            .map(|e| e.is_trusted())
            .unwrap_or(false)
    }

    pub async fn promote(&self, entry_id: &str, trusted_source: &str) -> Result<(), String> {
        let entry = self.store.read().await.project.get(entry_id).await;
        if let Some(entry) = entry {
            if entry.provenance == trusted_source {
                let promoted = self.store.write().await.project.promote(entry_id).await;
                if promoted.is_some() {
                    self.store
                        .write()
                        .await
                        .audit_record("pipeline", "memory", "promote", entry_id, "memory.write", "ok", "low");
                    Ok(())
                } else {
                    Err(format!("entry '{entry_id}' not found"))
                }
            } else {
                Err(format!(
                    "promotion not authorized: entry provenance '{}' != '{}'",
                    entry.provenance, trusted_source
                ))
            }
        } else {
            Err(format!("entry '{entry_id}' not found"))
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn working_memory_set_and_get() {
        let mem = WorkingMemory::new();
        mem.set("task", "build hydra").await;
        assert_eq!(mem.get("task").await.unwrap(), "build hydra");
        assert_eq!(mem.len().await, 1);
    }

    #[tokio::test]
    async fn memory_entry_default_is_untrusted() {
        let entry = MemoryEntry::new("src", MemoryScope::Project, "external", HashMap::new());
        assert!(!entry.is_trusted());
        let trusted = entry.trust();
        assert!(trusted.is_trusted());
    }

    #[tokio::test]
    async fn project_memory_search_only_trusted() {
        let mem = ProjectMemory::new();
        let mut content = HashMap::new();
        content.insert("key".into(), "hello secret".into());

        let untrusted_id = mem
            .add(MemoryEntry::new("src", MemoryScope::Project, "external", content.clone()))
            .await;
        let trusted_id = mem
            .add(
                MemoryEntry::new("src", MemoryScope::Project, "internal", content)
                    .trust(),
            )
            .await;

        let results = mem.search("hello").await;
        assert_eq!(results.len(), 1);
        assert_eq!(results[0].id, trusted_id);

        let all = mem.search_all("hello").await;
        assert_eq!(all.len(), 2);

        let promoted = mem.promote(&untrusted_id).await.unwrap();
        assert!(promoted.is_trusted());

        let results_after = mem.search("hello").await;
        assert_eq!(results_after.len(), 2);
    }

    #[tokio::test]
    async fn episodic_memory_add_and_recent() {
        let mem = EpisodicMemory::new();
        let id = mem
            .add_experience("success", vec!["build".into()], "built component")
            .await;
        assert!(!id.is_empty());
        let recent = mem.recent(5).await;
        assert_eq!(recent.len(), 1);
        assert_eq!(recent[0].outcome, "success");
    }

    #[tokio::test]
    async fn episodic_memory_search() {
        let mem = EpisodicMemory::new();
        mem.add_experience("success", vec!["build".into()], "built component")
            .await;
        let results = mem.search("build").await;
        assert_eq!(results.len(), 1);
        let none = mem.search("nonexistent").await;
        assert!(none.is_empty());
    }

    #[tokio::test]
    async fn skill_memory_register_and_get() {
        let mem = SkillMemory::new();
        let skill = Skill {
            name: "test-skill".into(),
            version: "1.0.0".into(),
            description: "does a thing".into(),
            steps: vec!["step-1".into(), "step-2".into()],
            tags: vec!["test".into()],
        };
        mem.register_skill(skill).await.unwrap();
        assert_eq!(mem.len().await, 1);
        let retrieved = mem.get_skill("test-skill").await.unwrap();
        assert_eq!(retrieved.steps.len(), 2);
    }

    #[tokio::test]
    async fn skill_memory_rejects_duplicate() {
        let mem = SkillMemory::new();
        let skill = Skill {
            name: "dup".into(),
            version: "1.0.0".into(),
            description: "x".into(),
            steps: vec!["s".into()],
            tags: vec![],
        };
        mem.register_skill(skill).await.unwrap();
        let result = mem.register_skill(Skill {
            name: "dup".into(),
            version: "1.0.0".into(),
            description: "y".into(),
            steps: vec!["s".into()],
            tags: vec![],
        })
        .await;
        assert!(result.is_err());
    }

    #[tokio::test]
    async fn knowledge_base_add_and_get() {
        let kb = KnowledgeBase::new();
        let doc = Document {
            id: "doc-1".into(),
            name: "README".into(),
            source: "github".into(),
            timestamp: "now".into(),
            classification: MemoryClassification::Trusted,
            tags: vec!["intro".into()],
            content: "HYDRA is a portable agent".into(),
        };
        kb.add_document(doc).await;
        assert_eq!(kb.len().await, 1);
        let retrieved = kb.get_document("doc-1").await.unwrap();
        assert_eq!(retrieved.name, "README");
        let trusted = kb.trusted_documents().await;
        assert_eq!(trusted.len(), 1);
    }

    #[tokio::test]
    async fn memory_pipeline_ingest_trusted_when_approved() {
        let store = Arc::new(RwLock::new(MemoryStore::new()));
        let pipeline = MemoryPipeline::new(store.clone());

        let mut content = HashMap::new();
        content.insert("fact".into(), "HYDRA uses Rust".into());
        let untrusted_id = pipeline
            .ingest("wiki", MemoryScope::Global, "external", content.clone())
            .await;
        assert!(!pipeline.validate(&untrusted_id).await);

        let trusted_id = pipeline
            .ingest("docs", MemoryScope::Global, "user_approved", content)
            .await;
        assert!(pipeline.validate(&trusted_id).await);
    }

    #[tokio::test]
    async fn memory_pipeline_promote_requires_matching_provenance() {
        let store = Arc::new(RwLock::new(MemoryStore::new()));
        let pipeline = MemoryPipeline::new(store);

        let mut content = HashMap::new();
        content.insert("k".into(), "v".into());
        let id = pipeline
            .ingest("wiki", MemoryScope::Global, "external", content)
            .await;

        let err = pipeline.promote(&id, "internal").await;
        assert!(err.is_err());

        let ok = pipeline.promote(&id, "external").await;
        assert!(ok.is_ok());
        assert!(pipeline.validate(&id).await);
    }

    #[tokio::test]
    async fn memory_store_chain_verifies() {
        let mut store = MemoryStore::new();
        store.audit_record("t1", "test", "ingest", "entry", "memory.write", "ok", "low");
        store.audit_record("t1", "test", "promote", "entry", "memory.write", "ok", "low");
        assert!(store.verify_chain());
        assert_eq!(store.audit_len(), 2);
    }
}
