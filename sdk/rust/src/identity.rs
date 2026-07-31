use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::Path;
use std::time::{SystemTime, UNIX_EPOCH};

pub struct AgentIdentity {
    pub did: String,
    pub agent_id: String,
    pub public_key: String,
    pub created_at: String,
    pub metadata: HashMap<String, serde_json::Value>,
}

impl AgentIdentity {
    pub fn new(
        did: impl Into<String>,
        agent_id: impl Into<String>,
        public_key: impl Into<String>,
    ) -> Self {
        Self {
            did: did.into(),
            agent_id: agent_id.into(),
            public_key: public_key.into(),
            created_at: timestamp_now(),
            metadata: HashMap::new(),
        }
    }

    pub fn to_dict(&self) -> HashMap<String, serde_json::Value> {
        let mut dict = HashMap::new();
        dict.insert("did".into(), serde_json::Value::String(self.did.clone()));
        dict.insert(
            "agent_id".into(),
            serde_json::Value::String(self.agent_id.clone()),
        );
        dict.insert(
            "public_key".into(),
            serde_json::Value::String(self.public_key.clone()),
        );
        dict.insert(
            "created_at".into(),
            serde_json::Value::String(self.created_at.clone()),
        );
        dict.insert(
            "metadata".into(),
            serde_json::Value::Object(self.metadata.clone().collect()),
        );
        dict
    }
}

pub struct VerifiablePresentation {
    pub did: String,
    pub agent_id: String,
    pub claims: HashMap<String, serde_json::Value>,
    pub signature: String,
    pub issued_at: String,
}

impl VerifiablePresentation {
    pub fn new(
        did: impl Into<String>,
        agent_id: impl Into<String>,
        claims: HashMap<String, serde_json::Value>,
        signature: impl Into<String>,
    ) -> Self {
        Self {
            did: did.into(),
            agent_id: agent_id.into(),
            claims,
            signature: signature.into(),
            issued_at: timestamp_now(),
        }
    }

    pub fn verify(&self, public_key: &str) -> bool {
        let payload = serde_json::json!({
            "did": self.did,
            "agent_id": self.agent_id,
            "claims": self.claims,
        });
        let payload_str = payload.to_string();
        let expected = simple_hash(&(payload_str + public_key));
        self.signature == expected
    }

