"""ALP CollaborationEngine — IDE Collaboration (v43.0.0 — Python SDK parity).

Extends v37.0.0 real-time multiplayer conflict resolution with:
- Inline comments and code review threads
- Activity feed for agent runs, policy decisions, and team edits
- Team permission controls (view/edit/admin)
- Live share sessions for synchronous co-authoring
- Audit log for compliance and rollback
"""
from __future__ import annotations

import time
from typing import Any, Dict, List, Optional

AGENT_COLORS = [
    "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4",
    "#FFEAA7", "#DDA0DD", "#98D8C8", "#F7DC6F",
    "#BB8FCE", "#85C1E9", "#F8C471", "#82E0AA",
]

_op_counter = 0
_comment_counter = 0
_thread_counter = 0
_activity_counter = 0
_audit_counter = 0
_share_counter = 0


class PresenceInfo:
    def __init__(self, agent_id: str, color: str, cursor: Optional[str] = None, status: str = "active"):
        self.agent_id = agent_id
        self.cursor = cursor
        self.last_seen = time.time()
        self.color = color
        self.status = status

    def to_dict(self) -> Dict[str, Any]:
        return {
            "agentId": self.agent_id,
            "cursor": self.cursor,
            "lastSeen": self.last_seen,
            "color": self.color,
            "status": self.status,
        }


class CollabOperation:
    def __init__(
        self,
        op_id: str,
        doc_id: str,
        op_type: str,
        path: str,
        agent_id: str,
        value: Any = None,
        previous_value: Any = None,
        vector_clock: Optional[Dict[str, int]] = None,
    ):
        self.id = op_id
        self.doc_id = doc_id
        self.type = op_type
        self.path = path
        self.agent_id = agent_id
        self.value = value
        self.previous_value = previous_value
        self.timestamp = time.time()
        self.vector_clock = vector_clock or {}

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "docId": self.doc_id,
            "type": self.type,
            "path": self.path,
            "agentId": self.agent_id,
            "value": self.value,
            "previousValue": self.previous_value,
            "timestamp": self.timestamp,
            "vectorClock": self.vector_clock,
        }


class CollabBranch:
    def __init__(self, branch_id: str, source_doc_id: str, state: Dict[str, Any], forked_from_op: int):
        self.branch_id = branch_id
        self.source_doc_id = source_doc_id
        self.forked_at = time.time()
        self.forked_from_op = forked_from_op
        self.state = dict(state)
        self.operations: List[CollabOperation] = []


class CollabSession:
    def __init__(self, doc_id: str, initial_state: Optional[Dict[str, Any]] = None):
        self.doc_id = doc_id
        self.created_at = time.time()
        self.agents: Dict[str, PresenceInfo] = {}
        self.operations: List[CollabOperation] = []
        self.state: Dict[str, Any] = dict(initial_state or {})
        self.branches: Dict[str, CollabBranch] = {}


class TeamPermission:
    def __init__(self, doc_id: str, agent_id: str, permission: str, granted_at: float, granted_by: str):
        self.doc_id = doc_id
        self.agent_id = agent_id
        self.permission = permission
        self.granted_at = granted_at
        self.granted_by = granted_by

    def to_dict(self) -> Dict[str, Any]:
        return {
            "docId": self.doc_id,
            "agentId": self.agent_id,
            "permission": self.permission,
            "grantedAt": self.granted_at,
            "grantedBy": self.granted_by,
        }


class Comment:
    def __init__(
        self,
        comment_id: str,
        doc_id: str,
        path: str,
        author_id: str,
        text: str,
        timestamp: float,
        resolved: bool = False,
        resolved_by: Optional[str] = None,
        resolved_at: Optional[float] = None,
    ):
        self.id = comment_id
        self.doc_id = doc_id
        self.path = path
        self.author_id = author_id
        self.text = text
        self.timestamp = timestamp
        self.resolved = resolved
        self.resolved_by = resolved_by
        self.resolved_at = resolved_at

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "docId": self.doc_id,
            "path": self.path,
            "authorId": self.author_id,
            "text": self.text,
            "timestamp": self.timestamp,
            "resolved": self.resolved,
            "resolvedBy": self.resolved_by,
            "resolvedAt": self.resolved_at,
        }


