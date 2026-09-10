"""Tests for the HYDRA Portable Python boundary."""

from __future__ import annotations

from unittest.mock import MagicMock, patch

from hydra.inference import LocalModelAdapter, ModelCapabilities
from hydra.grpc import HydraDaemonClient
from hydra.protobuf import hydra_pb2


def test_local_model_adapter_infer():
    model = LocalModelAdapter("tiny", "", ModelCapabilities())
    model.load()
    assert model.infer("hello").startswith("[local:tiny]")


def test_grpc_client_run_goal_forwards_to_stub() -> None:
    client = HydraDaemonClient.__new__(HydraDaemonClient)
    client._address = "localhost:50051"
    client._channel = MagicMock()
    client._stub = MagicMock()

    fake_response = hydra_pb2.TaskStarted(task_id="task-123")
    client._stub.RunGoal.return_value = fake_response

    result = client.run_goal("task-123", "build something")

    assert result == "task-123"
    call_request = client._stub.RunGoal.call_args[0][0]
    assert call_request.task_id == "task-123"
    assert call_request.goal == "build something"


def test_grpc_client_stream_events_forwards_to_stub() -> None:
    client = HydraDaemonClient.__new__(HydraDaemonClient)
    client._address = "localhost:50051"
    client._channel = MagicMock()
    client._stub = MagicMock()

    events = [hydra_pb2.Event(tool_started=hydra_pb2.ToolStarted(task_id="1", tool="x"))]
    fake_responses = [hydra_pb2.Event(tool_completed=hydra_pb2.ToolCompleted(tool="x", success=True))]
    client._stub.StreamEvents.return_value = iter(fake_responses)

    result = client.stream_events(events)

    assert len(result) == 1
    assert result[0].tool_completed.tool == "x"
    assert result[0].tool_completed.success is True


def test_grpc_client_generate_forwards_to_stub() -> None:
    client = HydraDaemonClient.__new__(HydraDaemonClient)
    client._address = "localhost:50051"
    client._channel = MagicMock()
    client._stub = MagicMock()

    fake_response = hydra_pb2.InferenceResponse(
        model_id="tiny-cpu",
        text="[stub:tiny-cpu] hello",
        tokens_used=5,
        latency_ms=150,
    )
    client._stub.Generate.return_value = fake_response

    result = client.generate("tiny-cpu", "hello", max_tokens=64, temperature=0.7)

    assert result.model_id == "tiny-cpu"
    assert result.text == "[stub:tiny-cpu] hello"
    call_request = client._stub.Generate.call_args[0][0]
    assert call_request.model_id == "tiny-cpu"
    assert call_request.prompt == "hello"
    assert call_request.max_tokens == 64
    assert abs(call_request.temperature - 0.7) < 1e-3
