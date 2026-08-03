"""ALP planning & reasoning (v8.0.0 — The Cognitive Era).

Provides:
- GoalDecomposer: breaks a high-level goal into a task/workflow DAG.
- Planner: scores and ranks candidate plans using historical baselines.
- Reflector: post-run self-critique that emits reusable lessons.
"""
from __future__ import annotations


import re
from typing import Any, Dict, List, Optional


class PlanNode:
    """A single step in a decomposed plan."""

    def __init__(self, node_id: str, kind: str, label: str, depends_on: Optional[List[str]] = None):
        self.node_id = node_id
        self.kind = kind
        self.label = label
        self.depends_on = depends_on or []

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.node_id,
            "kind": self.kind,
            "label": self.label,
            "depends_on": self.depends_on,
        }


class Plan:
    """A decomposed execution plan (DAG of PlanNodes)."""

    def __init__(self, plan_id: str, goal: str, nodes: Optional[List[PlanNode]] = None, metadata: Optional[Dict[str, Any]] = None):
        self.plan_id = plan_id
        self.goal = goal
        self.nodes = nodes or []
        self.metadata = metadata or {}

    def add_node(self, node: PlanNode) -> None:
        self.nodes.append(node)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "plan_id": self.plan_id,
            "goal": self.goal,
            "nodes": [n.to_dict() for n in self.nodes],
            "metadata": self.metadata,
        }


class Lesson:
    """A post-run critique emitted by the Reflector."""

    def __init__(self, lesson_id: str, run_id: str, insight: str, severity: str = "info", tags: Optional[List[str]] = None):
        self.lesson_id = lesson_id
        self.run_id = run_id
        self.insight = insight
        self.severity = severity
        self.tags = tags or []

    def to_dict(self) -> Dict[str, Any]:
        return {
            "lesson_id": self.lesson_id,
            "run_id": self.run_id,
            "insight": self.insight,
            "severity": self.severity,
            "tags": self.tags,
        }


class GoalDecomposer:
    """Break a high-level goal into a DAG of tasks and workflows."""

    def decompose(self, goal: str, constraints: Optional[Dict[str, Any]] = None) -> Plan:
        goal = goal.strip()
        if not goal:
            raise ValueError("Goal must not be empty.")
        plan_id = re.sub(r"[^a-z0-9_-]+", "-", goal.lower())[:40] or "plan"
        steps = self._extract_steps(goal)
        nodes = []
        for i, step in enumerate(steps, 1):
            nodes.append(PlanNode(f"step-{i}", "task", step, depends_on=[f"step-{i-1}"] if i > 1 else []))
        return Plan(plan_id=plan_id, goal=goal, nodes=nodes, metadata={"constraints": constraints or {}})

    def _extract_steps(self, goal: str) -> List[str]:
        verbs = re.findall(r"\b([A-Z][a-z]+)\b", goal)
        if not verbs:
            return [goal]
        return verbs

    def to_workflow(self, plan: Plan) -> Dict[str, Any]:
        return plan.to_dict()


class Planner:
    """Score and rank candidate plans by estimated cost and risk."""

    def __init__(self, estimator: Optional[Any] = None):
        self.estimator = estimator

    def rank(self, plans: List[Plan]) -> List[Dict[str, Any]]:
        scored = []
        for plan in plans:
            score = self._score(plan)
            scored.append({
                "plan": plan.to_dict(),
                "score": score,
                "rank": 0,
            })
        scored.sort(key=lambda x: x["score"]["composite"], reverse=True)
        for i, entry in enumerate(scored, 1):
            entry["rank"] = i
        return scored

    def _score(self, plan: Plan) -> Dict[str, Any]:
        node_count = len(plan.nodes)
        depth = self._max_depth(plan)
        if self.estimator:
            try:
                pred = self.estimator.estimate(plan.plan_id)
                risk = pred.get("failure_risk") or 0.0
                confidence = pred.get("confidence", "low")
            except Exception:
                risk = 0.5
                confidence = "low"
        else:
            risk = 0.5
            confidence = "low"
        complexity = node_count * 0.1 + depth * 0.2
        composite = max(0.0, 1.0 - risk - complexity * 0.1)
        return {
            "node_count": node_count,
            "depth": depth,
            "risk": risk,
            "confidence": confidence,
            "complexity": round(complexity, 4),
            "composite": round(composite, 4),
        }

    def _max_depth(self, plan: Plan) -> int:
        if not plan.nodes:
            return 0
        depths = {n.node_id: 1 for n in plan.nodes}
        for n in plan.nodes:
            for dep in n.depends_on:
                if dep in depths:
                    depths[n.node_id] = max(depths[n.node_id], depths[dep] + 1)
        return max(depths.values())


