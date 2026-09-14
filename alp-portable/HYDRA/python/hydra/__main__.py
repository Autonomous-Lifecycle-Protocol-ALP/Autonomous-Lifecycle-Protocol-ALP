"""HYDRA Portable — Python AI/ML boundary."""

from __future__ import annotations

import argparse
import asyncio
import sys

from hydra.grpc import HydraDaemonClient
from hydra.inference import GenerationRequest, LocalModelAdapter, Modality, ResourceBudget


def main() -> int:
    parser = argparse.ArgumentParser(prog="hydra")
    parser.add_argument("--version", action="version", version="hydra-portable 0.1.0")
    subparsers = parser.add_subparsers(dest="command")

    subparsers.add_parser("infer", help="Run a quick local inference check")
    subparsers.add_parser("info", help="Show Python boundary info")

    daemon_parser = subparsers.add_parser("daemon", help="Interact with the HYDRA daemon via gRPC")
    daemon_sub = daemon_parser.add_subparsers(dest="daemon_command")

    run_goal_parser = daemon_sub.add_parser("run-goal", help="Submit a goal to the daemon")
    run_goal_parser.add_argument("goal", help="Goal description")
    run_goal_parser.add_argument("--addr", default="localhost:50051", help="Daemon gRPC address")

    stream_parser = daemon_sub.add_parser("stream-events", help="Stream events to the daemon")
    stream_parser.add_argument("--addr", default="localhost:50051", help="Daemon gRPC address")
    stream_parser.add_argument("--count", type=int, default=5, help="Number of synthetic events to send")

    args = parser.parse_args()

    if args.command == "infer":
        adapter = LocalModelAdapter("demo-model", "demo-backend")
        adapter.load()

        request = GenerationRequest(
            prompt="Hello from HYDRA Python boundary",
            modality=Modality.TEXT,
            resource_budget=ResourceBudget(max_ram_mb=4096, max_cpu_percent=80, timeout_seconds=60),
        )

        result = adapter.generate(request)
        print(result.output_text or str(result.output_path or ""))
        return 0

    if args.command == "info":
        print("HYDRA Portable Python boundary")
        print(f"Python: {sys.version}")
        return 0

    if args.command == "daemon":
        client = HydraDaemonClient(address=args.addr)

        if args.daemon_command == "run-goal":
            try:
                task_id = client.run_goal("", args.goal)
            except Exception as exc:  # noqa: BLE001
                print(f"gRPC RunGoal failed: {exc}", file=sys.stderr)
                return 1
            else:
                print(f"Task started: {task_id}")
                return 0

        if args.daemon_command == "stream-events":
            from hydra.protobuf import hydra_pb2

            events = [
                hydra_pb2.Event(
                    tool_started=hydra_pb2.ToolStarted(task_id=f"python-{i}", tool="python-stream")
                )
                for i in range(args.count)
            ]
            try:
                responses = client.stream_events(events)
            except Exception as exc:  # noqa: BLE001
                print(f"gRPC StreamEvents failed: {exc}", file=sys.stderr)
                return 1
            else:
                for response in responses:
                    print(f"Received event: {response}")
                return 0

        daemon_parser.print_help()
        return 0

    parser.print_help()
    return 0


if __name__ == "__main__":
    sys.exit(main())

