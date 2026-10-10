"""Safety layer: CareLens explains and prepares, it never diagnoses."""
import re

SAFE_LINE = {
    "en": "This helps you understand your results. It is not a diagnosis, so please confirm with your doctor.",
    "hi": "Yeh sirf samajhne ke liye hai, diagnosis nahi hai. Apne doctor se zaroor confirm karein.",
}

EMERGENCY = {
    "en": "This could be serious and should not wait. Please call 112 or go to the nearest emergency room now.",
    "hi": "Yeh gambhir ho sakta hai, ise taalein nahi. Abhi 112 par call karein ya nazdeeki hospital jaayein.",
}

_HINGLISH = re.compile(
    r"\b(kya|hai|hain|mera|meri|mere|kaise|kaisa|dawai|dawa|dard|kitna|kitni|batao|bataiye|samjhao|nahi|kab|kyun|"
    r"khana|raat|subah|dopahar|chakkar|thakaan|thakan|seene|saans)\b",
    re.I,
)

_RED_FLAGS = [
    r"chest.{0,20}(pain|tight|pressure)|(pain|tight|pressure).{0,20}chest",
    r"seene.{0,20}(dard|bhaari|jakdan)",
    r"(trouble|difficulty|hard).{0,15}breath|can'?t breathe|saans.{0,15}(dikkat|nahi|phool)",
    r"faint|behosh|unconscious|collapse",
    r"stroke|face.{0,10}droop|slurred|one side.{0,15}(weak|numb)",
    r"suicid|kill myself|end my life|marna chahta|marna chahti",
    r"overdose|poison|zeher",
    r"vomit.{0,10}blood|blood.{0,10}vomit|coughing.{0,10}blood|khoon.{0,10}(ulti|khaansi)",
    r"severe bleeding|bahut khoon",
    r"worst headache|sudden.{0,15}(vision|blind)",
]
_RED = re.compile("|".join(_RED_FLAGS), re.I)


def detect_lang(text: str, hint: str = "en") -> str:
    return "hi" if hint == "hi" or _HINGLISH.search(text) else "en"


def is_red_flag(text: str) -> bool:
    return bool(_RED.search(text))


def with_safe_line(text: str, lang: str) -> str:
    """Append the standard disclaimer unless the model already included an equivalent."""
    low = text.lower()
    if "not a diagnosis" in low or "diagnosis nahi" in low:
        return text
    return f"{text.strip()}\n\n{SAFE_LINE[lang]}"
