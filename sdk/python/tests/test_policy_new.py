import os
import sys
import unittest
from datetime import datetime, timezone

SDK_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if SDK_ROOT not in sys.path:
    sys.path.insert(0, SDK_ROOT)

from alp_sdk import AlpObject, PolicyEngine, PolicyQuery, PolicyDecision, PolicyLearner, PolicyContext
from alp_sdk.policy import (
    TimeWindow,
    ApprovalRule,
    PolicyProposal,
    FederatedTrustRoot,
    glob_to_regexp,
    normalize_objects,
    parse_inline_object,
)
from alp_sdk.formal import PolicyModelChecker, ComplianceCertifier


def pol(pid, **props):
    d = {"_type": "policy", "id": pid}
    d.update(props)
    return AlpObject.from_dict(d)


class TestTimeWindow(unittest.TestCase):
    def test_defaults(self):
        tw = TimeWindow()
        self.assertEqual(tw.days, ["*"])
        self.assertEqual(tw.start, "00:00")
        self.assertEqual(tw.end, "23:59")

    def test_custom_window(self):
        tw = TimeWindow(days=["monday", "tuesday"], start="09:00", end="17:00")
        self.assertEqual(tw.days, ["monday", "tuesday"])
        self.assertEqual(tw.start, "09:00")
        self.assertEqual(tw.end, "17:00")


class TestApprovalRule(unittest.TestCase):
    def test_attributes(self):
        rule = ApprovalRule(kind="path", value="src/secrets/**")
        self.assertEqual(rule.kind, "path")
        self.assertEqual(rule.value, "src/secrets/**")


class TestPolicyProposal(unittest.TestCase):
    def test_attributes(self):
        prop = PolicyProposal(id="prop-1", action="deploy", agent="a1")
        self.assertEqual(prop.id, "prop-1")
        self.assertEqual(prop.action, "deploy")
        self.assertEqual(prop.agent, "a1")
        self.assertIsNone(prop.signed_by)
        self.assertIsNone(prop.signature)

    def test_signed_proposal(self):
        prop = PolicyProposal(
            id="prop-1", action="deploy", agent="a1",
            signed_by="alice", signature="sig123",
        )
        self.assertEqual(prop.signed_by, "alice")
        self.assertEqual(prop.signature, "sig123")


class TestFederatedTrustRoot(unittest.TestCase):
    def test_attributes(self):
        root = FederatedTrustRoot(
            namespace="my-ns",
            public_key_pem="-----BEGIN PUBLIC KEY-----",
            fingerprint="sha256:abc123",
        )
        self.assertEqual(root.namespace, "my-ns")
        self.assertEqual(root.public_key_pem, "-----BEGIN PUBLIC KEY-----")
        self.assertEqual(root.fingerprint, "sha256:abc123")


class TestAgentActionKind(unittest.TestCase):
    def test_agent_path_deny(self):
        engine = PolicyEngine([pol("p1", deny_agents=["agent-x"], enforcement="strict")])
        d = engine.evaluate(PolicyQuery("agent", "agent-x"))
        self.assertFalse(d.allowed)
        self.assertTrue(d.blocked)

    def test_agent_path_allow(self):
        engine = PolicyEngine([pol("p1", allow_agents=["agent-x"], enforcement="strict")])
        d = engine.evaluate(PolicyQuery("agent", "agent-x"))
        self.assertTrue(d.allowed)

    def test_agent_command_deny(self):
        engine = PolicyEngine([pol("p1", deny_commands=["rm -rf /"], enforcement="strict")])
        d = engine.evaluate(PolicyQuery("command", "rm -rf /"))
        self.assertFalse(d.allowed)
        self.assertTrue(d.blocked)


class TestFederationMethods(unittest.TestCase):
    def test_bootstrap_trust(self):
        root = FederatedTrustRoot(namespace="ns1", public_key_pem="key1", fingerprint="fp1")
        result = PolicyEngine.bootstrap_trust("/tmp/nonexistent", root)
        self.assertEqual(result.namespace, "ns1")
        self.assertEqual(result.public_key_pem, "key1")
        self.assertEqual(result.fingerprint, "fp1")

    def test_inherited_policies(self):
        parent = [pol("p1", deny_paths=["/tmp"]), pol("p2", allow_paths=["src/**"])]
        child = [pol("p1", deny_paths=["/secret"])]
        merged = PolicyEngine.inherited_policies(parent, child)
        ids = [p.id for p in merged]
        self.assertIn("p1", ids)
        self.assertIn("p2", ids)
        self.assertEqual(len(merged), 2)
        p1 = next(p for p in merged if p.id == "p1")
        self.assertEqual(p1.properties.get("deny_paths"), ["/secret"])

    def test_cross_federation_evaluate(self):
        engine = PolicyEngine([pol("p1", deny_paths=["/tmp"], enforcement="strict")])
        roots = [FederatedTrustRoot(namespace="ns1", public_key_pem="key1", fingerprint="fp1")]
        d = engine.cross_federation_evaluate(PolicyQuery("path", "/tmp"), roots)
        self.assertFalse(d.allowed)
        self.assertTrue(d.blocked)
        self.assertTrue(any("[ns1]" in r for r in d.reasons))


