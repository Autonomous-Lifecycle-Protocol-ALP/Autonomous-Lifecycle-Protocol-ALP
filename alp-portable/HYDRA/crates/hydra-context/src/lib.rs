pub struct ContextEngine {
    pub slices: Vec<ContextSlice>,
    pub max_tokens: usize,
}

pub struct ContextSlice {
    pub id: String,
    pub source: String,
    pub content: String,
    pub tokens_estimate: usize,
    pub embedding: Option<Vec<f32>>,
}

impl ContextEngine {
    pub fn new(max_tokens: usize) -> Self {
        Self { slices: Vec::new(), max_tokens }
    }

    pub fn add_slice(&mut self, slice: ContextSlice) {
        self.slices.push(slice);
    }

    pub fn build_prompt(&self, query: &str) -> String {
        let mut out = Vec::new();
        let mut total = 0usize;
        for s in &self.slices {
            if total + s.tokens_estimate > self.max_tokens {
                break;
            }
            total += s.tokens_estimate;
            out.push(s.content.clone());
        }
        out.push(query.into());
        out.join("\n\n")
    }

    pub fn search(&self, query: &str) -> Vec<&ContextSlice> {
        let q = query.to_lowercase();
        self.slices.iter().filter(|s| s.content.to_lowercase().contains(&q)).collect()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn context_engine_builds_prompt() {
        let mut engine = ContextEngine::new(100);
        engine.add_slice(ContextSlice { id: "s1".into(), source: "doc".into(), content: "alpha".into(), tokens_estimate: 10, embedding: None });
        engine.add_slice(ContextSlice { id: "s2".into(), source: "doc".into(), content: "beta".into(), tokens_estimate: 20, embedding: None });
        let prompt = engine.build_prompt("query");
        assert!(prompt.contains("alpha"));
        assert!(prompt.contains("beta"));
        assert!(prompt.ends_with("query"));
    }

    #[test]
    fn context_engine_search_matches_content() {
        let mut engine = ContextEngine::new(100);
        engine.add_slice(ContextSlice { id: "s1".into(), source: "doc".into(), content: "hello world".into(), tokens_estimate: 5, embedding: None });
        let results = engine.search("hello");
        assert_eq!(results.len(), 1);
        assert_eq!(results[0].id, "s1");
    }

    #[test]
    fn context_engine_search_returns_empty_for_no_match() {
        let engine = ContextEngine::new(100);
        let results = engine.search("nomatch");
        assert!(results.is_empty());
    }
}