class ImprovementProposal:
    def __init__(self, proposal_id: str, lesson_id: str, action: str, detail: str, confidence: float, target_node_id: Optional[str] = None):
        self.proposal_id = proposal_id
        self.lesson_id = lesson_id
        self.target_node_id = target_node_id
        self.action = action
        self.detail = detail
        self.confidence = confidence

    def to_dict(self) -> Dict[str, Any]:
        return {
            "proposal_id": self.proposal_id,
            "lesson_id": self.lesson_id,
            "target_node_id": self.target_node_id,
            "action": self.action,
            "detail": self.detail,
            "confidence": self.confidence,
        }


class Reflector:
    """Post-run self-critique that emits reusable lessons."""

    def __init__(self, events: Optional[List[Dict[str, Any]]] = None):
        self.events = events or []

    def reflect(self, run_id: str) -> List[Lesson]:
        lessons = []
        lessons.extend(self._detect_failure_patterns(run_id))
        lessons.extend(self._detect_inefficiencies(run_id))
        lessons.extend(self._detect_handoff_patterns(run_id))
        return lessons

    def _detect_failure_patterns(self, run_id: str) -> List[Lesson]:
        lessons = []
        failures = [e for e in self.events if e.get("type") == "task_status" and e.get("status") == "[!]" and e.get("task_id")]
        if not failures:
            return lessons
        tasks = {}
        for e in failures:
            tid = e.get("task_id")
            tasks[tid] = tasks.get(tid, 0) + 1
        for tid, count in tasks.items():
            if count >= 2:
                lessons.append(Lesson(
                    lesson_id=f"lesson-{len(lessons)+1}",
                    run_id=run_id,
                    insight=f"Task '{tid}' failed {count} times; consider retry or fallback strategy.",
                    severity="warn",
                    tags=["failure", tid],
                ))
        return lessons

    def _detect_inefficiencies(self, run_id: str) -> List[Lesson]:
        lessons = []
        cycle_times: Dict[str, List[int]] = {}
        for e in self.events:
            if e.get("type") == "task_claim":
                tid = e.get("task_id")
                if tid:
                    cycle_times.setdefault(tid, []).append(e.get("timestamp"))
        for tid, stamps in cycle_times.items():
            if len(stamps) >= 3:
                lessons.append(Lesson(
                    lesson_id=f"lesson-{len(lessons)+1}",
                    run_id=run_id,
                    insight=f"Task '{tid}' was claimed {len(stamps)} times; review ownership logic.",
                    severity="info",
                    tags=["efficiency", tid],
                ))
        return lessons

    def _detect_handoff_patterns(self, run_id: str) -> List[Lesson]:
        lessons = []
        handoffs = [e for e in self.events if e.get("type") == "human_handoff" or e.get("status") == "[?]"]
        if len(handoffs) > 1:
            lessons.append(Lesson(
                lesson_id=f"lesson-{len(lessons)+1}",
                run_id=run_id,
                insight=f"Run had {len(handoffs)} human handoffs; consider automating or simplifying decision gates.",
                severity="warn",
                tags=["handoff"],
            ))
        return lessons

    def improve_plan(self, plan: Plan, lessons: List[Lesson]) -> Dict[str, Any]:
        proposals: List[ImprovementProposal] = []
        nodes = [PlanNode(n.node_id, n.kind, n.label, list(n.depends_on)) for n in plan.nodes]
        seen = set()
        for lesson in lessons:
            if "failure" in lesson.tags and "failed" in lesson.insight:
                target = None
                match = __import__("re").search(r"Task '([^']+)'", lesson.insight)
                if match:
                    target = match.group(1)
                proposals.append(ImprovementProposal(
                    proposal_id=f"prop-{__import__('datetime').datetime.utcnow().strftime('%Y%m%d%H%M%S')}-{__import__('random').random().hex()[2:6]}",
                    lesson_id=lesson.lesson_id,
                    target_node_id=target,
                    action="add_dependency",
                    detail=f"Add fallback or retry dependency for '{target or 'unknown'}' due to repeated failures.",
                    confidence=0.75,
                ))
            if "efficiency" in lesson.tags and "claimed" in lesson.insight:
                target = None
                match = __import__("re").search(r"Task '([^']+)'", lesson.insight)
                if match:
                    target = match.group(1)
                proposals.append(ImprovementProposal(
                    proposal_id=f"prop-{__import__('datetime').datetime.utcnow().strftime('%Y%m%d%H%M%S')}-{__import__('random').random().hex()[2:6]}",
                    lesson_id=lesson.lesson_id,
                    target_node_id=target,
                    action="reassign",
                    detail=f"Reassign '{target or 'unknown'}' to a more stable owner.",
                    confidence=0.6,
                ))
            if "handoff" in lesson.tags:
                proposals.append(ImprovementProposal(
                    proposal_id=f"prop-{__import__('datetime').datetime.utcnow().strftime('%Y%m%d%H%M%S')}-{__import__('random').random().hex()[2:6]}",
                    lesson_id=lesson.lesson_id,
                    action="add_node",
                    detail="Add automation gate to reduce human handoff frequency.",
                    confidence=0.5,
                ))
        for p in proposals:
            if p.action == "add_node" and p.proposal_id not in seen:
                nodes.append(PlanNode(f"node-{p.proposal_id}", "task", p.detail, []))
                seen.add(p.proposal_id)
        improved = Plan(
            plan_id=plan.plan_id,
            goal=plan.goal,
            nodes=nodes,
            metadata={**plan.metadata, "improvements": [p.action for p in proposals]},
        )
        return {"plan": improved, "proposals": proposals}


