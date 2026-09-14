import os
import platform
from dataclasses import dataclass
from pathlib import Path
from typing import Optional


@dataclass
class HardwareProfile:
    cpu_cores: int
    total_ram_mb: int
    available_ram_mb: int
    cpu_model: str
    os: str
    arch: str
    has_gpu: bool = False
    gpu_name: Optional[str] = None
    disk_free_gb: float = 0.0


def _get_memory() -> tuple[int, int]:
    try:
        import psutil
        mem = psutil.virtual_memory()
        return mem.total // (1024 * 1024), mem.available // (1024 * 1024)
    except Exception:
        return 0, 0


def _get_disk_free() -> float:
    try:
        import shutil
        usage = shutil.disk_usage(str(Path.home()))
        return usage.free / (1024**3)
    except Exception:
        return 0.0


def detect_hardware() -> HardwareProfile:
    cpu_cores = os.cpu_count() or 1
    total_mb, avail_mb = _get_memory()
    return HardwareProfile(
        cpu_cores=cpu_cores,
        total_ram_mb=total_mb,
        available_ram_mb=avail_mb,
        cpu_model=platform.processor() or platform.machine(),
        os=platform.system(),
        arch=platform.machine(),
        has_gpu=False,
        disk_free_gb=_get_disk_free(),
    )
