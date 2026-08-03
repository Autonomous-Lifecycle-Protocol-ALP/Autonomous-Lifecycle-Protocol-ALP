import pytest
from alp_sdk.cost_budget import CostBudgetEngine


def test_create_and_track_budget():
    engine = CostBudgetEngine()
    b = engine.create_budget("task-1", 5000, 0.02)

    assert b.id == "budget-task-1"
    assert b.max_tokens == 5000

    res = engine.track_usage(b.id, 1000, 0.005)
    assert res["remaining_tokens"] == 4000
    assert not res["is_exceeded"]


def test_model_selection_router():
    engine = CostBudgetEngine()
    route = engine.select_optimal_model("high", 0.20)
    assert route["model"] == "claude-3-5-sonnet"
