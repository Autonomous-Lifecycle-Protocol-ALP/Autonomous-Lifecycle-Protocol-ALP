"""ALP Swarm Intelligence Primitives (v86.0.0)."""
from __future__ import annotations

import random
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional


class SwarmSignal:
    def __init__(self, agent_id: str, swarm_id: str, signal_type: str, timestamp: Optional[str] = None, metadata: Optional[Dict[str, Any]] = None):
        self.agent_id = agent_id
        self.swarm_id = swarm_id
        self.type = signal_type
        self.timestamp = timestamp or datetime.now(timezone.utc).isoformat()
        self.metadata = metadata or {}

    def to_dict(self) -> Dict[str, Any]:
        return {
            "agent_id": self.agent_id,
            "swarm_id": self.swarm_id,
            "type": self.type,
            "timestamp": self.timestamp,
            "metadata": self.metadata,
        }


class EmergentPattern:
    def __init__(self, pattern_id: str, pattern_type: str, severity: str, description: str, affected_agents: List[str], detected_at: str):
        self.pattern_id = pattern_id
        self.pattern_type = pattern_type
        self.severity = severity
        self.description = description
        self.affected_agents = affected_agents
        self.detected_at = detected_at

    def to_dict(self) -> Dict[str, Any]:
        return {
            "pattern_id": self.pattern_id,
            "pattern_type": self.pattern_type,
            "severity": self.severity,
            "description": self.description,
            "affected_agents": self.affected_agents,
            "detected_at": self.detected_at,
        }


class AgentSpecialization:
    def __init__(self, agent_id: str, role: str, confidence: float, task_count: int, success_rate: float, last_updated: str):
        self.agent_id = agent_id
        self.role = role
        self.confidence = confidence
        self.task_count = task_count
        self.success_rate = success_rate
        self.last_updated = last_updated

    def to_dict(self) -> Dict[str, Any]:
        return {
            "agent_id": self.agent_id,
            "role": self.role,
            "confidence": self.confidence,
            "task_count": self.task_count,
            "success_rate": self.success_rate,
            "last_updated": self.last_updated,
        }


class EmergentBehaviorDetector:
    def __init__(self):
        self.signals: List[SwarmSignal] = []

    def ingest(self, signal: SwarmSignal) -> None:
        self.signals.append(signal)

    def detect(self) -> List[EmergentPattern]:
        patterns: List[EmergentPattern] = []
        agent_failures: Dict[str, int] = {}
        agent_claims: Dict[str, int] = {}
        all_agents = set()

        for s in self.signals:
            all_agents.add(s.agent_id)
            if s.type == "task_fail":
                agent_failures[s.agent_id] = agent_failures.get(s.agent_id, 0) + 1
            if s.type == "claim":
                agent_claims[s.agent_id] = agent_claims.get(s.agent_id, 0) + 1

        for agent, count in agent_failures.items():
            if count >= 3:
                patterns.append(EmergentPattern(
                    pattern_id=f"pattern-{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}-{random.random().hex()[2:6]}",
                    pattern_type="repeated_failure",
                    severity="high" if count >= 5 else "medium",
                    description=f"Agent '{agent}' has failed {count} tasks; investigate root cause.",
                    affected_agents=[agent],
                    detected_at=datetime.now(timezone.utc).isoformat(),
                ))

        all_claim_values = [agent_claims.get(a, 0) for a in all_agents]
        if len(all_claim_values) >= 2:
            max_claims = max(all_claim_values)
            min_claims = min(all_claim_values)
            if max_claims > 0 and min_claims == 0:
                idle_agents = [a for a in all_agents if agent_claims.get(a, 0) == 0]
                patterns.append(EmergentPattern(
                    pattern_id=f"pattern-{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}-{random.random().hex()[2:6]}",
                    pattern_type="load_imbalance",
                    severity="medium",
                    description=f"Load imbalance detected: {len(idle_agents)} agents have no claims while max claims is {max_claims}.",
                    affected_agents=idle_agents,
                    detected_at=datetime.now(timezone.utc).isoformat(),
                ))

        return patterns

    def reset(self) -> None:
        self.signals = []


class RoleSpecializer:
    def __init__(self):
        self.specializations: Dict[str, AgentSpecialization] = {}

    def record(self, agent_id: str, role: str, success: bool) -> None:
        existing = self.specializations.get(agent_id)
        if existing:
            existing.task_count += 1
            existing.success_rate = existing.success_rate * 0.8 + (1.0 if success else 0.0) * 0.2
            existing.last_updated = datetime.now(timezone.utc).isoformat()
            if existing.success_rate > 0.8:
                existing.role = role
                existing.confidence = min(1.0, existing.confidence + 0.1)
        else:
            self.specializations[agent_id] = AgentSpecialization(
                agent_id=agent_id,
                role=role,
                confidence=0.7 if success else 0.3,
                task_count=1,
                success_rate=1.0 if success else 0.0,
                last_updated=datetime.now(timezone.utc).isoformat(),
            )

    def get_specialization(self, agent_id: str) -> Optional[AgentSpecialization]:
        return self.specializations.get(agent_id)

    def get_all(self) -> List[AgentSpecialization]:
        return sorted(self.specializations.values(), key=lambda s: s.confidence, reverse=True)


class CollectiveVote:
    def __init__(self, vote_id: str, proposal_id: str, voter_id: str, approved: bool, rationale: Optional[str], timestamp: str):
        self.vote_id = vote_id
        self.proposal_id = proposal_id
        self.voter_id = voter_id
        self.approved = approved
        self.rationale = rationale
        self.timestamp = timestamp

    def to_dict(self) -> Dict[str, Any]:
        return {
            "vote_id": self.vote_id,
            "proposal_id": self.proposal_id,
            "voter_id": self.voter_id,
            "approved": self.approved,
            "rationale": self.rationale,
            "timestamp": self.timestamp,
        }


class CollectiveDecision:
    def __init__(self, decision_id: str, proposal_id: str, quorum: int, votes: List[CollectiveVote], decided_at: str, passed: bool):
        self.decision_id = decision_id
        self.proposal_id = proposal_id
        self.quorum = quorum
        self.votes = votes
        self.decided_at = decided_at
        self.passed = passed

    def to_dict(self) -> Dict[str, Any]:
        return {
            "decision_id": self.decision_id,
            "proposal_id": self.proposal_id,
            "quorum": self.quorum,
            "votes": [v.to_dict() for v in self.votes],
            "decided_at": self.decided_at,
            "passed": self.passed,
        }


class CollectiveDecisionMaker:
    def __init__(self):
        self.votes: List[CollectiveVote] = []

    def cast_vote(self, proposal_id: str, voter_id: str, approved: bool, rationale: Optional[str] = None) -> CollectiveVote:
        vote = CollectiveVote(
            vote_id=f"vote-{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}-{random.random().hex()[2:6]}",
            proposal_id=proposal_id,
            voter_id=voter_id,
            approved=approved,
            rationale=rationale,
            timestamp=datetime.now(timezone.utc).isoformat(),
        )
        self.votes.append(vote)
        return vote

    def decide(self, proposal_id: str, quorum: int) -> CollectiveDecision:
        proposal_votes = [v for v in self.votes if v.proposal_id == proposal_id]
        approved = sum(1 for v in proposal_votes if v.approved)
        passed = approved >= quorum
        return CollectiveDecision(
            decision_id=f"decision-{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}-{random.random().hex()[2:6]}",
            proposal_id=proposal_id,
            quorum=quorum,
            votes=proposal_votes,
            decided_at=datetime.now(timezone.utc).isoformat(),
            passed=passed,
        )
