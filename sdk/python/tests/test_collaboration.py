import unittest
from alp_sdk.collaboration import CollaborationEngine


class TestCollaborationEngine(unittest.TestCase):
    def test_session_presence(self):
        engine = CollaborationEngine()
        session = engine.create_session("doc-1")
        self.assertEqual(session.doc_id, "doc-1")

        p1 = engine.join_session("doc-1", "agent-a")
        self.assertIsNotNone(p1)
        self.assertEqual(p1.agent_id, "agent-a")

        presence = engine.get_presence("doc-1")
        self.assertEqual(len(presence), 1)

        left = engine.leave_session("doc-1", "agent-a")
        self.assertTrue(left)

    def test_apply_operations_and_snapshot(self):
        engine = CollaborationEngine()
        engine.create_session("doc-state")
        engine.join_session("doc-state", "agent-1")

        op1 = engine.apply_operation("doc-state", "insert", "title", "agent-1", "Initial Title")
        self.assertIsNotNone(op1)
        self.assertEqual(engine.get_snapshot("doc-state")["title"], "Initial Title")

        engine.apply_operation("doc-state", "update", "title", "agent-1", "Updated Title")
        self.assertEqual(engine.get_snapshot("doc-state")["title"], "Updated Title")
        self.assertEqual(len(engine.get_operation_log("doc-state")), 2)

    def test_fork_and_merge_branch(self):
        engine = CollaborationEngine()
        engine.create_session("doc-main", {"status": "draft"})

        branch = engine.fork("doc-main", "feature-branch")
        self.assertIsNotNone(branch)
        branch.state["status"] = "review"

        result = engine.merge_branch("doc-main", "feature-branch")
        self.assertIsNotNone(result)
        self.assertEqual(result["merged"]["status"], "review")

    def test_permissions_default_open(self):
        engine = CollaborationEngine()
        engine.create_session("doc-1")
        self.assertTrue(engine.check_permission("doc-1", "any-agent", "edit"))

    def test_grant_revoke_permissions(self):
        engine = CollaborationEngine()
        engine.create_session("doc-1")
        engine.grant_permission("doc-1", "agent-1", "edit", "admin")
        self.assertTrue(engine.check_permission("doc-1", "agent-1", "edit"))
        self.assertFalse(engine.check_permission("doc-1", "agent-1", "admin"))
        self.assertFalse(engine.check_permission("doc-1", "agent-2", "edit"))

        engine.revoke_permission("doc-1", "agent-1", "admin")
        self.assertEqual(len(engine.get_permissions("doc-1")), 0)
        self.assertFalse(engine.revoke_permission("doc-1", "agent-1", "admin"))

    def test_comments_and_threads(self):
        engine = CollaborationEngine()
        engine.create_session("doc-1")

        c1 = engine.add_comment("doc-1", "title", "agent-1", "Looks good")
        self.assertFalse(c1.resolved)
        self.assertIsNotNone(c1.id)

        self.assertTrue(engine.resolve_comment(c1.id, "agent-2"))
        self.assertFalse(engine.resolve_comment(c1.id, "agent-3"))

        comments = engine.get_comments("doc-1")
        self.assertEqual(len(comments), 1)
        self.assertTrue(comments[0].resolved)
        self.assertEqual(comments[0].resolved_by, "agent-2")

        thread = engine.create_review_thread("doc-1", "body", "agent-1", "Please review")
        self.assertEqual(thread.status, "open")
        self.assertEqual(len(thread.comments), 1)

        engine.reply_to_thread(thread.id, "agent-2", "Will do")
        self.assertEqual(len(engine.get_review_threads("doc-1")), 1)
        self.assertEqual(len(engine.get_review_threads("doc-1")[0].comments), 2)

        engine.resolve_thread(thread.id, "agent-1")
        self.assertEqual(engine.get_review_threads("doc-1")[0].status, "resolved")

    def test_activity_feed(self):
        engine = CollaborationEngine()
        engine.create_session("doc-1")
        engine.join_session("doc-1", "agent-1")
        engine.apply_operation("doc-1", "insert", "x", "agent-1", "y")

        all_events = engine.get_activity_feed("doc-1")
        self.assertGreaterEqual(len(all_events), 2)

        joins = engine.get_activity_feed("doc-1", event_type="team_edit")
        self.assertGreaterEqual(len(joins), 1)

        agent_edits = engine.get_activity_feed("doc-1", actor_id="agent-1")
        self.assertGreaterEqual(len(agent_edits), 1)

    def test_live_share_sessions(self):
        engine = CollaborationEngine()
        engine.create_session("doc-1")

        share = engine.start_live_share("doc-1", "host-1")
        self.assertEqual(share.status, "active")
        self.assertEqual(share.host_id, "host-1")

        self.assertTrue(engine.join_live_share(share.session_id, "guest-1"))
        self.assertFalse(engine.join_live_share("missing", "guest-1"))

        shares = engine.get_live_shares("doc-1")
        self.assertEqual(len(shares), 1)
        self.assertIn("guest-1", shares[0].guests)

        self.assertTrue(engine.end_live_share(share.session_id, "host-1"))
        self.assertEqual(len(engine.get_live_shares("doc-1")), 0)

    def test_audit_log(self):
        engine = CollaborationEngine()
        engine.create_session("doc-1")
        engine.grant_permission("doc-1", "agent-1", "edit", "admin")
        engine.apply_operation("doc-1", "insert", "x", "agent-1", "y")

        all_events = engine.query_audit_log()
        self.assertGreaterEqual(len(all_events), 2)

        grants = engine.query_audit_log({"action": "collab:grant_permission"})
        self.assertGreaterEqual(len(grants), 1)
        self.assertEqual(grants[0].actor_id, "admin")

        exported = engine.export_audit_log()
        self.assertGreaterEqual(len(exported), 2)

