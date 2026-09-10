"""Tests for sdk/python/alp_sdk/synapse.py"""

import json
from typing import Any, Dict, List, Optional

import pytest
from alp_sdk.synapse import (
    CanvasEdgeData,
    CanvasNodeData,
    SynapseCanvas,
    SynapseEdge,
    SynapseEngine,
    SynapseNode,
    SynapseStats,
    SynapseTopology,
    SynapseVaultFile,
    TYPE_COLORS,
    TYPE_GROUPS,
)


class FakeObj:
    def __init__(self, **kwargs):
        for key, value in kwargs.items():
            setattr(self, key, value)


class TestSynapseTypes:
    def test_synapse_node_defaults(self):
        node = SynapseNode(id="n1", type="task", title="Do work")
        assert node.id == "n1"
        assert node.type == "task"
        assert node.title == "Do work"
        assert node.status is None
        assert node.owner is None
        assert node.tags == []
        assert node.in_links == []
        assert node.out_links == []
        assert node.properties == {}
        assert node.color == TYPE_COLORS["default"]
        assert node.degree == 0
        assert node.group == TYPE_GROUPS["default"]

    def test_synapse_edge_defaults(self):
        edge = SynapseEdge(source="n1", target="n2", label="depends on")
        assert edge.source == "n1"
        assert edge.target == "n2"
        assert edge.label == "depends on"
        assert edge.relation == "references"

    def test_synapse_stats_defaults(self):
        stats = SynapseStats()
        assert stats.total_nodes == 0
        assert stats.total_edges == 0
        assert stats.density == 0.0
        assert stats.central_hubs == []
        assert stats.orphan_nodes == []
        assert stats.broken_links == []
        assert stats.by_type_count == {}
        assert stats.by_status_count == {}

    def test_canvas_node_data_defaults(self):
        node = CanvasNodeData(id="c1", x=0, y=0, width=100, height=50)
        assert node.id == "c1"
        assert node.x == 0
        assert node.y == 0
        assert node.width == 100
        assert node.height == 50
        assert node.type == "text"
        assert node.color is None
        assert node.text is None
        assert node.file is None
        assert node.label is None

    def test_canvas_edge_data_defaults(self):
        edge = CanvasEdgeData(id="e1", from_node="n1", to_node="n2")
        assert edge.id == "e1"
        assert edge.from_node == "n1"
        assert edge.to_node == "n2"
        assert edge.from_side is None
        assert edge.to_side is None
        assert edge.label is None
        assert edge.color is None

    def test_synapse_vault_file(self):
        vf = SynapseVaultFile(relative_path="tasks/t1.md", content="# Hello")
        assert vf.relative_path == "tasks/t1.md"
        assert vf.content == "# Hello"

    @pytest.mark.parametrize(
        "obj_type,expected_color",
        [
            ("agent", TYPE_COLORS["agent"]),
            ("task", TYPE_COLORS["task"]),
            ("policy", TYPE_COLORS["policy"]),
            ("contract", TYPE_COLORS["contract"]),
            ("unknown", TYPE_COLORS["default"]),
        ],
    )
    def test_synapse_node_color_by_type(self, obj_type, expected_color):
        engine = SynapseEngine()
        obj = FakeObj(id="n1", _type=obj_type, title="Test")
        topology = engine.build_topology([obj])
        node = topology.nodes[0]
        assert node.color == expected_color


