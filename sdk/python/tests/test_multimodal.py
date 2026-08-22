"""Tests for sdk/python/alp_sdk/multimodal.py"""

import json
import pytest
from alp_sdk.multimodal import (
    MultiModalAsset,
    ActionDefinition,
    AlpMultimodal,
    AlpActionSpace,
    AlpVisionModel,
    MultiModalExecutionResult,
    ContextBudgetResult,
    MultiModalEngine,
    MultiModalBridge,
)


class TestMultiModalTypes:
    def test_multi_modal_asset_defaults(self):
        asset = MultiModalAsset(id="a1", type="image", uri="s3://bucket/a.png")
        assert asset.id == "a1"
        assert asset.type == "image"
        assert asset.uri == "s3://bucket/a.png"
        assert asset.resolution is None
        assert asset.format is None

    def test_action_definition_defaults(self):
        action = ActionDefinition(name="scan")
        assert action.name == "scan"
        assert action.type == "digital"
        assert action.safety_level == "low"
        assert action.requires_confirmation is False
        assert action.parameters is None

    def test_alp_multimodal_defaults(self):
        spec = AlpMultimodal(id="mm-1")
        assert spec.id == "mm-1"
        assert spec.modalities == []
        assert spec.assets == []
        assert spec.resolution is None
        assert spec.fps is None
        assert spec.context_tokens is None

    def test_alp_action_space_defaults(self):
        space = AlpActionSpace(id="as-1")
        assert space.id == "as-1"
        assert space.domain == "general"
        assert space.agent is None
        assert space.actions == []
        assert space.safety_guards == []

    def test_alp_vision_model_defaults(self):
        model = AlpVisionModel(id="vm-1")
        assert model.id == "vm-1"
        assert model.backbone == "clip"
        assert model.context_tokens == 4096
        assert model.embedding_dim is None
        assert model.max_resolution is None
        assert model.latency_p95_ms is None

    def test_multi_modal_execution_result_defaults(self):
        result = MultiModalExecutionResult(allowed=True)
        assert result.allowed is True
        assert result.reason is None
        assert result.action_name == ""
        assert result.safety_level == "unknown"
        assert result.execution_timestamp == 0

    def test_context_budget_result_defaults(self):
        budget = ContextBudgetResult()
        assert budget.total_tokens == 0
        assert budget.max_context_tokens == 8192
        assert budget.budget_percent == 0.0
        assert budget.remaining_tokens == 8192


class TestMultiModalEngine:
    def setup_method(self):
        self.engine = MultiModalEngine()

    def test_validate_multimodal_valid(self):
        spec = AlpMultimodal(
            id="mm-valid",
            modalities=["vision", "audio"],
            assets=[MultiModalAsset(id="cam1", type="image", uri="s3://cam.png")],
        )
        result = self.engine.validate_multimodal(spec)
        assert result["valid"] is True
        assert result["errors"] == []
        assert result["total_tokens_estimate"] > 0

    def test_validate_multimodal_missing_id(self):
        result = self.engine.validate_multimodal(AlpMultimodal(id="", modalities=["vision"]))
        assert result["valid"] is False
        assert any("id" in e for e in result["errors"])

    def test_validate_multimodal_missing_modalities(self):
        spec = AlpMultimodal(id="mm-broken")
        result = self.engine.validate_multimodal(spec)
        assert result["valid"] is False
        assert any("modalities" in e for e in result["errors"])

    def test_validate_multimodal_asset_missing_id(self):
        spec = AlpMultimodal(
            id="mm-1",
            modalities=["vision"],
            assets=[MultiModalAsset(id="", type="image", uri="s3://x.png")],
        )
        result = self.engine.validate_multimodal(spec)
        assert result["valid"] is False
        assert any("Asset missing required field: id" in e for e in result["errors"])

    def test_validate_multimodal_asset_missing_uri(self):
        spec = AlpMultimodal(
            id="mm-1",
            modalities=["vision"],
            assets=[MultiModalAsset(id="a1", type="image", uri="")],
        )
        result = self.engine.validate_multimodal(spec)
        assert result["valid"] is False
        assert any("Asset missing required field: uri" in e for e in result["errors"])

    def test_validate_action_space_counts_critical(self):
        space = AlpActionSpace(
            id="as-drone",
            actions=[
                ActionDefinition(name="takeoff", safety_level="medium"),
                ActionDefinition(name="land", safety_level="low"),
                ActionDefinition(name="self_destruct", safety_level="critical", requires_confirmation=True),
            ],
        )
        result = self.engine.validate_action_space(space)
        assert result["valid"] is True
        assert result["critical_action_count"] == 1

    def test_validate_action_space_missing_id(self):
        result = self.engine.validate_action_space(AlpActionSpace(id=""))
        assert result["valid"] is False
        assert result["critical_action_count"] == 0

    def test_verify_safety_guards_blocks_critical(self):
        space = AlpActionSpace(
            id="as-unsafe",
            actions=[ActionDefinition(name="wipe_db", safety_level="critical", requires_confirmation=True)],
        )
        result = self.engine.verify_safety_guards(space, [])
        assert result["allowed"] is False
        assert "wipe_db" in result["blocked_actions"]

    def test_verify_safety_guards_allows_with_guard(self):
        space = AlpActionSpace(
            id="as-safe",
            actions=[ActionDefinition(name="wipe_db", safety_level="critical", requires_confirmation=False)],
        )
        result = self.engine.verify_safety_guards(space, ["enforce-human-in-the-loop"])
        assert result["allowed"] is True
        assert result["blocked_actions"] == []

    def test_estimate_token_cost_caps_at_context(self):
        model = AlpVisionModel(id="vm-tiny", context_tokens=100)
        tokens = self.engine.estimate_token_cost(
            ["vision", "vision", "vision"],
            [{"id": "a", "type": "image"}, {"id": "b", "type": "video"}],
            model,
        )
        assert tokens <= 100

    def test_estimate_token_cost_unknown_modality(self):
        tokens = self.engine.estimate_token_cost(["unknown_mod"], [], None)
        assert tokens == 128

    def test_estimate_token_cost_empty(self):
        tokens = self.engine.estimate_token_cost([], [], None)
        assert tokens == 0


