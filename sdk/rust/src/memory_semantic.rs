use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::RwLock;

lazy_static::lazy_static! {
    static ref GLOBAL_GRAPH: RwLock<Option<SemanticGraph>> = RwLock::new(None);
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MemoryNode {
    pub id: String,
    pub content: String,
    pub embed: Option<Vec<f64>>,
    pub meta: Option<HashMap<String, String>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MemoryEdge {
    pub source: String,
    pub target: String,
    pub weight: f64,
    pub relation: String,
}

#[derive(Default)]
pub struct SemanticGraph {
    nodes: HashMap<String, MemoryNode>,
    edges: Vec<MemoryEdge>,
}

impl SemanticGraph {
    pub fn new() -> Self {
        Self {
            nodes: HashMap::new(),
            edges: Vec::new(),
        }
    }

    pub fn add_node(&mut self, id: &str, content: &str, meta: Option<HashMap<String, String>>) {
        self.nodes.insert(
            id.to_string(),
            MemoryNode {
                id: id.to_string(),
                content: content.to_string(),
                embed: None,
                meta,
            },
        );
    }

    pub fn add_edge(&mut self, source: &str, target: &str, relation: &str, weight: f64) {
        self.edges.push(MemoryEdge {
            source: source.to_string(),
            target: target.to_string(),
            weight,
            relation: relation.to_string(),
        });
    }

    pub fn search(&self, query: &str, threshold: f64) -> Vec<&MemoryNode> {
        let q = query.to_lowercase();
        self.nodes
            .values()
            .filter(|n| similarity(&n.content.to_lowercase(), &q) >= threshold)
            .collect()
    }

    pub fn consolidate(&mut self) {
        use std::collections::HashSet;
        let mut seen = HashSet::new();
        let mut edges = Vec::new();
        for e in &self.edges {
            let key = format!("{}-{}", e.source, e.target);
            if seen.insert(key) {
                edges.push(e.clone());
            }
        }
        self.edges = edges;
    }
}

fn similarity(a: &str, b: &str) -> f64 {
    if a.is_empty() || b.is_empty() {
        return 0.0;
    }
    let words_a: Vec<&str> = a.split_whitespace().collect();
    let words_b: Vec<&str> = b.split_whitespace().collect();
    let mut common = 0;
    for wa in &words_a {
        for wb in &words_b {
            if *wa == *wb {
                common += 1;
            }
        }
    }
    let denom = words_a.len() + words_b.len();
    if denom == 0 {
        0.0
    } else {
        (common * 2) as f64 / denom as f64
    }
}

pub fn init_global_graph(graph: SemanticGraph) {
    let mut g = GLOBAL_GRAPH.write().unwrap();
    *g = Some(graph);
}

pub fn global_graph() -> Option<std::sync::RwLockReadGuard<'static, Option<SemanticGraph>>> {
    Some(GLOBAL_GRAPH.read().unwrap())
}