class TestSynapseEngine:
    def setup_method(self):
        self.engine = SynapseEngine()

    def test_build_topology_basic(self):
        task = FakeObj(id="task1", _type="task", title="Task 1")
        policy = FakeObj(id="policy1", _type="policy", title="Policy 1")
        agent = FakeObj(id="agent1", _type="agent", title="Agent 1")
        task.depends = ["policy1"]
        task.owner = "agent1"

        topology = self.engine.build_topology([task, policy, agent])
        assert len(topology.nodes) == 3
        assert len(topology.edges) == 2

        task_node = topology.nodes[0]
        assert task_node.degree == 2
        assert "policy1" in task_node.out_links
        assert "agent1" in task_node.in_links

    def test_build_topology_policy_guards(self):
        policy = FakeObj(id="policy1", _type="policy", title="Policy 1", guards=["task1"])
        task = FakeObj(id="task1", _type="task", title="Task 1")

        topology = self.engine.build_topology([policy, task])
        assert len(topology.edges) == 1
        assert topology.edges[0].source == "policy1"
        assert topology.edges[0].target == "task1"
        assert topology.edges[0].label == "guards"

    def test_build_topology_contract_edges(self):
        contract = FakeObj(id="contract1", _type="contract", title="Contract 1")
        setattr(contract, "from", "agent1")
        contract.to = "task1"
        agent = FakeObj(id="agent1", _type="agent", title="Agent 1")
        task = FakeObj(id="task1", _type="task", title="Task 1")

        topology = self.engine.build_topology([contract, agent, task])
        assert len(topology.edges) == 2
        edge_labels = {e.label for e in topology.edges}
        assert "contracts" in edge_labels
        assert "governs" in edge_labels

    def test_build_topology_broken_links(self):
        task = FakeObj(id="task1", _type="task", title="Task 1", depends=["nonexistent"])

        topology = self.engine.build_topology([task])
        assert len(topology.edges) == 0
        assert len(topology.stats.broken_links) == 1
        assert topology.stats.broken_links[0]["source"] == "task1"
        assert topology.stats.broken_links[0]["target"] == "nonexistent"

    def test_build_topology_stats(self):
        task1 = FakeObj(id="task1", _type="task", title="Task 1")
        task2 = FakeObj(id="task2", _type="task", title="Task 2")
        task1.depends = ["task2"]
        task2.owner = "agent1"
        agent = FakeObj(id="agent1", _type="agent", title="Agent 1")

        topology = self.engine.build_topology([task1, task2, agent])
        stats = topology.stats
        assert stats.total_nodes == 3
        assert stats.total_edges == 2
        assert stats.density > 0
        assert "task" in stats.by_type_count
        assert stats.by_type_count["task"] == 2
        assert "agent" in stats.by_type_count
        assert stats.by_type_count["agent"] == 1
        assert stats.orphan_nodes == []

    def test_generate_vault(self):
        task = FakeObj(id="task1", _type="task", title="Task 1")
        topology = self.engine.build_topology([task])
        vault_files = self.engine.generate_vault([task])
        paths = [f.relative_path for f in vault_files]
        assert "tasks/task1.md" in paths
        assert "MOC.md" in paths
        assert "synapse.canvas" in paths

    def test_generate_canvas(self):
        task = FakeObj(id="task1", _type="task", title="Task 1")
        policy = FakeObj(id="policy1", _type="policy", title="Policy 1")
        topology = self.engine.build_topology([task, policy])
        canvas = self.engine.generate_canvas(topology)
        assert isinstance(canvas, SynapseCanvas)
        assert len(canvas.nodes) > 0
        assert len(canvas.edges) == 0

    def test_to_mermaid(self):
        task = FakeObj(id="task1", _type="task", title="Task 1")
        policy = FakeObj(id="policy1", _type="policy", title="Policy 1")
        topology = self.engine.build_topology([task, policy])
        mermaid = self.engine.to_mermaid(topology)
        assert "flowchart LR" in mermaid
        assert "task1" in mermaid
        assert "policy1" in mermaid

    def test_to_dot(self):
        task = FakeObj(id="task1", _type="task", title="Task 1")
        policy = FakeObj(id="policy1", _type="policy", title="Policy 1")
        task.depends = ["policy1"]
        topology = self.engine.build_topology([task, policy])
        dot = self.engine.to_dot(topology)
        assert "digraph SynapseGraph" in dot
        assert "task1" in dot
        assert "policy1" in dot
        assert "->" in dot

    def test_duplicate_edges_avoided(self):
        task = FakeObj(id="task1", _type="task", title="Task 1", depends=["policy1", "policy1"])
        policy = FakeObj(id="policy1", _type="policy", title="Policy 1")
        topology = self.engine.build_topology([task, policy])
        assert len(topology.edges) == 1

    def test_vault_markdown_contains_frontmatter(self):
        task = FakeObj(id="task1", _type="task", title="Task 1", status="active")
        topology = self.engine.build_topology([task])
        vault_files = self.engine.generate_vault([task])
        markdown = vault_files[0].content
        assert markdown.startswith("---")
        assert 'id: "task1"' in markdown
        assert 'type: "task"' in markdown
        assert 'status: "active"' in markdown

    def test_canvas_json_is_valid(self):
        task = FakeObj(id="task1", _type="task", title="Task 1")
        topology = self.engine.build_topology([task])
        canvas = self.engine.generate_canvas(topology)
        canvas_json = canvas.to_json()
        parsed = json.loads(canvas_json)
        assert "nodes" in parsed
        assert "edges" in parsed


class TestSynapseCanvasToJson:
    def test_to_json(self):
        canvas = SynapseCanvas(
            nodes=[CanvasNodeData(id="n1", x=0, y=0, width=100, height=50)],
            edges=[CanvasEdgeData(id="e1", from_node="n1", to_node="n2")],
        )
        data = json.loads(canvas.to_json())
        assert data["nodes"][0]["id"] == "n1"
        assert data["edges"][0]["fromNode"] == "n1"
        assert data["edges"][0]["toNode"] == "n2"


