use std::collections::HashMap;

pub struct ContextEngine {
    pub max_tokens: usize,
    pub store: HashMap<String, Vec<ContextSlice>>,
}

pub struct ContextSlice {
    pub source: String,
    pub content: String,
    pub tokens_estimate: usize,
}

impl ContextEngine {
    pub fn new(max_tokens: usize) -> Self {
        Self {
            max_tokens,
            store: HashMap::new(),
        }
    }

    pub fn add(&mut self, key: &str, slice: ContextSlice) {
        self.store.entry(key.into()).or_default().push(slice);
    }

    pub fn build_prompt(&self, key: &str, query: &str) -> String {
        let mut out = Vec::new();
        let mut total = 0usize;
        if let Some(slices) = self.store.get(key) {
            for s in slices {
                if total + s.tokens_estimate > self.max_tokens {
                    break;
                }
                total += s.tokens_estimate;
                out.push(s.content.clone());
            }
        }
        out.push(query.into());
        out.join("\n\n")
    }
}