class ReviewThread:
    def __init__(self, thread_id: str, doc_id: str, path: str, comments: List[Comment]):
        self.id = thread_id
        self.doc_id = doc_id
        self.path = path
        self.comments = list(comments)
        self.status = "open"
        self.created_at = time.time()
        self.updated_at = time.time()

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "docId": self.doc_id,
            "path": self.path,
            "comments": [c.to_dict() for c in self.comments],
            "status": self.status,
            "createdAt": self.created_at,
            "updatedAt": self.updated_at,
        }


class ActivityEvent:
    def __init__(self, event_id: str, doc_id: str, event_type: str, actor_id: str, payload: Dict[str, Any]):
        self.id = event_id
        self.doc_id = doc_id
        self.type = event_type
        self.actor_id = actor_id
        self.timestamp = time.time()
        self.payload = dict(payload)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "docId": self.doc_id,
            "type": self.type,
            "actorId": self.actor_id,
            "timestamp": self.timestamp,
            "payload": self.payload,
        }


class LiveShareSession:
    def __init__(self, session_id: str, doc_id: str, host_id: str, guests: Optional[List[str]] = None):
        self.session_id = session_id
        self.doc_id = doc_id
        self.host_id = host_id
        self.guests = list(guests or [])
        self.started_at = time.time()
        self.ended_at: Optional[float] = None
        self.status = "active"

    def to_dict(self) -> Dict[str, Any]:
        return {
            "sessionId": self.session_id,
            "docId": self.doc_id,
            "hostId": self.host_id,
            "guests": list(self.guests),
            "startedAt": self.started_at,
            "endedAt": self.ended_at,
            "status": self.status,
        }


class AuditEvent:
    def __init__(self, event_id: str, timestamp: float, actor_id: str, action: str, target: str, details: Dict[str, Any]):
        self.id = event_id
        self.timestamp = timestamp
        self.actor_id = actor_id
        self.action = action
        self.target = target
        self.details = dict(details)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "timestamp": self.timestamp,
            "actorId": self.actor_id,
            "action": self.action,
            "target": self.target,
            "details": self.details,
        }