    pub fn sign(&mut self, private_key: &str) -> String {
        let payload = serde_json::json!({
            "did": self.did,
            "agent_id": self.agent_id,
            "claims": self.claims,
        });
        let payload_str = payload.to_string();
        self.signature = simple_hash(&(payload_str + private_key));
        self.signature.clone()
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TrustEntry {
    pub agent_id: String,
    pub scopes: Vec<String>,
    pub trust_level: String,
    pub registered_at: String,
}

impl TrustEntry {
    pub fn new(
        agent_id: impl Into<String>,
        scopes: Vec<String>,
        trust_level: impl Into<String>,
    ) -> Self {
        Self {
            agent_id: agent_id.into(),
            scopes,
            trust_level: trust_level.into(),
            registered_at: timestamp_now(),
        }
    }
}

pub struct TrustRegistry {
    alp_dir: String,
    entries: HashMap<String, TrustEntry>,
}

impl TrustRegistry {
    pub fn new(alp_dir: impl Into<String>) -> Self {
        let alp_dir = alp_dir.into();
        let mut registry = Self {
            alp_dir: alp_dir.clone(),
            entries: HashMap::new(),
        };
        registry.load();
        registry
    }

    fn identity_dir(&self) -> String {
        Path::new(&self.alp_dir)
            .join(".identity")
            .to_string_lossy()
            .into_owned()
    }

    fn trust_path(&self) -> String {
        Path::new(&self.identity_dir())
            .join("trust_registry.json")
            .to_string_lossy()
            .into_owned()
    }

    pub fn load(&mut self) {
        let path = self.trust_path();
        if !std::path::Path::new(&path).exists() {
            return;
        }
        if let Ok(content) = std::fs::read_to_string(&path) {
            if let Ok(entries) = serde_json::from_str::<HashMap<String, TrustEntry>>(&content) {
                self.entries = entries;
            }
        }
    }

    pub fn save(&self) {
        let dir = self.identity_dir();
        let _ = std::fs::create_dir_all(&dir);
        let path = self.trust_path();
        if let Ok(json) = serde_json::to_string_pretty(&self.entries) {
            let _ = std::fs::write(path, json);
        }
    }

    pub fn register(
        &mut self,
        did: impl Into<String>,
        agent_id: impl Into<String>,
        scopes: Vec<String>,
        trust_level: impl Into<String>,
    ) -> TrustEntry {
        let entry = TrustEntry::new(agent_id, scopes, trust_level);
        let did = did.into();
        self.entries.insert(did.clone(), entry.clone());
        self.save();
        entry
    }

    pub fn resolve(&self, did: &str) -> Option<&TrustEntry> {
        self.entries.get(did)
    }

    pub fn revoke(&mut self, did: &str) -> bool {
        if self.entries.remove(did).is_some() {
            self.save();
            true
        } else {
            false
        }
    }

    pub fn list_dids(&self) -> Vec<String> {
        self.entries.keys().cloned().collect()
    }

    pub fn has_scope(&self, did: &str, required_scope: &str) -> bool {
        if let Some(entry) = self.entries.get(did) {
            entry.scopes.contains(&required_scope.to_string())
        } else {
            false
        }
    }
}

pub struct IdentityResolver {
    trust_registry: std::rc::Rc<std::cell::RefCell<TrustRegistry>>,
}

impl IdentityResolver {
    pub fn new(trust_registry: std::rc::Rc<std::cell::RefCell<TrustRegistry>>) -> Self {
        Self { trust_registry }
    }

    pub fn verify_presentation(
        &self,
        presentation: &VerifiablePresentation,
        public_key: &str,
    ) -> HashMap<String, serde_json::Value> {
        let mut result = HashMap::new();
        if !presentation.verify(public_key) {
            result.insert("valid".into(), serde_json::Value::Bool(false));
            result.insert(
                "reason".into(),
                serde_json::Value::String("invalid_signature".into()),
            );
            return result;
        }
        let registry = self.trust_registry.borrow();
        if let Some(entry) = registry.resolve(&presentation.did) {
            result.insert("valid".into(), serde_json::Value::Bool(true));
            result.insert(
                "did".into(),
                serde_json::Value::String(presentation.did.clone()),
            );
            result.insert(
                "agent_id".into(),
                serde_json::Value::String(presentation.agent_id.clone()),
            );
            result.insert(
                "scopes".into(),
                serde_json::Value::Array(
                    entry
                        .scopes
                        .iter()
                        .map(|s| serde_json::Value::String(s.clone()))
                        .collect(),
                ),
            );
            result.insert(
                "trust_level".into(),
                serde_json::Value::String(entry.trust_level.clone()),
            );
        } else {
            result.insert("valid".into(), serde_json::Value::Bool(false));
            result.insert(
                "reason".into(),
                serde_json::Value::String("unknown_did".into()),
            );
        }
        result
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct KeyPair {
    pub public_key: String,
    pub private_key: String,
}

impl KeyPair {
    pub fn new(public_key: impl Into<String>, private_key: impl Into<String>) -> Self {
        Self {
            public_key: public_key.into(),
            private_key: private_key.into(),
        }
    }
}

pub struct AgentKeyStore {
    alp_dir: String,
    keys: HashMap<String, KeyPair>,
}

impl AgentKeyStore {
    pub fn new(alp_dir: impl Into<String>) -> Self {
        let alp_dir = alp_dir.into();
        let mut store = Self {
            alp_dir: alp_dir.clone(),
            keys: HashMap::new(),
        };
        store.load();
        store
    }

    fn identity_dir(&self) -> String {
        Path::new(&self.alp_dir)
            .join(".identity")
            .to_string_lossy()
            .into_owned()
    }

    fn keys_path(&self) -> String {
        Path::new(&self.identity_dir())
            .join("agent_keys.json")
            .to_string_lossy()
            .into_owned()
    }

    pub fn load(&mut self) {
        let path = self.keys_path();
        if !std::path::Path::new(&path).exists() {
            return;
        }
        if let Ok(content) = std::fs::read_to_string(&path) {
            if let Ok(keys) = serde_json::from_str::<HashMap<String, KeyPair>>(&content) {
                self.keys = keys;
            }
        }
    }

    pub fn save(&self) {
        let dir = self.identity_dir();
        let _ = std::fs::create_dir_all(&dir);
        let path = self.keys_path();
        if let Ok(json) = serde_json::to_string_pretty(&self.keys) {
            let _ = std::fs::write(path, json);
        }
    }

    pub fn store_key(
        &mut self,
        did: impl Into<String>,
        public_key: impl Into<String>,
        private_key: impl Into<String>,
    ) {
        let did = did.into();
        let pair = KeyPair::new(public_key, private_key);
        self.keys.insert(did.clone(), pair);
        self.save();
    }

    pub fn get_key(&self, did: &str) -> Option<&KeyPair> {
        self.keys.get(did)
    }

    pub fn remove_key(&mut self, did: &str) -> bool {
        if self.keys.remove(did).is_some() {
            self.save();
            true
        } else {
            false
        }
    }
}

pub fn generate_keypair() -> KeyPair {
    let ts = timestamp_now();
    let private_key = format!("{}-{}", ts, simple_hash(&ts));
    let public_key = simple_hash(&private_key);
    KeyPair::new(public_key, private_key)
}

pub fn create_did(agent_id: impl Into<String>, public_key: impl Into<String>) -> String {
    let public_key = public_key.into();
    let key_hash = simple_hash(&public_key);
    format!(
        "did:alp:{}:{}",
        agent_id.into(),
        &key_hash[..16.min(key_hash.len())]
    )
}

fn timestamp_now() -> String {
    let now = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default();
    now.as_millis().to_string()
}

fn simple_hash(input: &str) -> String {
    let mut hash: u64 = 0;
    for byte in input.bytes() {
        hash = hash.wrapping_mul(31).wrapping_add(byte as u64);
    }
    format!("{:x}", hash)
}
