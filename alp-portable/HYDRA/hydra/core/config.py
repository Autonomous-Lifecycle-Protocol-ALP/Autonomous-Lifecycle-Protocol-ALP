from dataclasses import dataclass, field
from pathlib import Path


@dataclass
class HydraConfig:
    root: Path = field(default_factory=lambda: Path.home() / ".hydra")
    data_dir: Path = field(default_factory=lambda: Path.home() / ".hydra" / "data")
    model_dir: Path = field(default_factory=lambda: Path.home() / ".hydra" / "models")
    cache_dir: Path = field(default_factory=lambda: Path.home() / ".hydra" / "cache")
    projects_dir: Path = field(default_factory=lambda: Path.home() / ".hydra" / "projects")
    log_level: str = "INFO"
    max_concurrency: int = 2
    default_timeout: int = 600
    network_enabled: bool = False
    telemetry_enabled: bool = False

    def ensure_dirs(self) -> None:
        for path in [self.root, self.data_dir, self.model_dir, self.cache_dir, self.projects_dir]:
            path.mkdir(parents=True, exist_ok=True)
