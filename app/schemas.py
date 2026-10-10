from typing import Literal, Optional

from pydantic import BaseModel, Field

Lang = Literal["en", "hi"]
Slot = Literal["morning", "afternoon", "night"]


class MedContext(BaseModel):
    name: str
    dose: str = ""
    slots: list[Slot] = []
    food: str = ""


class ChatRequest(BaseModel):
    question: str = Field(min_length=1, max_length=2000)
    lang: Lang = "en"
    # Optional extras the frontend may send later for better answers.
    meds: list[MedContext] = []
    labs: list[dict] = []


class ChatResponse(BaseModel):
    reply: str
    source: Literal["gemini", "rules"]


class LabValue(BaseModel):
    """Same shape as `labValues` in the frontend mockData.js."""
    id: str
    name: str
    unit: str = ""
    prev: Optional[float] = None
    curr: float
    refLow: Optional[float] = None
    refHigh: Optional[float] = None
    min: float
    max: float
    en: str
    hi: str


class AnalyzeResponse(BaseModel):
    labs: list[LabValue]
    lab: str = ""
    date: str = ""
    prev_date: str = ""
    summary_en: str = ""
    summary_hi: str = ""
    files: list[str] = []
    source: Literal["gemini", "rules"]
    warnings: list[str] = []


class ScanItem(BaseModel):
    name: str
    dose: str = ""
    food: str = ""
    slots: list[Slot] = []
    conf: float = Field(ge=0, le=1)


class ScanResponse(BaseModel):
    items: list[ScanItem]
    source: Literal["gemini"] = "gemini"