class TestMultiModalBridge:
    def setup_method(self):
        self.bridge = MultiModalBridge()

    def test_estimate_context_budget_with_model(self):
        spec = AlpMultimodal(
            id="mm-budget",
            modalities=["vision", "spatial"],
            assets=[
                MultiModalAsset(id="lidar-1", type="point_cloud", uri="s3://scan.pcd"),
                MultiModalAsset(id="cam-1", type="image", uri="s3://cam.png"),
            ],
        )
        model = AlpVisionModel(id="vm-small", context_tokens=2048)
        budget = self.bridge.estimate_context_budget(spec, model)
        assert budget.total_tokens > 0
        assert budget.max_context_tokens == 2048
        assert budget.budget_percent > 0
        assert budget.remaining_tokens >= 0

    def test_estimate_context_budget_default_max(self):
        spec = AlpMultimodal(id="mm-default", modalities=["vision"])
        budget = self.bridge.estimate_context_budget(spec)
        assert budget.max_context_tokens == 8192

    def test_validate_action_execution_missing_action(self):
        space = AlpActionSpace(id="as-missing", actions=[])
        result = self.bridge.validate_action_execution(space, "ghost")
        assert result.allowed is False
        assert "not defined" in result.reason

    def test_validate_action_execution_missing_required_param(self):
        space = AlpActionSpace(
            id="as-param",
            actions=[
                ActionDefinition(
                    name="rotate",
                    parameters=[{"name": "degrees", "type": "number", "required": True}],
                )
            ],
        )
        result = self.bridge.validate_action_execution(space, "rotate", {})
        assert result.allowed is False
        assert "degrees" in result.reason

    def test_validate_action_execution_success(self):
        space = AlpActionSpace(
            id="as-ok",
            actions=[ActionDefinition(name="scan", safety_level="low")],
        )
        result = self.bridge.validate_action_execution(space, "scan", {})
        assert result.allowed is True

    def test_validate_action_execution_critical_needs_confirmation(self):
        space = AlpActionSpace(
            id="as-critical",
            actions=[ActionDefinition(name="deploy", safety_level="critical", requires_confirmation=True)],
        )
        result = self.bridge.validate_action_execution(space, "deploy", {}, False)
        assert result.allowed is False
        assert "requires explicit human confirmation" in result.reason

    def test_validate_action_execution_critical_with_confirmation(self):
        space = AlpActionSpace(
            id="as-critical-ok",
            actions=[ActionDefinition(name="deploy", safety_level="critical", requires_confirmation=True)],
        )
        result = self.bridge.validate_action_execution(space, "deploy", {}, True)
        assert result.allowed is True

    def test_fuse_multimodal_streams_basic(self):
        result = self.bridge.fuse_multimodal_streams("Analyze defects", [
            MultiModalAsset(id="img-1", type="image", uri="s3://img.png"),
            MultiModalAsset(id="audio-1", type="audio", uri="s3://audio.wav"),
        ])
        assert result["total_assets"] == 2
        assert "text" in result["modalities"]
        assert "image" in result["modalities"]
        assert "audio" in result["modalities"]
        assert "MULTIMODAL VLA CONTEXT" in result["prompt_payload"]
        assert "Analyze defects" in result["prompt_payload"]

    def test_fuse_multimodal_streams_empty(self):
        result = self.bridge.fuse_multimodal_streams("Hello", [])
        assert result["total_assets"] == 0
        assert result["modalities"] == ["text"]
        assert "Asset:" not in result["prompt_payload"]

    def test_fuse_multimodal_streams_with_resolution(self):
        result = self.bridge.fuse_multimodal_streams("Check", [
            MultiModalAsset(id="cam", type="image", uri="s3://cam.png", resolution="1920x1080"),
        ])
        assert "Res: 1920x1080" in result["prompt_payload"]

    def test_fuse_multimodal_streams_dict_assets(self):
        result = self.bridge.fuse_multimodal_streams("Test", [
            {"id": "d1", "type": "image", "uri": "s3://d.png"},
        ])
        assert result["total_assets"] == 1
        assert "image" in result["modalities"]
