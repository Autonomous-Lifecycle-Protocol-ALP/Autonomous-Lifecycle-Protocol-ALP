"""ALP IntelligenceEngine — IDE Intelligence (v45.0.0 — Python SDK parity)."""

from __future__ import annotations

import time
from typing import Any, Dict, List, Optional


class SmartSuggestion:
    def __init__(
        self,
        suggestion_id: str,
        suggestion_type: str,
        label: str,
        description: str,
        confidence: float,
        payload: Optional[Dict[str, Any]] = None,
    ):
        self.id = suggestion_id
        self.type = suggestion_type
        self.label = label
        self.description = description
        self.confidence = confidence
        self.payload = payload or {}

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "type": self.type,
            "label": self.label,
            "description": self.description,
            "confidence": self.confidence,
            "payload": self.payload,
        }


class DiagnosisResult:
    def __init__(
        self,
        result_id: str,
        error: str,
        likely_cause: str,
        suggestions: List[str],
        severity: str,
        auto_fix: Optional[Dict[str, Any]] = None,
    ):
        self.id = result_id
        self.error = error
        self.likely_cause = likely_cause
        self.suggestions = suggestions
        self.severity = severity
        self.auto_fix = auto_fix

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "error": self.error,
            "likely_cause": self.likely_cause,
            "suggestions": self.suggestions,
            "severity": self.severity,
            "auto_fix": self.auto_fix,
        }


class PredictionResult:
    def __init__(
        self,
        result_id: str,
        object_id: str,
        predicted_status: str,
        confidence: float,
        risk_factors: List[str],
        estimated_completion_ms: Optional[float] = None,
    ):
        self.id = result_id
        self.object_id = object_id
        self.predicted_status = predicted_status
        self.confidence = confidence
        self.risk_factors = risk_factors
        self.estimated_completion_ms = estimated_completion_ms

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "object_id": self.object_id,
            "predicted_status": self.predicted_status,
            "confidence": self.confidence,
            "risk_factors": self.risk_factors,
            "estimated_completion_ms": self.estimated_completion_ms,
        }


class ReviewFinding:
    def __init__(
        self,
        finding_id: str,
        object_id: str,
        kind: str,
        message: str,
        severity: str,
        suggestion: Optional[str] = None,
    ):
        self.id = finding_id
        self.object_id = object_id
        self.kind = kind
        self.message = message
        self.severity = severity
        self.suggestion = suggestion

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "object_id": self.object_id,
            "kind": self.kind,
            "message": self.message,
            "severity": self.severity,
            "suggestion": self.suggestion,
        }


