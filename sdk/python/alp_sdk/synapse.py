"""Synapse Knowledge Graph & Canvas Vault Engine — v82.0.0."""

from __future__ import annotations

from typing import Any, Dict, List, Optional


# ── Types ──────────────────────────────────────────────────────────────

class SynapseNode:
    def __init__(
        self,
        id: str,
        type: str,
        title: str,
        status: Optional[str] = None,
        owner: Optional[str] = None,
        tags: Optional[List[str]] = None,
        in_links: Optional[List[str]] = None,
        out_links: Optional[List[str]] = None,
        properties: Optional[Dict[str, Any]] = None,
        color: str = "#64748b",
        degree: int = 0,
        group: int = 0,
    ) -> None:
        self.id = id
        self.type = type
        self.title = title
        self.status = status
        self.owner = owner
        self.tags = tags or []
        self.in_links = in_links or []
        self.out_links = out_links or []
        self.properties = properties or {}
        self.color = color
        self.degree = degree
        self.group = group


class SynapseEdge:
    def __init__(
        self,
        source: str,
        target: str,
        label: str,
        relation: str = "references",
    ) -> None:
        self.source = source
        self.target = target
        self.label = label
        self.relation = relation


class SynapseTopology:
    def __init__(
        self,
        nodes: List[SynapseNode],
        edges: List[SynapseEdge],
        stats: "SynapseStats",
    ) -> None:
        self.nodes = nodes
        self.edges = edges
        self.stats = stats


class SynapseStats:
    def __init__(
        self,
        total_nodes: int = 0,
        total_edges: int = 0,
        density: float = 0.0,
        central_hubs: Optional[List[Dict[str, Any]]] = None,
        orphan_nodes: Optional[List[str]] = None,
        broken_links: Optional[List[Dict[str, str]]] = None,
        by_type_count: Optional[Dict[str, int]] = None,
        by_status_count: Optional[Dict[str, int]] = None,
    ) -> None:
        self.total_nodes = total_nodes
        self.total_edges = total_edges
        self.density = density
        self.central_hubs = central_hubs or []
        self.orphan_nodes = orphan_nodes or []
        self.broken_links = broken_links or []
        self.by_type_count = by_type_count or {}
        self.by_status_count = by_status_count or {}


class CanvasNodeData:
    def __init__(
        self,
        id: str,
        x: int,
        y: int,
        width: int,
        height: int,
        type: str = "text",
        color: Optional[str] = None,
        text: Optional[str] = None,
        file: Optional[str] = None,
        label: Optional[str] = None,
    ) -> None:
        self.id = id
        self.x = x
        self.y = y
        self.width = width
        self.height = height
        self.type = type
        self.color = color
        self.text = text
        self.file = file
        self.label = label


class CanvasEdgeData:
    def __init__(
        self,
        id: str,
        from_node: str,
        to_node: str,
        from_side: Optional[str] = None,
        to_side: Optional[str] = None,
        label: Optional[str] = None,
        color: Optional[str] = None,
    ) -> None:
        self.id = id
        self.from_node = from_node
        self.to_node = to_node
        self.from_side = from_side
        self.to_side = to_side
        self.label = label
        self.color = color


class SynapseCanvas:
    def __init__(
        self,
        nodes: List[CanvasNodeData],
        edges: List[CanvasEdgeData],
    ) -> None:
        self.nodes = nodes
        self.edges = edges

    def to_json(self) -> str:
        return json.dumps(
            {
                "nodes": [
                    {
                        "id": n.id,
                        "x": n.x,
                        "y": n.y,
                        "width": n.width,
                        "height": n.height,
                        "type": n.type,
                        **({"color": n.color} if n.color else {}),
                        **({"text": n.text} if n.text else {}),
                        **({"file": n.file} if n.file else {}),
                        **({"label": n.label} if n.label else {}),
                    }
                    for n in self.nodes
                ],
                "edges": [
                    {
                        "id": e.id,
                        "fromNode": e.from_node,
                        "toNode": e.to_node,
                        **({"fromSide": e.from_side} if e.from_side else {}),
                        **({"toSide": e.to_side} if e.to_side else {}),
                        **({"label": e.label} if e.label else {}),
                        **({"color": e.color} if e.color else {}),
                    }
                    for e in self.edges
                ],
            },
            indent=2,
        )


