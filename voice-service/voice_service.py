"""Profile-based HTTP voice service for the Live2D desktop pet."""

import argparse
import json
import os
import sys
import threading
from io import BytesIO
from pathlib import Path
from typing import Literal, Optional


SCRIPT_DIR = Path(__file__).resolve().parent


def load_config(path: Path, root_override: Optional[str] = None) -> tuple[dict, Path]:
    with path.open("r", encoding="utf-8") as file:
        config = json.load(file)
    root = Path(root_override or config["gptSovitsRoot"])
    if not root.is_absolute():
        root = (path.parent / root).resolve()
    if not root.is_dir():
        raise FileNotFoundError(f"GPT-SoVITS directory not found: {root}")
    return config, root


parser = argparse.ArgumentParser(description="Live2D GPT-SoVITS voice service")
parser.add_argument("--config", default=str(SCRIPT_DIR / "voice.config.json"))
parser.add_argument("--gpt-sovits-root", default=None)
args = parser.parse_args()
CONFIG_PATH = Path(args.config).resolve()
CONFIG, GPT_SOVITS_ROOT = load_config(CONFIG_PATH, args.gpt_sovits_root)

# GPT-SoVITS resolves model paths from the current working directory.
os.chdir(GPT_SOVITS_ROOT)
sys.path.insert(0, str(GPT_SOVITS_ROOT))
sys.path.insert(0, str(GPT_SOVITS_ROOT / "GPT_SoVITS"))

import soundfile as sf  # noqa: E402
import uvicorn  # noqa: E402
from fastapi import FastAPI, HTTPException  # noqa: E402
from fastapi.middleware.cors import CORSMiddleware  # noqa: E402
from fastapi.responses import Response  # noqa: E402
from pydantic import BaseModel  # noqa: E402

from GPT_SoVITS.TTS_infer_pack.TTS import TTS, TTS_Config  # noqa: E402


def root_path(value: str) -> str:
    path = Path(value)
    return str(path if path.is_absolute() else (GPT_SOVITS_ROOT / path).resolve())


def service_path(value: str) -> str:
    path = Path(value)
    return str(path if path.is_absolute() else (CONFIG_PATH.parent / path).resolve())


PROFILE = CONFIG["profile"]
REFERENCE_AUDIO = root_path(PROFILE["referenceAudio"])
TTS_CONFIG_PATH = service_path(CONFIG.get("ttsConfig", "tts_infer.yaml"))
if not Path(REFERENCE_AUDIO).is_file():
    raise FileNotFoundError(f"Reference audio not found: {REFERENCE_AUDIO}")
if not Path(TTS_CONFIG_PATH).is_file():
    raise FileNotFoundError(f"TTS config not found: {TTS_CONFIG_PATH}")

print(f"Loading voice profile: {PROFILE.get('name', 'default')}")
print(f"Reference audio: {REFERENCE_AUDIO}")
TTS_PIPELINE = TTS(TTS_Config(TTS_CONFIG_PATH))
INFERENCE_LOCK = threading.Lock()

APP = FastAPI(title="Live2D Voice Service", version="1.0.0")
APP.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


class SpeechRequest(BaseModel):
    input: str
    language: Literal["zh", "ja", "en"] = "zh"
    speed: float = 1.0
    model: str = "gpt-sovits"
    voice: str = "default"
    response_format: Literal["wav"] = "wav"


@APP.get("/health")
def health() -> dict:
    return {
        "status": "ok",
        "voice": PROFILE.get("name", "default"),
        "languages": ["zh", "ja", "en"],
    }


@APP.get("/v1/voices")
def voices() -> dict:
    return {
        "voices": [
            {
                "id": "default",
                "name": PROFILE.get("name", "default"),
                "languages": ["zh", "ja", "en"],
            }
        ]
    }


@APP.post("/v1/audio/speech")
def speech(request: SpeechRequest) -> Response:
    text = request.input.strip()
    if not text:
        raise HTTPException(status_code=400, detail="input cannot be empty")
    if len(text) > 1200:
        raise HTTPException(status_code=400, detail="input is longer than 1200 characters")

    inference = {
        "text": text,
        "text_lang": request.language,
        "ref_audio_path": REFERENCE_AUDIO,
        "aux_ref_audio_paths": [],
        "prompt_text": PROFILE["referenceText"],
        "prompt_lang": PROFILE.get("referenceLanguage", "ja"),
        "top_k": 15,
        "top_p": 1.0,
        "temperature": 1.0,
        "text_split_method": "cut5",
        "batch_size": 1,
        "batch_threshold": 0.75,
        "split_bucket": True,
        "speed_factor": min(1.5, max(0.6, request.speed)),
        "fragment_interval": 0.3,
        "seed": -1,
        "parallel_infer": True,
        "repetition_penalty": 1.35,
        "sample_steps": 32,
        "super_sampling": False,
        "streaming_mode": False,
        "return_fragment": False,
        "fixed_length_chunk": False,
    }

    try:
        with INFERENCE_LOCK:
            sample_rate, audio = next(TTS_PIPELINE.run(inference))
        output = BytesIO()
        sf.write(output, audio, sample_rate, format="WAV")
        return Response(
            output.getvalue(),
            media_type="audio/wav",
            headers={"Cache-Control": "no-store"},
        )
    except Exception as error:
        raise HTTPException(status_code=500, detail=f"speech synthesis failed: {error}") from error


if __name__ == "__main__":
    server = CONFIG.get("server", {})
    uvicorn.run(
        APP,
        host=server.get("host", "127.0.0.1"),
        port=int(server.get("port", 9880)),
        workers=1,
    )
