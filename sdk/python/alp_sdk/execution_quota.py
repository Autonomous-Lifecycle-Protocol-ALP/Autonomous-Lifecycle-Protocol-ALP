"""ALP Resource Governance: execution quotas (v88.0.0)."""
from __future__ import annotations

from datetime import datetime, timezone
from typing import Dict, Any, Optional


class ExecutionQuota:
    def __init__(
        self,
        quota_id: str,
        max_executions: int,
        window_ms: int,
        used: int = 0,
        reset_at: Optional[str] = None,
        created_at: Optional[str] = None,
    ):
        self.id = quota_id
        self.max_executions = max_executions
        self.window_ms = window_ms
        self.used = used
        self.reset_at = reset_at or (datetime.now(timezone.utc).timestamp() * 1000 + window_ms)
        self.created_at = created_at or datetime.now(timezone.utc).isoformat()

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "max_executions": self.max_executions,
            "window_ms": self.window_ms,
            "used": self.used,
            "reset_at": self.reset_at,
            "created_at": self.created_at,
        }


class ExecutionQuotaEngine:
    def __init__(self):
        self.quotas: Dict[str, ExecutionQuota] = {}

    def create_quota(self, quota_id: str, max_executions: int, window_ms: int) -> ExecutionQuota:
        quota = ExecutionQuota(
            quota_id=quota_id,
            max_executions=max_executions,
            window_ms=window_ms,
        )
        self.quotas[quota_id] = quota
        return quota

    def check_quota(self, quota_id: str) -> Dict[str, Any]:
        quota = self.quotas.get(quota_id)
        if not quota:
            return {"allowed": False, "remaining": 0, "reset_at": ""}

        now = datetime.now(timezone.utc).timestamp() * 1000
        if now >= quota.reset_at:
            quota.used = 0
            quota.reset_at = now + quota.window_ms

        remaining = max(0, quota.max_executions - quota.used)
        return {
            "allowed": quota.used < quota.max_executions,
            "remaining": remaining,
            "reset_at": quota.reset_at,
        }

    def record_execution(self, quota_id: str) -> Dict[str, Any]:
        quota = self.quotas.get(quota_id)
        if not quota:
            return {"allowed": False, "remaining": 0}

        self.check_quota(quota_id)
        quota.used += 1
        remaining = max(0, quota.max_executions - quota.used)
        return {
            "allowed": quota.used <= quota.max_executions,
            "remaining": remaining,
        }

    def get_quota(self, quota_id: str) -> Optional[ExecutionQuota]:
        return self.quotas.get(quota_id)

    def reset_quota(self, quota_id: str) -> None:
        quota = self.quotas.get(quota_id)
        if quota:
            quota.used = 0
            quota.reset_at = datetime.now(timezone.utc).timestamp() * 1000 + quota.window_ms
