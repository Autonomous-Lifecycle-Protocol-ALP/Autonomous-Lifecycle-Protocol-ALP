#[cfg(test)]
mod tests {
    use crate::{AlpGraph, AlpParser};

    #[test]
    fn parser_parse_single_object() {
        let source = "id: test\n type: workflow";
        let result = AlpParser::parse_single(source).unwrap();
        assert_eq!(result.id, "test");
        assert_eq!(result.object_type, "workflow");
    }

    #[test]
    fn graph_topological_sort_empty() {
        let graph = AlpGraph::new();
        let sorted = graph.topological_sort();
        assert!(sorted.is_empty());
    }
}