class ReasoningStep:
    """A single chain-of-thought step across agent boundaries."""

    def __init__(
        self,
        step_id: str,
        agent_id: str,
        thought: str,
        action: str,
        confidence: float,
        dependencies: Optional[List[str]] = None,
        observation: Optional[str] = None,
        timestamp: Optional[str] = None,
    ):
        self.step_id = step_id
        self.agent_id = agent_id
        self.thought = thought
        self.action = action
        self.observation = observation
        self.confidence = confidence
        self.dependencies = dependencies or []
        self.timestamp = timestamp or __import__("datetime").datetime.utcnow().isoformat() + "Z"

    def to_dict(self) -> Dict[str, Any]:
        return {
            "step_id": self.step_id,
            "agent_id": self.agent_id,
            "thought": self.thought,
            "action": self.action,
            "observation": self.observation,
            "confidence": self.confidence,
            "dependencies": self.dependencies,
            "timestamp": self.timestamp,
        }


class ReasoningChain:
    """Executable chain-of-thought trace with lifecycle state."""

    def __init__(self, chain_id: str, goal: str):
        self.chain_id = chain_id
        self.goal = goal
        self.steps: List[ReasoningStep] = []
        self.created_at = __import__("datetime").datetime.utcnow().isoformat() + "Z"
        self.status: str = "draft"
        self.result: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        return {
            "chain_id": self.chain_id,
            "goal": self.goal,
            "steps": [s.to_dict() for s in self.steps],
            "created_at": self.created_at,
            "status": self.status,
            "result": self.result,
        }


