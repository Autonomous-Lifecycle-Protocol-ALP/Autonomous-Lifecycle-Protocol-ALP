use alp_sdk::{AlpError, AlpGraph, AlpObject, AlpParser, AlpWorkspace};
use std::collections::HashMap;

#[test]
fn parse_single_sets_id_and_type() {
    let parser = AlpParser;
    let obj = parser.parse_single("id: t1\ntype: task\n").unwrap();
    assert_eq!(obj.id, "t1");
    assert_eq!(obj.object_type, "task");
}

#[test]
fn parse_returns_multiple_objects() {
    let parser = AlpParser;
    let source = "id: t1\ntype: task\n\nid: t2\ntype: feature\n";
    let objects = parser.parse(source).unwrap();
    assert_eq!(objects.len(), 2);
    assert_eq!(objects[0].id, "t1");
    assert_eq!(objects[1].id, "t2");
}

#[test]
fn parse_single_rejects_empty_source() {
    let parser = AlpParser;
    let result = parser.parse_single("");
    assert!(result.is_err());
}

#[test]
fn workspace_load_string_populates_objects() {
    let mut workspace = AlpWorkspace::new();
    workspace.load_string("id: t1\ntype: task\n").unwrap();
    assert_eq!(workspace.objects().len(), 1);
    assert_eq!(workspace.objects()[0].id, "t1");
}

#[test]
fn workspace_find_by_id_returns_matching_object() {
    let mut workspace = AlpWorkspace::new();
    workspace.load_string("id: t1\ntype: task\n").unwrap();
    assert!(workspace.find_by_id("t1").is_some());
    assert!(workspace.find_by_id("missing").is_none());
}

#[test]
fn graph_topological_sort_orders_by_dependency() {
    let mut graph = AlpGraph::new();
    let t1 = AlpObject::new("t1", "task");
    let mut t2 = AlpObject::new("t2", "task");
    t2.properties.insert("depends_on".into(), "t1".into());
    graph.build_graph(&[t1, t2]);

    let order = graph.topological_sort();
    assert_eq!(order.len(), 2);
    assert_eq!(order[0].id, "t1");
    assert_eq!(order[1].id, "t2");
}

#[test]
#[should_panic(expected = "Dependency cycle detected")]
fn graph_detect_cycles_panics_on_cycle() {
    let mut graph = AlpGraph::new();
    let mut t1 = AlpObject::new("t1", "task");
    let mut t2 = AlpObject::new("t2", "task");
    t1.properties.insert("depends_on".into(), "t2".into());
    t2.properties.insert("depends_on".into(), "t1".into());
    graph.build_graph(&[t1, t2]);
    graph.detect_cycles();
}