class TestNormalizeHelpers(unittest.TestCase):
    def test_normalize_objects_with_dicts(self):
        result = normalize_objects([{"id": "a"}, {"id": "b"}])
        self.assertEqual(len(result), 2)
        self.assertEqual(result[0]["id"], "a")

    def test_normalize_objects_with_strings(self):
        result = normalize_objects(['{ id: "a" }', '{ id: "b" }'])
        self.assertEqual(len(result), 2)
        self.assertEqual(result[0]["id"], "a")

    def test_normalize_objects_empty(self):
        self.assertEqual(normalize_objects([]), [])
        self.assertEqual(normalize_objects(None), [])

    def test_parse_inline_object(self):
        result = parse_inline_object('{ id: "prop-1", action: "deploy" }')
        self.assertEqual(result["id"], "prop-1")
        self.assertEqual(result["action"], "deploy")

    def test_parse_inline_object_with_array(self):
        result = parse_inline_object('{ id: "prop-1", days: ["mon","tue"] }')
        self.assertEqual(result["id"], "prop-1")
        self.assertIsInstance(result["days"], str)


class TestGlobToRegexp(unittest.TestCase):
    def test_star_matches_within_segment(self):
        pattern = glob_to_regexp("src/*.py")
        self.assertTrue(pattern.match("src/main.py"))
        self.assertFalse(pattern.match("src/sub/main.py"))

    def test_double_star_matches_across_segments(self):
        pattern = glob_to_regexp("src/**/*.py")
        self.assertTrue(pattern.match("src/main.py"))
        self.assertTrue(pattern.match("src/sub/main.py"))
        self.assertFalse(pattern.match("other/main.py"))

    def test_question_mark_matches_single_char(self):
        pattern = glob_to_regexp("src/?.py")
        self.assertTrue(pattern.match("src/a.py"))
        self.assertFalse(pattern.match("src/ab.py"))


class TestPolicyModelChecker(unittest.TestCase):
    def test_verify_valid_policy(self):
        checker = PolicyModelChecker([pol("p1", allow_paths=["src/**"], enforcement="strict")])
        proof = checker.verify("p1")
        self.assertTrue(proof.passed)
        self.assertTrue(all(p.passed for p in proof.properties))

    def test_verify_missing_policy(self):
        checker = PolicyModelChecker([])
        proof = checker.verify("nonexistent")
        self.assertFalse(proof.passed)
        self.assertIsNotNone(proof.counterexample)

    def test_verify_path_contradiction(self):
        checker = PolicyModelChecker([pol("p1", allow_paths=["/tmp"], deny_paths=["/tmp"])])
        proof = checker.verify("p1")
        self.assertFalse(proof.passed)
        contradiction = next(p for p in proof.properties if p.name == "no_path_contradiction")
        self.assertFalse(contradiction.passed)


class TestComplianceCertifier(unittest.TestCase):
    def test_certify_passed(self):
        certifier = ComplianceCertifier(trust_root={"namespace": "test"})
        results = [{"passed": True}, {"passed": True}]
        bundle = certifier.certify("run-1", "v40.0.0", results)
        self.assertTrue(bundle["passed"])
        self.assertIn("signature", bundle)
        self.assertEqual(bundle["issuer"], "test")

    def test_certify_failed(self):
        certifier = ComplianceCertifier()
        results = [{"passed": True}, {"passed": False}]
        bundle = certifier.certify("run-2", "v40.0.0", results)
        self.assertFalse(bundle["passed"])

    def test_verify_bundle_valid(self):
        certifier = ComplianceCertifier(trust_root={"namespace": "test"})
        results = [{"passed": True}]
        bundle = certifier.certify("run-3", "v40.0.0", results)
        self.assertTrue(certifier.verify_bundle(bundle))

    def test_verify_bundle_tampered(self):
        certifier = ComplianceCertifier(trust_root={"namespace": "test"})
        results = [{"passed": True}]
        bundle = certifier.certify("run-4", "v40.0.0", results)
        bundle["passed"] = False
        self.assertFalse(certifier.verify_bundle(bundle))


class TestPolicyLearner(unittest.TestCase):
    def test_suggests_after_repeated_denials(self):
        learner = PolicyLearner()
        ctx = PolicyContext(environment="production", team_size=5, risk_profile="high", deployment_target="aws")
        for _ in range(3):
            learner.record_violation("pol-1", "deploy", False, ctx)
        suggestions = learner.suggest()
        self.assertGreaterEqual(len(suggestions), 1)
        self.assertEqual(suggestions[0]["policy_id"], "pol-1")
        self.assertEqual(suggestions[0]["action"], "review_allow_rules")

    def test_no_suggest_after_few_violations(self):
        learner = PolicyLearner()
        ctx = PolicyContext(environment="development", team_size=2, risk_profile="low", deployment_target="local")
        learner.record_violation("pol-1", "deploy", False, ctx)
        self.assertEqual(learner.suggest(), [])

    def test_reset_clears_violations(self):
        learner = PolicyLearner()
        ctx = PolicyContext(environment="staging", team_size=3, risk_profile="medium", deployment_target="gcp")
        learner.record_violation("pol-1", "deploy", False, ctx)
        learner.record_violation("pol-1", "deploy", False, ctx)
        learner.record_violation("pol-1", "deploy", False, ctx)
        self.assertGreaterEqual(len(learner.suggest()), 1)
        learner.reset()
        self.assertEqual(learner.suggest(), [])


if __name__ == "__main__":
    unittest.main()