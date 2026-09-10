use std::sync::Arc;
use tokio::sync::RwLock;

pub struct SkillRegistry {
    pub skills: Arc<RwLock<Vec<Skill>>>,
}

#[derive(Debug, Clone, PartialEq)]
pub struct SkillParameter {
    pub name: String,
    pub param_type: String,
    pub required: bool,
}

#[derive(Debug, Clone, PartialEq)]
pub struct Skill {
    pub id: String,
    pub name: String,
    pub version: String,
    pub description: String,
    pub parameters: Vec<SkillParameter>,
}

impl SkillRegistry {
    pub fn new() -> Self {
        Self { skills: Arc::new(RwLock::new(Vec::new())) }
    }

    pub async fn register(&self, skill: Skill) {
        self.skills.write().await.push(skill);
    }

    pub async fn list(&self) -> Vec<Skill> {
        self.skills.read().await.clone()
    }

    pub async fn get(&self, id: &str) -> Option<Skill> {
        self.skills.read().await.iter().find(|s| s.id == id).cloned()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn skill_registry_register_and_list() {
        let registry = SkillRegistry::new();
        let skill = Skill {
            id: "skill-1".into(),
            name: "test-skill".into(),
            version: "1.0.0".into(),
            description: "A test skill".into(),
            parameters: vec![],
        };
        registry.register(skill.clone()).await;
        let list = registry.list().await;
        assert_eq!(list.len(), 1);
        assert_eq!(list[0].name, "test-skill");
    }

    #[tokio::test]
    async fn skill_registry_get_returns_none() {
        let registry = SkillRegistry::new();
        assert!(registry.get("missing").await.is_none());
    }
}
