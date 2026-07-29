use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::path::Path;
use thiserror::Error;

#[derive(Debug, Error)]
#[error("{0}")]
pub struct AlpError(String);

impl AlpError {
    pub fn new(message: impl Into<String>) -> Self {
        Self(message.into())
    }
}

impl From<serde_json::Error> for AlpError {
    fn from(err: serde_json::Error) -> Self {
        Self::new(err.to_string())
    }
}

impl From<std::io::Error> for AlpError {
    fn from(err: std::io::Error) -> Self {
        Self::new(err.to_string())
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AlpObject {
    pub id: String,
    #[serde(rename = "type")]
    pub object_type: String,
    #[serde(flatten)]
    pub properties: HashMap<String, serde_json::Value>,
}

impl AlpObject {
    pub fn new(id: impl Into<String>, object_type: impl Into<String>) -> Self {
        Self {
            id: id.into(),
            object_type: object_type.into(),
            properties: HashMap::new(),
        }
    }

    pub fn with_property(mut self, key: impl Into<String>, value: impl Into<serde_json::Value>) -> Self {
        self.properties.insert(key.into(), value.into());
        self
    }

    pub fn to_json(&self) -> Result<String, AlpError> {
        serde_json::to_string_pretty(self).map_err(AlpError::from)
    }
}

pub struct AlpParser;

impl AlpParser {
    pub fn parse(source: &str) -> Result<Vec<AlpObject>, AlpError> {
        let blocks: Vec<&str> = source.split("\n\n").collect();
        let mut objects = Vec::new();
        for block in blocks {
            let trimmed = block.trim();
            if !trimmed.is_empty() {
                if let Some(obj) = Self::parse_block(trimmed)? {
                    objects.push(obj);
                }
            }
        }
        Ok(objects)
    }

    pub fn parse_single(source: &str) -> Result<AlpObject, AlpError> {
        let trimmed = source.trim();
        if trimmed.is_empty() {
            return Err(AlpError::new("Empty source provided to parser"));
        }
        let result = Self::parse_block(trimmed)?;
        result.ok_or_else(|| AlpError::new("Failed to parse ALP block"))
    }

    fn parse_block(block: &str) -> Result<Option<AlpObject>, AlpError> {
        let mut id = None;
        let mut object_type = None;
        for line in block.lines() {
            let trimmed = line.trim();
            if trimmed.starts_with("id:") {
                id = Some(trimmed[3..].trim().to_string());
            } else if trimmed.starts_with("type:") {
                object_type = Some(trimmed[5..].trim().to_string());
            }
        }
        match (id, object_type) {
            (Some(id), Some(object_type)) => Ok(Some(AlpObject::new(id, object_type))),
            _ => Ok(None),
        }
    }
}

#[derive(Debug, Clone)]
pub struct GraphNode {
    pub id: String,
    pub node_type: String,
}

impl GraphNode {
    pub fn new(id: impl Into<String>, node_type: impl Into<String>) -> Self {
        Self {
            id: id.into(),
            node_type: node_type.into(),
        }
    }
}

pub struct AlpGraph {
    nodes: HashMap<String, GraphNode>,
    adjacency: HashMap<String, Vec<String>>,
}

impl AlpGraph {
    pub fn new() -> Self {
        Self {
            nodes: HashMap::new(),
            adjacency: HashMap::new(),
        }
    }

    pub fn build_graph(&mut self, objects: &[AlpObject]) {
        self.nodes.clear();
        self.adjacency.clear();
        for obj in objects {
            self.nodes.insert(
                obj.id.clone(),
                GraphNode::new(obj.id.clone(), obj.object_type.clone()),
            );
        }
        for obj in objects {
            if let Some(serde_json::Value::String(dep_id)) = obj.properties.get("depends_on") {
                self.adjacency
                    .entry(dep_id.clone())
                    .or_default()
                    .push(obj.id.clone());
            }
        }
    }

    pub fn topological_sort(&self) -> Vec<GraphNode> {
        let mut in_degree: HashMap<&str, usize> = HashMap::new();
        for node_id in self.nodes.keys() {
            in_degree.entry(node_id.as_str()).or_insert(0);
        }
        for neighbors in self.adjacency.values() {
            for dep in neighbors {
                *in_degree.entry(dep.as_str()).or_insert(0) += 1;
            }
        }
        let mut queue: Vec<&str> = in_degree
            .iter()
            .filter_map(|(id, degree)| if *degree == 0 { Some(*id) } else { None })
            .collect();
        let mut result = Vec::new();
        while let Some(node_id) = queue.pop() {
            if let Some(node) = self.nodes.get(node_id) {
                result.push(node.clone());
            }
            if let Some(neighbors) = self.adjacency.get(node_id) {
                for neighbor in neighbors {
                    if let Some(degree) = in_degree.get_mut(neighbor.as_str()) {
                        *degree -= 1;
                        if *degree == 0 {
                            queue.push(neighbor);
                        }
                    }
                }
            }
        }
        result
    }

    pub fn detect_cycles(&self) {
        let sorted = self.topological_sort();
        if sorted.len() != self.nodes.len() {
            panic!("Dependency cycle detected in ALP graph");
        }
    }

    pub fn get_node(&self, id: &str) -> Option<&GraphNode> {
        self.nodes.get(id)
    }
}

pub struct AlpWorkspace {
    parser: AlpParser,
    graph: AlpGraph,
    objects: Vec<AlpObject>,
}

impl AlpWorkspace {
    pub fn new() -> Self {
        Self {
            parser: AlpParser,
            graph: AlpGraph::new(),
            objects: Vec::new(),
        }
    }

    pub fn load<P: AsRef<std::path::Path>>(&mut self, workspace_dir: P) -> Result<(), AlpError> {
        let alp_dir = workspace_dir.as_ref().join(".alp");
        if !alp_dir.is_dir() {
            return Ok(());
        }
        self.load_directory(&alp_dir)?;
        self.graph.build_graph(&self.objects);
        Ok(())
    }

    pub fn load_string(&mut self, source: &str) -> Result<(), AlpError> {
        self.objects.extend(self.parser.parse(source)?);
        self.graph.build_graph(&self.objects);
        Ok(())
    }

    pub fn objects(&self) -> &[AlpObject] {
        &self.objects
    }

    pub fn graph(&self) -> &AlpGraph {
        &self.graph
    }

    pub fn execution_order(&self) -> Vec<GraphNode> {
        self.graph.topological_sort()
    }

    pub fn find_by_id(&self, id: &str) -> Option<&AlpObject> {
        self.objects.iter().find(|o| o.id == id)
    }

    fn load_directory(&mut self, dir: &std::path::Path) -> Result<(), AlpError> {
        for entry in std::fs::read_dir(dir)? {
            let entry = entry?;
            let path = entry.path();
            if path.is_dir() {
                self.load_directory(&path)?;
            } else if let Some(ext) = path.extension() {
                if ext == "alp" {
                    let content = std::fs::read_to_string(&path)?;
                    self.objects.extend(self.parser.parse(&content)?);
                }
            }
        }
        Ok(())
    }
}

impl Default for AlpWorkspace {
    fn default() -> Self {
        Self::new()
    }
}

pub mod policy;
pub mod vault;
pub mod event_mesh;
pub mod autonomy;
pub mod autonomy_controller;
pub mod modules;
pub mod identity;
pub mod governance;
pub mod telemetry;
