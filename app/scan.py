"""Prescription / medicine-strip scanner (needs Gemini vision)."""
import re

from pydantic import BaseModel

from .gemini import GeminiClient
from .schemas import ScanItem, ScanResponse

PROMPT = """You are reading a photo of an Indian prescription or medicine strip/box. List every medicine.
For each: name (brand or generic as written), dose (e.g. '500 mg'), food (the dosing pattern and food timing as written, e.g.
'1-0-1, after food'), slots (subset of morning/afternoon/night derived from the pattern: first digit=morning, second=afternoon, third=night),
and conf (0-1): how sure you are you read it correctly. Handwriting that is hard to read, a guessed word, or a missing dose MUST get conf
below 0.7; append '?' to uncertain text. Never invent a medicine that isn't visible. If the image is not a prescription or medicine, return an empty list."""


class _Item(BaseModel):
    name: str
    dose: str = ""
    food: str = ""
    slots: list[str] = []
    conf: float = 0.5


class _Out(BaseModel):
    items: list[_Item] = []


_PATTERN = re.compile(r"\b([01])\s*[-\u2013\u2014]\s*([01])\s*[-\u2013\u2014]\s*([01])\b")
_SLOTS = ("morning", "afternoon", "night")


def _slots(item: _Item) -> list[str]:
    valid = [s for s in dict.fromkeys(item.slots) if s in _SLOTS]
    if valid:
        return valid
    m = _PATTERN.search(item.food)
    return [s for s, bit in zip(_SLOTS, m.groups()) if bit == "1"] if m else []


async def scan_image(client: GeminiClient, data: bytes, mime: str) -> ScanResponse:
    out = await client.generate_json(_Out, PROMPT, data, mime)
    items = [
        ScanItem(name=i.name.strip(), dose=i.dose.strip(), food=i.food.strip(), slots=_slots(i), conf=round(min(1.0, max(0.0, i.conf)), 2))
        for i in out.items if i.name.strip()
    ]
    return ScanResponse(items=items)
