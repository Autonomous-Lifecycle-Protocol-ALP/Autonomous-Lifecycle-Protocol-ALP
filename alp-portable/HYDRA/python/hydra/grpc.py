"""gRPC client for communicating with the HYDRA daemon."""

from __future__ import annotations

import asyncio
import contextlib
from typing import AsyncIterator

import grpc

from hydra.protobuf import hydra_pb2, hydra_pb2_grpc


class HydraDaemonClient:
    """Async-friendly wrapper around the generated gRPC stub."""

    def __init__(self, address: str = "localhost:50051") -> None:
        self._address = address
        self._channel = grpc.insecure_channel(address)
        self._stub = hydra_pb2_grpc.HydraDaemonStub(self._channel)

    @property
    def address(self) -> str:
        return self._address

    def run_goal(self, task_id: str, goal: str, timeout: float | None = None) -> str:
        """Submit a goal to the daemon and return the assigned task ID."""
        request = hydra_pb2.TaskCreated(task_id=task_id, goal=goal)
        metadata = (("timeout", str(timeout)),) if timeout is not None else None
        response = self._stub.RunGoal(request, metadata=metadata)
        return response.task_id

    def generate(
        self,
        model_id: str,
        prompt: str,
        max_tokens: int = 128,
        temperature: float = 0.7,
        timeout: float | None = None,
    ) -> hydra_pb2.InferenceResponse:
        """Run inference against a loaded model on the daemon."""
        request = hydra_pb2.InferenceRequest(
            model_id=model_id,
            prompt=prompt,
            max_tokens=max_tokens,
            temperature=temperature,
        )
        metadata = (("timeout", str(timeout)),) if timeout is not None else None
        return self._stub.Generate(request, metadata=metadata)

    async def run_goal_async(self, task_id: str, goal: str, timeout: float | None = None) -> str:
        """Async version of :meth:`run_goal`."""
        return await asyncio.get_running_loop().run_in_executor(
            None, lambda: self.run_goal(task_id, goal, timeout)
        )

    async def generate_async(
        self,
        model_id: str,
        prompt: str,
        max_tokens: int = 128,
        temperature: float = 0.7,
        timeout: float | None = None,
    ) -> hydra_pb2.InferenceResponse:
        """Async version of :meth:`generate`."""
        return await asyncio.get_running_loop().run_in_executor(
            None, lambda: self.generate(model_id, prompt, max_tokens, temperature, timeout)
        )

    def stream_events(
        self, events: list[hydra_pb2.Event], timeout: float | None = None
    ) -> list[hydra_pb2.Event]:
        """Send a batch of events and return the daemon responses."""
        metadata = (("timeout", str(timeout)),) if timeout is not None else None
        responses = list(self._stub.StreamEvents(iter(events), metadata=metadata))
        return responses

    async def stream_events_async(
        self, events: list[hydra_pb2.Event], timeout: float | None = None
    ) -> list[hydra_pb2.Event]:
        """Async version of :meth:`stream_events`."""
        return await asyncio.get_running_loop().run_in_executor(
            None, lambda: self.stream_events(events, timeout)
        )

    @contextlib.contextmanager
    def channel_context(self):  # pragma: no cover - simple wrapper
        """Context manager that ensures the channel is closed on exit."""
        try:
            yield self._channel
        finally:
            self._channel.close()

    def close(self) -> None:
        self._channel.close()
