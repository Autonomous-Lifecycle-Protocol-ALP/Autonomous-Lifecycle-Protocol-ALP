from __future__ import annotations


from hydra.core.hardware import HardwareProfile
from hydra.runtime.local import ModelCapabilities, LocalModelAdapter


def select_model(hardware: HardwareProfile) -> LocalModelAdapter:
    if hardware.available_ram_mb < 4096:
        return LocalModelAdapter(
            name="tiny-cpu",
            model_path="",
            capabilities=ModelCapabilities(max_context=2048, quantization="q4_0"),
        )
    if hardware.available_ram_mb < 8192:
        return LocalModelAdapter(
            name="small-cpu",
            model_path="",
            capabilities=ModelCapabilities(max_context=4096, quantization="q4_k_m"),
        )
    return LocalModelAdapter(
        name="medium-cpu",
        model_path="",
        capabilities=ModelCapabilities(max_context=8192, quantization="q5_k_m"),
    )