class TestSynapseEdgeCases:
    def setup_method(self):
        self.engine = SynapseEngine()

    def test_empty_objects_array(self):
        topology = self.engine.build_topology([])
        assert topology.nodes == []
        assert topology.edges == []
        assert topology.stats.density == 0.0

    def test_single_node_no_edges(self):
        topology = self.engine.build_topology([FakeObj(id="solo", _type="task", title="Solo")])
        assert len(topology.nodes) == 1
        assert len(topology.edges) == 0
        assert topology.stats.orphan_nodes == ["solo"]

    def test_self_referencing_dependency(self):
        task = FakeObj(id="task1", _type="task", title="Task 1", depends=["task1"])
        topology = self.engine.build_topology([task])
        assert len(topology.edges) == 1
        assert topology.edges[0].source == "task1"
        assert topology.edges[0].target == "task1"

    def test_clean_ref_strips_prefixes(self):
        task = FakeObj(id="task1", _type="task", title="Task 1", depends=["@task2", "#task3", "task4"])
        task2 = FakeObj(id="task2", _type="task", title="Task 2")
        task3 = FakeObj(id="task3", _type="task", title="Task 3")
        task4 = FakeObj(id="task4", _type="task", title="Task 4")
        topology = self.engine.build_topology([task, task2, task3, task4])
        assert len(topology.edges) == 3
        targets = {e.target for e in topology.edges}
        assert targets == {"task2", "task3", "task4"}

    def test_duplicate_nodes_ignored(self):
        task1 = FakeObj(id="task1", _type="task", title="Task 1")
        task2 = FakeObj(id="task1", _type="task", title="Task 1 Duplicate")
        topology = self.engine.build_topology([task1, task2])
        assert len(topology.nodes) == 1

    def test_generate_vault_empty(self):
        vault_files = self.engine.generate_vault([])
        assert len(vault_files) == 2
        assert vault_files[0].relative_path == "MOC.md"

    def test_generate_canvas_empty(self):
        topology = self.engine.build_topology([])
        canvas = self.engine.generate_canvas(topology)
        assert len(canvas.nodes) == 0
        assert len(canvas.edges) == 0

    def test_mermaid_single_node(self):
        topology = self.engine.build_topology([FakeObj(id="solo", _type="task", title="Alone")])
        mermaid = self.engine.to_mermaid(topology)
        assert "flowchart LR" in mermaid
        assert "solo" in mermaid

    def test_dot_empty_graph(self):
        topology = self.engine.build_topology([])
        dot = self.engine.to_dot(topology)
        assert "digraph SynapseGraph" in dot

    @pytest.mark.parametrize(
        "dep_list,expected_edges",
        [
            (["policy1"], 1),
            (["policy1", "policy1"], 1),
            (["policy1", "policy2"], 2),
            ([], 0),
        ],
    )
    def test_duplicate_dependencies_deduplicated(self, dep_list, expected_edges):
        task = FakeObj(id="task1", _type="task", title="Task 1", depends=dep_list)
        policy = FakeObj(id="policy1", _type="policy", title="P1")
        policy2 = FakeObj(id="policy2", _type="policy", title="P2")
        objs = [task, policy]
        if "policy2" in dep_list:
            objs.append(policy2)
        topology = self.engine.build_topology(objs)
        assert len(topology.edges) == expected_edges

    def test_broken_link_source_missing(self):
        task = FakeObj(id="task1", _type="task", title="Task 1", depends=["nonexistent"])
        topology = self.engine.build_topology([task])
        assert len(topology.edges) == 0
        assert topology.stats.broken_links[0]["source"] == "task1"
        assert topology.stats.broken_links[0]["target"] == "nonexistent"

    def test_degree_calculation_after_topology(self):
        task = FakeObj(id="task1", _type="task", title="Task 1", depends=["policy1"])
        policy = FakeObj(id="policy1", _type="policy", title="Policy 1")
        topology = self.engine.build_topology([task, policy])
        task_node = next(n for n in topology.nodes if n.id == "task1")
        policy_node = next(n for n in topology.nodes if n.id == "policy1")
        assert task_node.degree == 1
        assert policy_node.degree == 1

    def test_vault_markdown_frontmatter_with_all_fields(self):
        task = FakeObj(id="task1", _type="task", title="Task 1", status="active", owner="agent1", priority="high")
        topology = self.engine.build_topology([task])
        vault_files = self.engine.generate_vault([task])
        markdown = vault_files[0].content
        assert markdown.startswith("---")
        assert 'id: "task1"' in markdown
        assert 'type: "task"' in markdown
        assert 'status: "active"' in markdown
        assert 'owner: "agent1"' in markdown
        assert "priority" in markdown

    def test_moc_contains_orphan_nodes_section(self):
        task = FakeObj(id="task1", _type="task", title="Task 1")
        topology = self.engine.build_topology([task])
        moc = self.engine._render_moc(topology)
        assert "Orphan Nodes" in moc
        assert "task1" in moc

    def test_moc_contains_broken_links_section(self):
        task = FakeObj(id="task1", _type="task", title="Task 1", depends=["missing"])
        topology = self.engine.build_topology([task])
        moc = self.engine._render_moc(topology)
        assert "Broken References" in moc
        assert "missing" in moc

    def test_sanitize_id_replaces_special_chars(self):
        engine = SynapseEngine()
        assert engine._sanitize_id("node-with-dashes") == "node_with_dashes"
        assert engine._sanitize_id("node.with.dots") == "node_with_dots"
        assert engine._sanitize_id("node#id") == "node_id"

    def test_obj_to_dict_excludes_private_attrs(self):
        engine = SynapseEngine()
        obj = FakeObj(id="test", public_attr="value", _private="hidden")
        result = engine._obj_to_dict(obj)
        assert "_private" not in result
        assert "id" in result
        assert "public_attr" in result
