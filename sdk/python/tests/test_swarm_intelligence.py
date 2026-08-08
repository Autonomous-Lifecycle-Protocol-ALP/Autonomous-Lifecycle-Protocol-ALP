import unittest
from alp_sdk.swarm_intelligence import (
    SwarmSignal,
    EmergentPattern,
    AgentSpecialization,
    EmergentBehaviorDetector,
    RoleSpecializer,
    CollectiveVote,
    CollectiveDecision,
    CollectiveDecisionMaker,
)


class TestEmergentBehaviorDetector(unittest.TestCase):
    def test_detects_repeated_failures(self):
        detector = EmergentBehaviorDetector()
        now = "2026-01-01T00:00:00Z"
        for _ in range(3):
            detector.ingest(SwarmSignal(agent_id="agent-1", swarm_id="swarm-1", signal_type="task_fail", timestamp=now, metadata={}))
        patterns = detector.detect()
        failure_patterns = [p for p in patterns if p.pattern_type == "repeated_failure"]
        self.assertGreaterEqual(len(failure_patterns), 1)
        self.assertIn("agent-1", failure_patterns[0].affected_agents)

    def test_detects_load_imbalance(self):
        detector = EmergentBehaviorDetector()
        now = "2026-01-01T00:00:00Z"
        detector.ingest(SwarmSignal(agent_id="agent-1", swarm_id="swarm-1", signal_type="claim", timestamp=now, metadata={}))
        detector.ingest(SwarmSignal(agent_id="agent-1", swarm_id="swarm-1", signal_type="claim", timestamp=now, metadata={}))
        detector.ingest(SwarmSignal(agent_id="agent-2", swarm_id="swarm-1", signal_type="claim", timestamp=now, metadata={}))
        detector.ingest(SwarmSignal(agent_id="agent-3", swarm_id="swarm-1", signal_type="task_complete", timestamp=now, metadata={}))
        patterns = detector.detect()
        imbalance = [p for p in patterns if p.pattern_type == "load_imbalance"]
        self.assertGreaterEqual(len(imbalance), 1)

    def test_returns_empty_patterns_for_healthy_swarm(self):
        detector = EmergentBehaviorDetector()
        now = "2026-01-01T00:00:00Z"
        detector.ingest(SwarmSignal(agent_id="agent-1", swarm_id="swarm-1", signal_type="task_complete", timestamp=now, metadata={}))
        self.assertEqual(len(detector.detect()), 0)

    def test_reset_clears_signals(self):
        detector = EmergentBehaviorDetector()
        now = "2026-01-01T00:00:00Z"
        detector.ingest(SwarmSignal(agent_id="agent-1", swarm_id="swarm-1", signal_type="task_fail", timestamp=now, metadata={}))
        detector.reset()
        self.assertEqual(len(detector.signals), 0)


class TestRoleSpecializer(unittest.TestCase):
    def test_records_specialization_from_successes(self):
        specializer = RoleSpecializer()
        specializer.record("agent-1", "planner", True)
        specializer.record("agent-1", "planner", True)
        spec = specializer.get_specialization("agent-1")
        self.assertEqual(spec.role, "planner")
        self.assertGreater(spec.confidence, 0.7)

    def test_downgrades_confidence_on_failures(self):
        specializer = RoleSpecializer()
        specializer.record("agent-1", "builder", False)
        spec = specializer.get_specialization("agent-1")
        self.assertLess(spec.confidence, 0.5)

    def test_returns_sorted_specializations(self):
        specializer = RoleSpecializer()
        specializer.record("agent-1", "planner", True)
        specializer.record("agent-2", "builder", True)
        specializer.record("agent-2", "builder", True)
        all_specs = specializer.get_all()
        self.assertEqual(len(all_specs), 2)
        self.assertEqual(all_specs[0].agent_id, "agent-2")


class TestCollectiveDecisionMaker(unittest.TestCase):
    def test_reaches_decision_with_sufficient_quorum(self):
        maker = CollectiveDecisionMaker()
        maker.cast_vote("prop-1", "voter-1", True)
        maker.cast_vote("prop-1", "voter-2", True)
        maker.cast_vote("prop-1", "voter-3", False)
        decision = maker.decide("prop-1", 2)
        self.assertTrue(decision.passed)
        self.assertEqual(len(decision.votes), 3)

    def test_fails_decision_below_quorum(self):
        maker = CollectiveDecisionMaker()
        maker.cast_vote("prop-1", "voter-1", True)
        decision = maker.decide("prop-1", 3)
        self.assertFalse(decision.passed)

    def test_collective_vote_to_dict(self):
        vote = CollectiveVote(
            vote_id="vote-1",
            proposal_id="prop-1",
            voter_id="voter-1",
            approved=True,
            rationale="Looks good",
            timestamp="2026-01-01T00:00:00Z",
        )
        data = vote.to_dict()
        self.assertEqual(data["vote_id"], "vote-1")
        self.assertTrue(data["approved"])

    def test_collective_decision_to_dict(self):
        maker = CollectiveDecisionMaker()
        maker.cast_vote("prop-1", "voter-1", True)
        decision = maker.decide("prop-1", 1)
        data = decision.to_dict()
        self.assertIn("votes", data)
        self.assertTrue(data["passed"])


if __name__ == "__main__":
    unittest.main()
