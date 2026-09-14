from __future__ import annotations

import argparse
import sys

from hydra.core.config import HydraConfig
from hydra.core.hardware import detect_hardware
from hydra.core.orchestrator import Orchestrator
from hydra.runtime.selector import select_model


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(prog="hydra", description="HYDRA Portable")
    parser.add_argument("goal", nargs="?", help="Task goal to run")
    parser.add_argument("--config", default="", help="Path to config file")
    parser.add_argument("--dry-run", action="store_true", help="Plan only")
    args = parser.parse_args(argv)

    config = HydraConfig()
    config.ensure_dirs()

    hardware = detect_hardware()
    model = select_model(hardware)
    model.load()

    orchestrator = Orchestrator(model=model, hardware=hardware)

    if args.dry_run or not args.goal:
        print(f"HYDRA ready. Detected {hardware.cpu_cores} CPU cores, {hardware.available_ram_mb} MB RAM available.")
        print(f"Selected model: {model.name}")
        return 0

    task_id = orchestrator.run_goal(args.goal)
    print(f"Started task {task_id}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