class SynapseVaultFile:
    def __init__(self, relative_path: str, content: str) -> None:
        self.relative_path = relative_path
        self.content = content


# ── Constants ──────────────────────────────────────────────────────────

TYPE_COLORS: Dict[str, str] = {
    "agent": "#8b5cf6",
    "task": "#3b82f6",
    "policy": "#ef4444",
    "contract": "#10b981",
    "workflow": "#f59e0b",
    "vault": "#06b6d4",
    "swarm": "#ec4899",
    "timeline": "#6366f1",
    "tenant_mesh": "#14b8a6",
    "default": "#64748b",
}

TYPE_GROUPS: Dict[str, int] = {
    "agent": 1,
    "task": 2,
    "policy": 3,
    "contract": 4,
    "workflow": 5,
    "vault": 6,
    "swarm": 7,
    "timeline": 8,
    "tenant_mesh": 9,
    "default": 0,
}


# ── Engine ──────────────────────────────────────────────────────────────

class SynapseEngine:
    """Transform ALP workspace objects into an interconnected knowledge graph."""

    def __init__(self) -> None:
        pass

    def build_topology(self, objects: List[Any]) -> SynapseTopology:
        node_map: Dict[str, SynapseNode] = {}
        edges: List[SynapseEdge] = []
        known_ids = {getattr(o, "id", None) for o in objects if hasattr(o, "id")}
        broken_links: List[Dict[str, str]] = []

        for obj in objects:
            obj_type = getattr(obj, "_type", "object")
            color = TYPE_COLORS.get(obj_type, TYPE_COLORS["default"])
            group = TYPE_GROUPS.get(obj_type, 0)

            tags = [obj_type]
            status = getattr(obj, "status", None)
            if status is not None:
                tags.append(str(status))
            priority = getattr(obj, "priority", None)
            if priority is not None:
                tags.append(str(priority))

            title = getattr(obj, "title", getattr(obj, "id", "unknown"))
            owner = getattr(obj, "owner", None) or getattr(obj, "agent", None)

            node_map[obj.id] = SynapseNode(
                id=obj.id,
                type=obj_type,
                title=title,
                status=str(status) if status is not None else None,
                owner=str(owner) if owner is not None else None,
                tags=tags,
                color=color,
                group=group,
                properties=self._obj_to_dict(obj),
            )

        def clean_ref(raw: Any) -> str:
            if not isinstance(raw, str):
                return ""
            return raw.strip().lstrip("->@# ").strip()

        def add_edge(
            from_id: str,
            to_id: str,
            label: str,
            relation: str = "references",
        ) -> None:
            from_node = node_map.get(from_id)
            to_node = node_map.get(to_id)
            if not from_node or not to_node:
                broken_links.append({"source": from_id, "target": to_id})
                return
            if not any(
                e.source == from_id and e.target == to_id and e.relation == relation
                for e in edges
            ):
                edges.append(SynapseEdge(from_id, to_id, label, relation))
                if to_id not in from_node.out_links:
                    from_node.out_links.append(to_id)
                if from_id not in to_node.in_links:
                    to_node.in_links.append(from_id)

        for obj in objects:
            source_id = obj.id

            deps = getattr(obj, "depends", None) or getattr(obj, "deps", None) or getattr(obj, "depends_on", None) or []
            dep_list = deps if isinstance(deps, list) else [deps]
            for raw_target in dep_list:
                clean_target = clean_ref(raw_target)
                if clean_target:
                    add_edge(source_id, clean_target, "depends on", "depends_on")

            owner = getattr(obj, "owner", None) or getattr(obj, "agent", None)
            if owner:
                clean_owner = clean_ref(owner)
                if clean_owner:
                    add_edge(clean_owner, source_id, "executes", "assigned_to")

            if obj._type == "policy":
                guards = getattr(obj, "guards", None) or getattr(obj, "targets", None) or []
                guard_list = guards if isinstance(guards, list) else [guards]
                for raw_target in guard_list:
                    clean_target = clean_ref(raw_target)
                    if clean_target:
                        add_edge(source_id, clean_target, "guards", "guards")
            else:
                policies = getattr(obj, "policy", None) or getattr(obj, "policies", None) or []
                pol_list = policies if isinstance(policies, list) else [policies]
                for raw_pol in pol_list:
                    clean_pol = clean_ref(raw_pol)
                    if clean_pol:
                        add_edge(clean_pol, source_id, "guards", "guards")

            if obj._type == "contract":
                from_ref = clean_ref(getattr(obj, "from", None))
                to_ref = clean_ref(getattr(obj, "to", None))
                if from_ref and to_ref:
                    add_edge(from_ref, to_ref, "contracts", "references")
                if to_ref:
                    add_edge(source_id, to_ref, "governs", "implements")
            else:
                contracts = getattr(obj, "contract", None) or getattr(obj, "contracts", None) or []
                con_list = contracts if isinstance(contracts, list) else [contracts]
                for raw_con in con_list:
                    clean_con = clean_ref(raw_con)
                    if clean_con:
                        add_edge(clean_con, source_id, "governs", "implements")

            if obj._type == "vault":
                recipients = getattr(obj, "recipients", None) or []
                rec_list = recipients if isinstance(recipients, list) else [recipients]
                for raw_rec in rec_list:
                    clean_rec = clean_ref(raw_rec)
                    if clean_rec:
                        add_edge(source_id, clean_rec, "secures", "references")
            else:
                vaults = getattr(obj, "vault", None) or getattr(obj, "vaults", None) or []
                v_list = vaults if isinstance(vaults, list) else [vaults]
                for raw_v in v_list:
                    clean_v = clean_ref(raw_v)
                    if clean_v:
                        add_edge(clean_v, source_id, "secures", "references")

            feature = clean_ref(getattr(obj, "feature", None))
            if feature:
                add_edge(source_id, feature, "part of", "references")

            steps = getattr(obj, "steps", None) or []
            step_list = steps if isinstance(steps, list) else [steps]
            for raw_step in step_list:
                clean_step = clean_ref(raw_step)
                if clean_step:
                    add_edge(source_id, clean_step, "executes step", "references")

        nodes = list(node_map.values())
        for node in nodes:
            node.degree = len(node.in_links) + len(node.out_links)

        stats = self._compute_stats(nodes, edges, broken_links)
        return SynapseTopology(nodes, edges, stats)

    def generate_vault(self, objects: List[Any]) -> List[SynapseVaultFile]:
        topology = self.build_topology(objects)
        files: List[SynapseVaultFile] = []

        for node in topology.nodes:
            markdown = self._render_markdown_note(node, topology)
            files.append(SynapseVaultFile(f"{node.type}s/{node.id}.md", markdown))

        files.append(SynapseVaultFile("MOC.md", self._render_moc(topology)))
        files.append(SynapseVaultFile("synapse.canvas", self.generate_canvas(topology).to_json()))
        return files

    def generate_canvas(self, topology: SynapseTopology) -> SynapseCanvas:
        canvas_nodes: List[CanvasNodeData] = []
        canvas_edges: List[CanvasEdgeData] = []

        nodes_by_type: Dict[str, List[SynapseNode]] = {}
        for node in topology.nodes:
            nodes_by_type.setdefault(node.type, []).append(node)

        COL_WIDTH = 340
        ROW_HEIGHT = 160
        X_GAP = 120
        Y_GAP = 60

        col_index = 0
        for type_name, group_nodes in nodes_by_type.items():
            col_x = col_index * (COL_WIDTH + X_GAP)
            group_height = max(len(group_nodes) * (ROW_HEIGHT + Y_GAP) + 80, 240)
            canvas_nodes.append(
                CanvasNodeData(
                    id=f"group-{type_name}",
                    x=col_x - 20,
                    y=-60,
                    width=COL_WIDTH + 40,
                    height=group_height,
                    type="group",
                    label=f"{type_name.upper()} ({len(group_nodes)})",
                    color=TYPE_COLORS.get(type_name, TYPE_COLORS["default"]),
                )
            )

            for row_index, node in enumerate(group_nodes):
                node_y = row_index * (ROW_HEIGHT + Y_GAP)
                status_badge = f" [{node.status}]" if node.status else ""
                owner_line = f"\n👤 [[{node.owner}]]" if node.owner else ""
                deps_line = (
                    f"\n🔗 {', '.join([f'[[{d}]]' for d in node.out_links])}"
                    if node.out_links
                    else ""
                )
                canvas_nodes.append(
                    CanvasNodeData(
                        id=node.id,
                        x=col_x,
                        y=node_y,
                        width=COL_WIDTH,
                        height=ROW_HEIGHT,
                        type="text",
                        text=f"### {node.id}{status_badge}{owner_line}{deps_line}",
                        color=node.color,
                    )
                )

            col_index += 1

        edge_counter = 0
        for edge in topology.edges:
            canvas_edges.append(
                CanvasEdgeData(
                    id=f"edge-{edge_counter}",
                    from_node=edge.source,
                    to_node=edge.target,
                    from_side="right",
                    to_side="left",
                    label=edge.label,
                )
            )
            edge_counter += 1

        return SynapseCanvas(canvas_nodes, canvas_edges)

    def to_mermaid(self, topology: SynapseTopology) -> str:
        lines = ["flowchart LR"]
        by_type: Dict[str, List[SynapseNode]] = {}
        for node in topology.nodes:
            by_type.setdefault(node.type, []).append(node)

        for type_name, node_list in by_type.items():
            lines.append(f'  subgraph {type_name.upper()}["{type_name.upper()}"]')
            for node in node_list:
                label = f"{node.id} ({node.status})" if node.status else node.id
                lines.append(f'    {self._sanitize_id(node.id)}["{label}"]')
            lines.append("  end")

        for edge in topology.edges:
            s = self._sanitize_id(edge.source)
            t = self._sanitize_id(edge.target)
            lines.append(f'  {s} -->|{edge.label}| {t}')

        return "\n".join(lines)

    def to_dot(self, topology: SynapseTopology) -> str:
        lines = [
            "digraph SynapseGraph {",
            "  rankdir=LR;",
            '  node [shape=box, style="rounded,filled", fontname="Helvetica"];',
        ]
        for node in topology.nodes:
            fill = node.color or "#e2e8f0"
            lines.append(f'  "{node.id}" [label="{node.id}\\n({node.type})", fillcolor="{fill}"];')
        for edge in topology.edges:
            lines.append(f'  "{edge.source}" -> "{edge.target}" [label="{edge.label}"];')
        lines.append("}")
        return "\n".join(lines)

    # ── Private ───────────────────────────────────────────────────────────

    def _render_markdown_note(self, node: SynapseNode, topology: SynapseTopology) -> str:
        frontmatter_lines = [
            "---",
            f'id: "{node.id}"',
            f'type: "{node.type}"',
        ]
        if node.status:
            frontmatter_lines.append(f'status: "{node.status}"')
        if node.owner:
            frontmatter_lines.append(f'owner: "{node.owner}"')
        tag_str = ", ".join([f'"{t}"' for t in node.tags])
        frontmatter_lines.extend(
            [
                f"tags: [{tag_str}]",
                f"degree: {node.degree}",
                "---",
            ]
        )
        frontmatter = "\n".join(frontmatter_lines)

        sections = [
            frontmatter,
            "",
            f"# @{node.type} `{node.id}`",
            "",
        ]
        if node.status:
            sections.append(f"**Status**: `{node.status}`  ")
        if node.owner:
            sections.append(f"**Owner**: [[{node.owner}]]  ")
        if node.tags:
            sections.append(f"**Tags**: {' '.join([f'#{t}' for t in node.tags])}  ")
        sections.append("")

        if node.out_links:
            sections.append("## Outgoing Links (Dependencies / Calls)")
            for target in node.out_links:
                target_node = next((n for n in topology.nodes if n.id == target), None)
                type_note = f" *(@{target_node.type})*" if target_node else ""
                sections.append(f"- [[{target}]]{type_note}")
            sections.append("")

        if node.in_links:
            sections.append("## Backlinks (Referenced By)")
            for src in node.in_links:
                src_node = next((n for n in topology.nodes if n.id == src), None)
                type_note = f" *(@{src_node.type})*" if src_node else ""
                sections.append(f"- [[{src}]]{type_note}")
            sections.append("")

        local_edges = [e for e in topology.edges if e.source == node.id or e.target == node.id]
        if local_edges:
            sections.append("## Local Topology")
            sections.append("```mermaid")
            sections.append("flowchart LR")
            for e in local_edges:
                s = self._sanitize_id(e.source)
                t = self._sanitize_id(e.target)
                s_label = f':::focus["{e.source}"]' if e.source == node.id else f'["{e.source}"]'
                t_label = f':::focus["{e.target}"]' if e.target == node.id else f'["{e.target}"]'
                sections.append(f"  {s}{s_label} -->|{e.label}| {t}{t_label}")
            sections.append("  classDef focus fill:#3b82f6,stroke:#1d4ed8,stroke-width:2px,color:#fff;")
            sections.append("```")
            sections.append("")

        sections.append("## Properties")
        sections.append("| Key | Value |")
        sections.append("| --- | --- |")
        for key, value in node.properties.items():
            if key.startswith("_") or key == "id":
                continue
            val_str = json.dumps(value) if isinstance(value, (dict, list)) else str(value)
            sections.append(f"| `{key}` | `{val_str}` |")

        return "\n".join(sections)

    def _render_moc(self, topology: SynapseTopology) -> str:
        lines = [
            "# 🧠 Synapse Knowledge Graph — Map of Content (MOC)",
            "",
            f"> Total Nodes: **{topology.stats.total_nodes}** | Total Edges: **{topology.stats.total_edges}** | Density: **{(topology.stats.density * 100):.1f}%**",
            "",
            "---",
            "",
            "## 🌟 Central Hub Nodes (High Degree Centrality)",
        ]

        for hub in topology.stats.central_hubs[:5]:
            node = next((n for n in topology.nodes if n.id == hub["id"]), None)
            lines.append(f"- **[[{hub['id']}]]** (@{node.type if node else 'unknown'}): {hub['degree']} connections")

        lines.append("")
        lines.append("## 📑 Entities by Type")

        by_type: Dict[str, List[SynapseNode]] = {}
        for node in topology.nodes:
            by_type.setdefault(node.type, []).append(node)

        for type_name, nodes in by_type.items():
            lines.append(f"### @{type_name} ({len(nodes)})")
            for node in nodes:
                status = f" `[{node.status}]`" if node.status else ""
                owner = f" *(owner: [[{node.owner}]])*" if node.owner else ""
                lines.append(f"- [[{node.id}]]{status}{owner}")
            lines.append("")

        if topology.stats.orphan_nodes:
            lines.append("## ⚠️ Orphan Nodes (0 Connections)")
            for orphan in topology.stats.orphan_nodes:
                lines.append(f"- [[{orphan}]]")
            lines.append("")

        if topology.stats.broken_links:
            lines.append("## 🚨 Broken References")
            for broken in topology.stats.broken_links:
                lines.append(f"- [[{broken['source']}]] references non-existent `[[{broken['target']}]]`")
            lines.append("")

        return "\n".join(lines)

    def _compute_stats(
        self,
        nodes: List[SynapseNode],
        edges: List[SynapseEdge],
        broken_links: List[Dict[str, str]],
    ) -> SynapseStats:
        total_nodes = len(nodes)
        total_edges = len(edges)
        max_edges = total_nodes * (total_nodes - 1) if total_nodes > 1 else 1
        density = total_edges / max_edges if total_nodes > 1 else 0.0

        central_hubs = sorted(
            [{"id": n.id, "degree": n.degree} for n in nodes],
            key=lambda h: h["degree"],
            reverse=True,
        )

        orphan_nodes = [n.id for n in nodes if n.degree == 0]

        by_type_count: Dict[str, int] = {}
        by_status_count: Dict[str, int] = {}
        for n in nodes:
            by_type_count[n.type] = by_type_count.get(n.type, 0) + 1
            if n.status:
                by_status_count[n.status] = by_status_count.get(n.status, 0) + 1

        return SynapseStats(
            total_nodes=total_nodes,
            total_edges=total_edges,
            density=density,
            central_hubs=central_hubs,
            orphan_nodes=orphan_nodes,
            broken_links=broken_links,
            by_type_count=by_type_count,
            by_status_count=by_status_count,
        )

    def _sanitize_id(self, id: str) -> str:
        import re
        return re.sub(r"[^a-zA-Z0-9_]", "_", id)

    @staticmethod
    def _obj_to_dict(obj: Any) -> Dict[str, Any]:
        result: Dict[str, Any] = {}
        for key in dir(obj):
            if key.startswith("_"):
                continue
            try:
                value = getattr(obj, key)
                if not callable(value):
                    result[key] = value
            except Exception:
                pass
        return result


# ── Helpers ────────────────────────────────────────────────────────────

import json
