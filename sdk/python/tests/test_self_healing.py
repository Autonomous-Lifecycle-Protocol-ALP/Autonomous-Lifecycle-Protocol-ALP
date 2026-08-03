import pytest
from alp_sdk.self_healing import SelfHealingEngine


def test_diagnose_empty_status():
    engine = SelfHealingEngine()
    content = "@task\n  id: t1\n  status: "
    diags = engine.diagnose(content)
    assert any("Empty status" in d.message for d in diags)


def test_auto_patch_empty_status():
    engine = SelfHealingEngine()
    content = "@task\n  id: t1\n  status: "
    patches = engine.generate_patches(content)
    healed = engine.apply_patches(content, patches)
    assert "status: [ ]" in healed
