"""Thin async wrapper around google-genai so the rest of the app doesn't depend on the SDK."""
import asyncio
import logging
from typing import Type, TypeVar

from pydantic import BaseModel

log = logging.getLogger("carelens.gemini")
T = TypeVar("T", bound=BaseModel)


class GeminiUnavailable(RuntimeError):
    """Raised for any failure talking to Gemini (network, quota, blocked, bad JSON)."""


class GeminiClient:
    def __init__(self, api_key: str, model: str, timeout_s: float = 45.0):
        from google import genai  # imported lazily so offline mode works without credentials
        self._genai = genai
        self._client = genai.Client(api_key=api_key)
        self.model = model
        self.timeout_s = timeout_s

    async def _call(self, contents, config):
        try:
            resp = await asyncio.wait_for(
                self._client.aio.models.generate_content(model=self.model, contents=contents, config=config),
                timeout=self.timeout_s,
            )
        except asyncio.TimeoutError as e:
            raise GeminiUnavailable(f"Gemini timed out after {self.timeout_s:g}s") from e
        except Exception as e:  # SDK raises many types; callers only need "it failed"
            raise GeminiUnavailable(f"{type(e).__name__}: {e}") from e
        return resp

    async def generate_json(self, schema: Type[T], prompt: str, data: bytes | None = None, mime: str | None = None) -> T:
        from google.genai import types
        parts = []
        if data is not None:
            parts.append(types.Part.from_bytes(data=data, mime_type=mime or "application/octet-stream"))
        parts.append(prompt)
        cfg = types.GenerateContentConfig(response_mime_type="application/json", response_schema=schema, temperature=0.1)
        resp = await self._call(parts, cfg)
        try:
            if isinstance(resp.parsed, schema):
                return resp.parsed
            return schema.model_validate_json(resp.text or "")
        except Exception as e:
            raise GeminiUnavailable(f"bad structured output: {e}") from e

    async def generate_text(self, system: str, prompt: str) -> str:
        from google.genai import types
        cfg = types.GenerateContentConfig(system_instruction=system, temperature=0.3, max_output_tokens=700)
        resp = await self._call(prompt, cfg)
        text = (resp.text or "").strip()
        if not text:
            raise GeminiUnavailable("empty response (possibly blocked by safety filters)")
        return text