class CollaborationEngine:
    def __init__(self):
        self.sessions: Dict[str, CollabSession] = {}
        self.permissions: Dict[str, List[TeamPermission]] = {}
        self.comments: List[Comment] = []
        self.threads: List[ReviewThread] = []
        self.activities: List[ActivityEvent] = []
        self.live_shares: Dict[str, LiveShareSession] = {}
        self.audit_log: List[AuditEvent] = []

    def create_session(self, doc_id: str, initial_state: Optional[Dict[str, Any]] = None) -> CollabSession:
        if doc_id in self.sessions:
            return self.sessions[doc_id]
        session = CollabSession(doc_id, initial_state)
        self.sessions[doc_id] = session
        self._log_activity(doc_id, "agent_run", "system", {"action": "session_created"})
        return session

    def join_session(self, doc_id: str, agent_id: str) -> Optional[PresenceInfo]:
        session = self.sessions.get(doc_id)
        if not session:
            return None
        color_idx = len(session.agents) % len(AGENT_COLORS)
        presence = PresenceInfo(agent_id=agent_id, color=AGENT_COLORS[color_idx])
        session.agents[agent_id] = presence
        self._log_activity(doc_id, "team_edit", agent_id, {"action": "joined_session"})
        return presence

    def leave_session(self, doc_id: str, agent_id: str) -> bool:
        session = self.sessions.get(doc_id)
        if not session:
            return False
        if agent_id in session.agents:
            session.agents[agent_id].status = "disconnected"
            session.agents[agent_id].last_seen = time.time()
            del session.agents[agent_id]
            return True
        return False

    def get_presence(self, doc_id: str) -> List[PresenceInfo]:
        session = self.sessions.get(doc_id)
        if not session:
            return []
        return list(session.agents.values())

    def apply_operation(
        self, doc_id: str, op_type: str, path: str, agent_id: str, value: Any = None
    ) -> Optional[CollabOperation]:
        global _op_counter
        session = self.sessions.get(doc_id)
        if not session:
            return None
        if not self.check_permission(doc_id, agent_id, "edit"):
            return None

        clock: Dict[str, int] = {}
        for op in session.operations:
            for agent, tick in op.vector_clock.items():
                clock[agent] = max(clock.get(agent, 0), tick)
        clock[agent_id] = clock.get(agent_id, 0) + 1

        _op_counter += 1
        previous_value = session.state.get(path)
        op = CollabOperation(
            op_id=f"op-{_op_counter}",
            doc_id=doc_id,
            op_type=op_type,
            path=path,
            agent_id=agent_id,
            value=value,
            previous_value=previous_value,
            vector_clock=clock,
        )

        if op_type in ("insert", "update"):
            session.state[path] = value
        elif op_type == "delete" and path in session.state:
            del session.state[path]

        session.operations.append(op)

        if agent_id in session.agents:
            presence = session.agents[agent_id]
            presence.last_seen = time.time()
            presence.cursor = path
            presence.status = "active"

        self._log_activity(doc_id, "team_edit", agent_id, {"action": op_type, "path": path})
        self._append_audit(agent_id, "collab:apply_operation", doc_id, {"opId": op.id, "path": path, "type": op_type})

        return op

    def get_operation_log(self, doc_id: str) -> List[CollabOperation]:
        session = self.sessions.get(doc_id)
        return list(session.operations) if session else []

    def get_snapshot(self, doc_id: str) -> Dict[str, Any]:
        session = self.sessions.get(doc_id)
        return dict(session.state) if session else {}

    def fork(self, doc_id: str, branch_id: str) -> Optional[CollabBranch]:
        session = self.sessions.get(doc_id)
        if not session:
            return None
        branch = CollabBranch(
            branch_id=branch_id,
            source_doc_id=doc_id,
            state=session.state,
            forked_from_op=len(session.operations),
        )
        session.branches[branch_id] = branch
        self._log_activity(doc_id, "branch", "system", {"action": "fork", "branchId": branch_id})
        self._append_audit("system", "collab:fork", doc_id, {"branchId": branch_id})
        return branch

    def merge_branch(self, doc_id: str, branch_id: str) -> Optional[Dict[str, Any]]:
        session = self.sessions.get(doc_id)
        if not session:
            return None
        branch = session.branches.get(branch_id)
        if not branch:
            return None

        conflicts = []
        merged = dict(session.state)
        ops_applied = 0

        main_ops_after_fork = session.operations[branch.forked_from_op :]
        main_modified_paths = {op.path for op in main_ops_after_fork}

        for path, branch_val in branch.state.items():
            if path in main_modified_paths and merged.get(path) != branch_val:
                local_val = merged.get(path)
                merged[path] = branch_val
                conflicts.append({
                    "path": path,
                    "localValue": local_val,
                    "remoteValue": branch_val,
                    "resolution": "remote_wins",
                })
            else:
                merged[path] = branch_val
            ops_applied += 1

        session.state = merged
        del session.branches[branch_id]

        self._log_activity(doc_id, "merge", "system", {"action": "merge", "branchId": branch_id, "conflicts": len(conflicts)})
        self._append_audit("system", "collab:merge", doc_id, {"branchId": branch_id, "opsApplied": ops_applied, "conflicts": len(conflicts)})

        return {
            "merged": merged,
            "conflicts": conflicts,
            "operationsApplied": ops_applied,
        }

    def get_session(self, doc_id: str) -> Optional[CollabSession]:
        return self.sessions.get(doc_id)

    def grant_permission(self, doc_id: str, agent_id: str, permission: str, granted_by: str) -> TeamPermission:
        existing = self.get_permissions(doc_id)
        filtered = [p for p in existing if not (p.agent_id == agent_id and p.doc_id == doc_id)]
        perm = TeamPermission(doc_id=doc_id, agent_id=agent_id, permission=permission, granted_at=time.time(), granted_by=granted_by)
        filtered.append(perm)
        self.permissions[doc_id] = filtered
        self._log_activity(doc_id, "permission_change", granted_by, {"action": "grant", "targetAgent": agent_id, "permission": permission})
        self._append_audit(granted_by, "collab:grant_permission", doc_id, {"agentId": agent_id, "permission": permission})
        return perm

    def revoke_permission(self, doc_id: str, agent_id: str, revoked_by: str) -> bool:
        existing = self.get_permissions(doc_id)
        filtered = [p for p in existing if not (p.agent_id == agent_id and p.doc_id == doc_id)]
        if len(filtered) == len(existing):
            return False
        self.permissions[doc_id] = filtered
        self._log_activity(doc_id, "permission_change", revoked_by, {"action": "revoke", "targetAgent": agent_id})
        self._append_audit(revoked_by, "collab:revoke_permission", doc_id, {"agentId": agent_id})
        return True

    def get_permissions(self, doc_id: str) -> List[TeamPermission]:
        return list(self.permissions.get(doc_id, []))

    def check_permission(self, doc_id: str, agent_id: str, required: str) -> bool:
        perms = self.get_permissions(doc_id)
        if not perms:
            return True
        perm = next((p for p in perms if p.agent_id == agent_id), None)
        if not perm:
            return False
        order = {"view": 1, "edit": 2, "admin": 3}
        return order.get(perm.permission, 0) >= order.get(required, 0)

    def add_comment(self, doc_id: str, path: str, author_id: str, text: str) -> Comment:
        global _comment_counter
        comment = Comment(
            comment_id=f"comment-{_comment_counter}",
            doc_id=doc_id,
            path=path,
            author_id=author_id,
            text=text,
            timestamp=time.time(),
            resolved=False,
        )
        _comment_counter += 1
        self.comments.append(comment)
        self._log_activity(doc_id, "comment", author_id, {"action": "add_comment", "path": path, "commentId": comment.id})
        self._append_audit(author_id, "collab:add_comment", doc_id, {"commentId": comment.id, "path": path})
        return comment

    def resolve_comment(self, comment_id: str, resolved_by: str) -> bool:
        comment = next((c for c in self.comments if c.id == comment_id), None)
        if not comment or comment.resolved:
            return False
        comment.resolved = True
        comment.resolved_by = resolved_by
        comment.resolved_at = time.time()
        self._log_activity(comment.doc_id, "comment", resolved_by, {"action": "resolve_comment", "commentId": comment_id})
        self._append_audit(resolved_by, "collab:resolve_comment", comment.doc_id, {"commentId": comment_id})
        return True

    def get_comments(self, doc_id: str, path: Optional[str] = None) -> List[Comment]:
        return [c for c in self.comments if c.doc_id == doc_id and (path is None or c.path == path)]

    def create_review_thread(self, doc_id: str, path: str, author_id: str, text: str) -> ReviewThread:
        global _thread_counter
        comment = self.add_comment(doc_id, path, author_id, text)
        thread = ReviewThread(
            thread_id=f"thread-{_thread_counter}",
            doc_id=doc_id,
            path=path,
            comments=[comment],
        )
        _thread_counter += 1
        self.threads.append(thread)
        return thread

    def reply_to_thread(self, thread_id: str, author_id: str, text: str) -> Optional[Comment]:
        thread = next((t for t in self.threads if t.id == thread_id), None)
        if not thread:
            return None
        comment = self.add_comment(thread.doc_id, thread.path, author_id, text)
        thread.comments.append(comment)
        thread.updated_at = time.time()
        return comment

    def resolve_thread(self, thread_id: str, resolved_by: str) -> bool:
        thread = next((t for t in self.threads if t.id == thread_id), None)
        if not thread or thread.status == "resolved":
            return False
        thread.status = "resolved"
        thread.updated_at = time.time()
        for c in thread.comments:
            if not c.resolved:
                self.resolve_comment(c.id, resolved_by)
        self._log_activity(thread.doc_id, "comment", resolved_by, {"action": "resolve_thread", "threadId": thread_id})
        return True

    def get_review_threads(self, doc_id: str) -> List[ReviewThread]:
        return [t for t in self.threads if t.doc_id == doc_id]

    def _log_activity(self, doc_id: str, event_type: str, actor_id: str, payload: Dict[str, Any]) -> ActivityEvent:
        global _activity_counter
        event = ActivityEvent(
            event_id=f"activity-{_activity_counter}",
            doc_id=doc_id,
            event_type=event_type,
            actor_id=actor_id,
            payload=payload,
        )
        _activity_counter += 1
        self.activities.append(event)
        return event

    def get_activity_feed(self, doc_id: str, event_type: Optional[str] = None, actor_id: Optional[str] = None) -> List[ActivityEvent]:
        return [
            a for a in self.activities
            if a.doc_id == doc_id and (event_type is None or a.type == event_type) and (actor_id is None or a.actor_id == actor_id)
        ]

    def start_live_share(self, doc_id: str, host_id: str) -> LiveShareSession:
        global _share_counter
        session_id = f"share-{_share_counter}"
        _share_counter += 1
        session = LiveShareSession(session_id=session_id, doc_id=doc_id, host_id=host_id)
        self.live_shares[session_id] = session
        self._log_activity(doc_id, "team_edit", host_id, {"action": "start_live_share", "sessionId": session_id})
        self._append_audit(host_id, "collab:start_live_share", doc_id, {"sessionId": session_id})
        return session

    def join_live_share(self, session_id: str, guest_id: str) -> bool:
        session = self.live_shares.get(session_id)
        if not session or session.status != "active":
            return False
        if session.host_id == guest_id:
            return True
        if guest_id not in session.guests:
            session.guests.append(guest_id)
        self._log_activity(session.doc_id, "team_edit", guest_id, {"action": "join_live_share", "sessionId": session_id})
        return True

    def end_live_share(self, session_id: str, ended_by: str) -> bool:
        session = self.live_shares.get(session_id)
        if not session or session.status != "active":
            return False
        session.status = "ended"
        session.ended_at = time.time()
        self._log_activity(session.doc_id, "team_edit", ended_by, {"action": "end_live_share", "sessionId": session_id})
        self._append_audit(ended_by, "collab:end_live_share", session.doc_id, {"sessionId": session_id})
        return True

    def get_live_shares(self, doc_id: str) -> List[LiveShareSession]:
        return [s for s in self.live_shares.values() if s.doc_id == doc_id and s.status == "active"]

    def _append_audit(self, actor_id: str, action: str, target: str, details: Dict[str, Any]) -> AuditEvent:
        global _audit_counter
        event = AuditEvent(
            event_id=f"audit-{_audit_counter}",
            timestamp=time.time(),
            actor_id=actor_id,
            action=action,
            target=target,
            details=details,
        )
        _audit_counter += 1
        self.audit_log.append(event)
        return event

    def query_audit_log(self, options: Optional[Dict[str, Any]] = None) -> List[AuditEvent]:
        options = options or {}
        results = list(self.audit_log)
        if "actorId" in options:
            results = [e for e in results if e.actor_id == options["actorId"]]
        if "action" in options:
            results = [e for e in results if e.action == options["action"]]
        if "target" in options:
            results = [e for e in results if e.target == options["target"]]
        if "from" in options:
            results = [e for e in results if e.timestamp >= options["from"]]
        if "to" in options:
            results = [e for e in results if e.timestamp <= options["to"]]
        limit = options.get("limit", len(results))
        return results[-limit:]

    def export_audit_log(self) -> str:
        import json
        return json.dumps([e.to_dict() for e in self.audit_log], indent=2)
