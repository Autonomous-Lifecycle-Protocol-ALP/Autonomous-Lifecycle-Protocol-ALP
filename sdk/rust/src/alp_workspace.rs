use crate::{AlpGraph, AlpObject, AlpParser, GraphNode};
use std::collections::HashMap;
use std::path::{Path, PathBuf};

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

    pub fn load<P: AsRef<Path>>(&mut self, workspace_dir: P) -> Result<(), AlpError> {
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

    fn load_directory(&mut self, dir: &Path) -> Result<(), AlpError> {
        let entries = std::fs::read_dir(dir).map_err(AlpError::from)?;
        for entry in entries {
            let entry = entry.map_err(AlpError::from)?;
            let path = entry.path();
            if path.is_dir() {
                self.load_directory(&path)?;
            } else if let Some(ext) = path.extension() {
                if ext == "alp" {
                    let content = std::fs::read_to_string(&path).map_err(AlpError::from)?;
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
