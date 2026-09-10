use std::collections::HashMap;

pub struct IntentEngine {
    pub intents: Vec<Intent>,
}

pub struct Intent {
    pub name: String,
    pub confidence: f64,
    pub entities: HashMap<String, String>,
}

impl IntentEngine {
    pub fn new() -> Self {
        Self { intents: Vec::new() }
    }

    pub fn classify(&self, text: &str) -> Intent {
        let lower = text.to_lowercase();
        let (name, confidence) = if lower.contains("run") || lower.contains("execute") {
            ("execute_task", 0.9)
        } else if lower.contains("list") || lower.contains("show") {
            ("list_items", 0.85)
        } else if lower.contains("create") || lower.contains("new") {
            ("create_item", 0.8)
        } else if lower.contains("delete") || lower.contains("remove") {
            ("delete_item", 0.8)
        } else {
            ("unknown", 0.3)
        };
        Intent { name: name.into(), confidence, entities: HashMap::new() }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn intent_classify_execute() {
        let engine = IntentEngine::new();
        let intent = engine.classify("run the task");
        assert_eq!(intent.name, "execute_task");
        assert!(intent.confidence > 0.0);
    }

    #[test]
    fn intent_classify_list() {
        let engine = IntentEngine::new();
        let intent = engine.classify("list all items");
        assert_eq!(intent.name, "list_items");
    }

    #[test]
    fn intent_classify_unknown() {
        let engine = IntentEngine::new();
        let intent = engine.classify("hello world");
        assert_eq!(intent.name, "unknown");
    }
}
