use uuid::Uuid;

pub struct Task {
    pub id: String,
    pub goal: String,
    pub context: std::collections::HashMap<String, String>,
    pub result: Option<String>,
}

impl Task {
    pub fn new(goal: &str) -> Self {
        Self {
            id: Uuid::new_v4().to_string(),
            goal: goal.into(),
            context: std::collections::HashMap::new(),
            result: None,
        }
    }
}
