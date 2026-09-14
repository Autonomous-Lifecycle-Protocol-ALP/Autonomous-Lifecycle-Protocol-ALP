from __future__ import annotations



class VoicePipeline:
    def __init__(self, model_dir: str = "") -> None:
        self.model_dir = model_dir

    def transcribe(self, audio_path: str) -> str:
        return f"[stt] {audio_path}"

    def synthesize(self, text: str) -> str:
        return f"[tts] {text}"
