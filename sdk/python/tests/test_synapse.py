"""Tests for sdk/python/alp_sdk/synapse.py"""

import json
import pytest
from alp_sdk.synapse import (
    SynapseNode,
    SynapseEdge,
    SynapseTopology,
    SynapseStats,
    CanvasNodeData,
    CanvasEdgeData,
    SynapseCanvas,
    SynapseVaultFile,
    SynapseEngine,
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
