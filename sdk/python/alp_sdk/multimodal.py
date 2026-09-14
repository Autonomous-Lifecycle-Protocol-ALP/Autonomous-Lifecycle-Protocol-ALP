"""Multi-Modal Protocol & VLA Engine — v82.0.0."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Tuple


# ── Types ──────────────────────────────────────────────────────────────

@dataclass
class MultiModalAsset:
    id: str
    type: str
    uri: str
    resolution: Optional[str] = None
    format: Optional[str] = None


@dataclass
class ActionDefinition:
    name: str
    type: str = "digital"
    safety_level: str = "low"
    requires_confirmation: bool = False
    parameters: Optional[List[Dict[str, Any]]] = None


@dataclass
class AlpMultimodal:
    id: str
    modalities: List[str] = field(default_factory=list)
    assets: List[MultiModalAsset] = field(default_factory=list)
    resolution: Optional[str] = None
    fps: Optional[int] = None
    context_tokens: Optional[int] = None


@dataclass
class AlpActionSpace:
    id: str
    domain: str = "general"
    agent: Optional[str] = None
    actions: List[Any] = field(default_factory=list)
    safety_guards: List[str] = field(default_factory=list)


@dataclass
class AlpVisionModel:
    id: str
    backbone: str = "clip"
    context_tokens: int = 4096
    embedding_dim: Optional[int] = None
    max_resolution: Optional[str] = None
    latency_p95_ms: Optional[int] = None


@dataclass
class MultiModalExecutionResult:
    allowed: bool
    reason: Optional[str] = None
    action_name: str = ""
    safety_level: str = "unknown"
    execution_timestamp: int = 0


@dataclass
class ContextBudgetResult:
    total_tokens: int = 0
    max_context_tokens: int = 8192
    budget_percent: float = 0.0
    remaining_tokens: int = 8192


# ── Engine ─────────────────────────────────────────────────────────────

class MultiModalEngine:
    """Validate and analyze multimodal specifications and action spaces."""

    def validate_multimodal(self, spec: AlpMultimodal) -> Dict[str, Any]:
        errors: List[str] = []
        if not spec.id:
            errors.append("Multimodal spec missing required field: id")
        if not spec.modalities:
            errors.append("Multimodal spec missing required field: modalities")
        for asset in spec.assets:
            if not asset.id:
                errors.append(f"Asset missing required field: id in @multimodal/{spec.id}")
            if not asset.uri:
                errors.append(f"Asset missing required field: uri in @multimodal/{spec.id}")
        total_tokens = self.estimate_token_cost(
            spec.modalities or [],
            spec.assets or [],
            None,
        )
        return {
            "valid": len(errors) == 0,
            "errors": errors,
            "total_tokens_estimate": total_tokens,
        }

    def validate_action_space(self, action_space: AlpActionSpace) -> Dict[str, Any]:
        if not action_space.id:
            return {"valid": False, "critical_action_count": 0}
        actions = action_space.actions or []
        critical_count = 0
        for action in actions:
            if isinstance(action, dict):
                level = action.get("safety_level", "low")
            else:
                level = getattr(action, "safety_level", "low")
            if level == "critical":
                critical_count += 1
        return {
            "valid": True,
            "critical_action_count": critical_count,
        }

    def verify_safety_guards(
        self, action_space: AlpActionSpace, guards: List[str]
    ) -> Dict[str, Any]:
        actions = action_space.actions or []
        blocked: List[str] = []
        for action in actions:
            if isinstance(action, dict):
                level = action.get("safety_level", "low")
                name = action.get("name", "unknown")
                requires_conf = action.get("requires_confirmation", False)
            else:
                level = getattr(action, "safety_level", "low")
                name = getattr(action, "name", "unknown")
                requires_conf = getattr(action, "requires_confirmation", False)
            if level == "critical" and requires_conf and not guards:
                blocked.append(name)
        return {
            "allowed": len(blocked) == 0,
            "blocked_actions": blocked,
            "active_guards": guards,
        }

    def estimate_token_cost(
        self,
        modalities: List[str],
        assets: List[Any],
        vision_model: Optional[AlpVisionModel],
    ) -> int:
        tokens = 0
        max_context = vision_model.context_tokens if vision_model else 8192
        modality_cost = {
            "vision": 512,
            "audio": 256,
            "sensor": 128,
            "text": 1,
            "spatial": 384,
        }
        for modality in modalities:
            tokens += modality_cost.get(modality, 128)
        for asset in assets:
            if isinstance(asset, dict):
                asset_type = asset.get("type", "image")
            else:
                asset_type = getattr(asset, "type", "image")
            tokens += modality_cost.get(asset_type, 128)
        return min(tokens, max_context)


# ── Bridge ─────────────────────────────────────────────────────────────

class MultiModalBridge:
    """Runtime bridge for context budgeting, action execution safety, and stream fusion."""

    def __init__(self) -> None:
        self.engine = MultiModalEngine()

    def estimate_context_budget(
        self,
        spec: AlpMultimodal,
        vision_model: Optional[AlpVisionModel] = None,
        max_context: int = 8192,
    ) -> ContextBudgetResult:
        total_tokens = self.engine.estimate_token_cost(
            spec.modalities or [],
            spec.assets or [],
            vision_model,
        )
        max_context_tokens = vision_model.context_tokens if vision_model else max_context
        budget_percent = min(100.0, (total_tokens / max_context_tokens) * 100)
        remaining_tokens = max(0, max_context_tokens - total_tokens)
        return ContextBudgetResult(
            total_tokens=total_tokens,
            max_context_tokens=max_context_tokens,
            budget_percent=budget_percent,
            remaining_tokens=remaining_tokens,
        )

    def validate_action_execution(
        self,
        action_space: AlpActionSpace,
        action_name: str,
        params: Dict[str, Any] = None,
        confirmed: bool = False,
    ) -> MultiModalExecutionResult:
        if params is None:
            params = {}
        actions = action_space.actions or []
        action = None
        for a in actions:
            if isinstance(a, dict):
                if a.get("name") == action_name:
                    action = a
                    break
            else:
                if getattr(a, "name", None) == action_name:
                    action = a
                    break
        if not action:
            return MultiModalExecutionResult(
                allowed=False,
                reason=f"Action '{action_name}' not defined in action space '{action_space.id}'.",
                action_name=action_name,
                safety_level="unknown",
                execution_timestamp=0,
            )
        if isinstance(action, dict):
            parameters = action.get("parameters") or []
            for param in parameters:
                if param.get("required") and params.get(param.get("name")) is None:
                    return MultiModalExecutionResult(
                        allowed=False,
                        reason=f"Required parameter '{param.get('name')}' is missing for action '{action_name}'.",
                        action_name=action_name,
                        safety_level=action.get("safety_level", "low"),
                        execution_timestamp=0,
                    )
            level = action.get("safety_level", "low")
            requires_conf = action.get("requires_confirmation", False)
        else:
            parameters = getattr(action, "parameters", None) or []
            for param in parameters:
                if param.get("required") and params.get(param.get("name")) is None:
                    return MultiModalExecutionResult(
                        allowed=False,
                        reason=f"Required parameter '{param.get('name')}' is missing for action '{action_name}'.",
                        action_name=action_name,
                        safety_level=getattr(action, "safety_level", "low"),
                        execution_timestamp=0,
                    )
            level = getattr(action, "safety_level", "low")
            requires_conf = getattr(action, "requires_confirmation", False)
        if level == "critical" and requires_conf and not confirmed:
            return MultiModalExecutionResult(
                allowed=False,
                reason=f"Action '{action_name}' is flagged CRITICAL and requires explicit human confirmation.",
                action_name=action_name,
                safety_level=level,
                execution_timestamp=0,
            )
        return MultiModalExecutionResult(
            allowed=True,
            action_name=action_name,
            safety_level=level,
            execution_timestamp=0,
        )

    def fuse_multimodal_streams(
        self,
        text_prompt: str,
        assets: List[Any] = None,
    ) -> Dict[str, Any]:
        if assets is None:
            assets = []
        modalities = set(["text"])
        asset_headers: List[str] = []
        for a in assets:
            if isinstance(a, dict):
                asset_type = a.get("type", "image")
                asset_id = a.get("id", "unknown")
                asset_uri = a.get("uri", "")
                asset_res = a.get("resolution")
            else:
                asset_type = getattr(a, "type", "image")
                asset_id = getattr(a, "id", "unknown")
                asset_uri = getattr(a, "uri", "")
                asset_res = getattr(a, "resolution", None)
            modalities.add(asset_type)
            res_note = f" | Res: {asset_res}" if asset_res else ""
            asset_headers.append(
                f"[Asset: {asset_id} | Type: {asset_type} | URI: {asset_uri}{res_note}]"
            )
        prompt_payload = "\n".join(
            [
                f"=== MULTIMODAL VLA CONTEXT ({len(assets)} ASSETS) ===",
                *asset_headers,
                "=== PROMPT ===",
                text_prompt,
            ]
        )
        return {
            "prompt_payload": prompt_payload,
            "total_assets": len(assets),
            "modalities": sorted(modalities),
        }