class ReasoningTracer:
    """Creates and mutates ReasoningChain instances."""

    def __init__(self):
        self._chains: Dict[str, ReasoningChain] = {}
        self._step_counter = 0

    def create_chain(self, goal: str) -> ReasoningChain:
        chain_id = f"chain-{__import__('datetime').datetime.utcnow().strftime('%Y%m%d%H%M%S')}-{self._step_counter:04d}"
        chain = ReasoningChain(chain_id=chain_id, goal=goal)
        self._chains[chain_id] = chain
        return chain

    def add_step(self, chain_id: str, step: Dict[str, Any]) -> ReasoningStep:
        chain = self._chains.get(chain_id)
        if not chain:
            raise ValueError(f"Reasoning chain '{chain_id}' not found.")
        if chain.status != "executing":
            chain.status = "executing"
        self._step_counter += 1
        created = ReasoningStep(
            step_id=f"step-{chain_id}-{self._step_counter}",
            agent_id=step["agent_id"],
            thought=step["thought"],
            action=step["action"],
            confidence=float(step.get("confidence", 0.0)),
            dependencies=list(step.get("dependencies", [])),
            observation=step.get("observation"),
        )
        chain.steps.append(created)
        return created

    def complete_chain(self, chain_id: str, result: str) -> ReasoningChain:
        chain = self._chains.get(chain_id)
        if not chain:
            raise ValueError(f"Reasoning chain '{chain_id}' not found.")
        chain.status = "completed"
        chain.result = result
        return chain

    def fail_chain(self, chain_id: str, reason: str) -> ReasoningChain:
        chain = self._chains.get(chain_id)
        if not chain:
            raise ValueError(f"Reasoning chain '{chain_id}' not found.")
        chain.status = "failed"
        chain.result = reason
        return chain

    def get_chain(self, chain_id: str) -> Optional[ReasoningChain]:
        return self._chains.get(chain_id)

    def get_steps_by_agent(self, agent_id: str) -> List[ReasoningStep]:
        steps = []
        for chain in self._chains.values():
            for step in chain.steps:
                if step.agent_id == agent_id:
                    steps.append(step)
        return steps


class AgentContribution:
    def __init__(self, agent_id: str, nodes: List[Dict[str, Any]], resources: Optional[Dict[str, Any]] = None, rationale: str = ""):
        self.agent_id = agent_id
        self.nodes = [PlanNode(**n) if isinstance(n, dict) else n for n in nodes]
        self.resources = resources or {}
        self.rationale = rationale

    def to_dict(self) -> Dict[str, Any]:
        return {
            "agent_id": self.agent_id,
            "nodes": [n.to_dict() for n in self.nodes],
            "resources": self.resources,
            "rationale": self.rationale,
        }


class CollabPlanResult:
    def __init__(self, plan: Plan, contributions: List[AgentContribution], allocation: Dict[str, str], conflicts: List[str]):
        self.plan = plan
        self.contributions = contributions
        self.allocation = allocation
        self.conflicts = conflicts

    def to_dict(self) -> Dict[str, Any]:
        return {
            "plan": self.plan.to_dict(),
            "contributions": [c.to_dict() for c in self.contributions],
            "allocation": self.allocation,
            "conflicts": self.conflicts,
        }


class CollabPlanner:
    def __init__(self, tracer: Optional[ReasoningTracer] = None):
        self.tracer = tracer

    def build(self, goal: str, contributions: List[AgentContribution]) -> CollabPlanResult:
        if not contributions:
            raise ValueError("At least one agent contribution is required for collaborative planning.")
        nodes: List[PlanNode] = []
        allocation: Dict[str, str] = {}
        conflicts: List[str] = []
        seen = set()
        by_agent: Dict[str, List[PlanNode]] = {}
        for c in contributions:
            if not c.agent_id:
                continue
            by_agent.setdefault(c.agent_id, [])
            for node in c.nodes:
                key = node.node_id or node.label
                if key in seen:
                    conflicts.append(f"Duplicate node '{key}' from {c.agent_id}")
                    continue
                seen.add(key)
                nodes.append(node)
                allocation[node.node_id] = c.agent_id
                by_agent[c.agent_id].append(node)
        plan = Plan(
            plan_id=f"collab-{__import__('re').sub(r'[^a-z0-9_-]+', '-', goal.lower())[:30] or 'plan'}",
            goal=goal,
            nodes=nodes,
            metadata={"contributions": [{"agent_id": c.agent_id, "node_count": len(c.nodes)} for c in contributions]},
        )
        if self.tracer:
            chain = self.tracer.create_chain(goal)
            self.tracer.add_step(chain.chain_id, {
                "agent_id": "collab-planner",
                "thought": f"Synthesized {len(nodes)} nodes from {len(contributions)} contributions",
                "action": "collab-plan",
                "observation": f"Conflicts: {len(conflicts)}; allocation entries: {len(allocation)}",
                "confidence": 0.6 if conflicts else 0.95,
                "dependencies": [],
            })
        return CollabPlanResult(plan=plan, contributions=contributions, allocation=allocation, conflicts=conflicts)