class IntelligenceEngine:
    def __init__(self) -> None:
        self.suggestions: List[SmartSuggestion] = []
        self.findings: List[ReviewFinding] = []

    def suggest_next(self, objects: List[Dict[str, Any]]) -> List[SmartSuggestion]:
        self.suggestions = []
        ids = {o.get("id") for o in objects}
        types = {o.get("_type") or o.get("type") for o in objects}

        has_goal = "goal" in types or "project" in types
        has_task = "task" in types
        has_agent = "agent" in types
        has_workflow = "workflow" in types
        has_policy = "policy" in types
        has_contract = "contract" in types

        if not has_goal:
            self.suggestions.append(SmartSuggestion(
                "suggest-1", "object", "Create a @goal",
                "No goal found. Define a high-level goal to anchor the workspace.",
                0.95, {"template": "goal"},
            ))

        if has_goal and not has_task:
            self.suggestions.append(SmartSuggestion(
                "suggest-2", "object", "Create @task entries",
                "Goal exists but no tasks are defined. Break the goal into actionable tasks.",
                0.9, {"template": "task"},
            ))

        if has_task and not has_agent:
            self.suggestions.append(SmartSuggestion(
                "suggest-3", "object", "Define @agent roles",
                "Tasks exist but no agents are assigned. Define agent roles to execute work.",
                0.85, {"template": "agent"},
            ))

        if has_task and not has_workflow:
            self.suggestions.append(SmartSuggestion(
                "suggest-4", "workflow", "Add a @workflow",
                "Tasks exist but no workflow orchestrates them. Add a workflow to sequence execution.",
                0.8, {"template": "workflow"},
            ))

        if has_agent and not has_policy:
            self.suggestions.append(SmartSuggestion(
                "suggest-5", "object", "Add @policy guardrails",
                "Agents exist but no policies constrain actions. Add policies for safety and compliance.",
                0.7, {"template": "policy"},
            ))

        if has_workflow and not has_contract:
            self.suggestions.append(SmartSuggestion(
                "suggest-6", "object", "Add @contract checks",
                "Workflow exists but no contracts verify outputs. Add contracts for quality gates.",
                0.65, {"template": "contract"},
            ))

        blocked_tasks = [o for o in objects if o.get("status") == "[!]"]
        if blocked_tasks:
            self.suggestions.append(SmartSuggestion(
                "suggest-7", "fix", "Resolve blocked tasks",
                f"{len(blocked_tasks)} task(s) are blocked. Investigate blockers before adding new work.",
                0.9, {"blocked_ids": [t.get("id") for t in blocked_tasks]},
            ))

        return self.suggestions

    def diagnose(self, error: str) -> DiagnosisResult:
        lowered = error.lower()
        likely_cause = "Unknown error"
        suggestions: List[str] = []
        severity = "error"

        if "cycle" in lowered or "circular" in lowered:
            likely_cause = "Dependency cycle detected in the project graph."
            suggestions = [
                "Review @depends_on directives for circular references.",
                "Use the graph API to visualize the dependency graph.",
                "Remove or restructure the circular dependency.",
            ]
        elif "missing" in lowered or "not found" in lowered:
            likely_cause = "Referenced object or file does not exist."
            suggestions = [
                "Verify the referenced ID exists in the workspace.",
                "Check for typos in @depends_on or import statements.",
                "Run validate_workspace() to find missing references.",
            ]
        elif "validation" in lowered or "invalid" in lowered:
            likely_cause = "Object failed schema validation."
            suggestions = [
                "Check required fields are present.",
                "Verify field types match the schema (string, int, bool, list).",
                "Run validate_workspace() for detailed schema errors.",
            ]
        elif "permission" in lowered or "denied" in lowered:
            likely_cause = "Policy or permission check blocked the operation."
            suggestions = [
                "Review @policy rules governing the target path or action.",
                "Check agent role permissions.",
                "Use the policy engine to debug.",
            ]
        elif "timeout" in lowered or "timed out" in lowered:
            likely_cause = "Operation exceeded the allowed time limit."
            suggestions = [
                "Increase timeout in the runner configuration.",
                "Check for infinite loops in workflow definitions.",
                "Verify network connectivity for remote operations.",
            ]
        elif "parse" in lowered or "syntax" in lowered:
            likely_cause = "Syntax error in .alp file."
            suggestions = [
                "Check indentation (use 2 spaces per level).",
                "Verify object headers use @object_name syntax.",
                "Ensure all strings are properly quoted.",
            ]

        return DiagnosisResult(
            f"diag-{time.time()}",
            error,
            likely_cause,
            suggestions,
            severity,
        )

    def predict_outcome(self, object_id: str, objects: List[Dict[str, Any]]) -> Optional[PredictionResult]:
        target = None
        for o in objects:
            if o.get("id") == object_id:
                target = o
                break
        if not target:
            return None

        deps = target.get("depends_on") or []
        dep_objects = [o for o in objects if o.get("id") in deps]
        done_deps = sum(1 for o in dep_objects if o.get("status") == "[x]")
        blocked_deps = sum(1 for o in dep_objects if o.get("status") == "[!]")

        confidence = 0.5
        predicted_status = "in-progress"
        risk_factors: List[str] = []

        if not deps:
            confidence = 0.8
            predicted_status = target.get("status", "[ ]")
        elif done_deps == len(deps):
            confidence = 0.85
            predicted_status = "ready" if target.get("status") == "[ ]" else target.get("status", "[ ]")
        elif blocked_deps > 0:
            confidence = 0.2
            predicted_status = "blocked"
            risk_factors.append(f"{blocked_deps} blocked dependency/ies")
        elif done_deps < len(deps):
            confidence = 0.4 + done_deps / len(deps) * 0.3
            predicted_status = "in-progress"
            risk_factors.append(f"{len(deps) - done_deps} incomplete dependency/ies")

        priority = target.get("priority")
        if priority in ("critical", "high") and blocked_deps > 0:
            risk_factors.append("High priority with blocked dependencies")
            confidence = max(0.1, confidence - 0.2)

        estimated_completion_ms = (len(deps) - done_deps) * 86400000 if deps else None

        return PredictionResult(
            f"pred-{time.time()}",
            object_id,
            predicted_status,
            round(confidence, 2),
            risk_factors,
            estimated_completion_ms,
        )

    def review(self, objects: List[Dict[str, Any]]) -> List[ReviewFinding]:
        self.findings = []
        counter = 0

        for obj in objects:
            obj_id = obj.get("id", "unnamed")

            if not obj.get("description") and not obj.get("title"):
                self.findings.append(ReviewFinding(
                    f"review-{counter + 1}", obj_id, "missing_field",
                    f"Missing description for {(obj.get('_type') or obj.get('type') or 'object')} \"{obj_id}\".",
                    "warn", "Add a description field to explain the purpose of this object.",
                ))
                counter += 1

            if (obj.get("_type") == "task" or obj.get("type") == "task") and not obj.get("agent"):
                self.findings.append(ReviewFinding(
                    f"review-{counter + 1}", obj_id, "risk",
                    f"Task \"{obj_id}\" has no assigned agent.",
                    "warn", "Assign an agent or use a default agent role.",
                ))
                counter += 1

            if obj.get("status") == "[!]" and not obj.get("details"):
                self.findings.append(ReviewFinding(
                    f"review-{counter + 1}", obj_id, "missing_field",
                    f"Blocked task \"{obj_id}\" lacks details explaining the blocker.",
                    "error", "Add a details or comment explaining why this task is blocked.",
                ))
                counter += 1

            deps = obj.get("depends_on") or []
            for dep in deps:
                if not any(o.get("id") == dep for o in objects):
                    self.findings.append(ReviewFinding(
                        f"review-{counter + 1}", obj_id, "risk",
                        f"Dependency \"{dep}\" on \"{obj_id}\" does not exist in the workspace.",
                        "error", f"Create the missing dependency or remove it from depends_on.",
                    ))
                    counter += 1

        return self.findings
