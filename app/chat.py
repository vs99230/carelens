"""Chat: deterministic red-flag handling first, then Gemini, then rule-based fallback."""
import logging

from . import labs_kb, safety
from .gemini import GeminiClient, GeminiUnavailable
from .schemas import ChatRequest, ChatResponse

log = logging.getLogger("carelens.chat")

SYSTEM = """You are CareLens, a calm health companion for patients in India. You EXPLAIN reports, medicines and symptoms and help
the person PREPARE for a doctor visit. You are NOT a doctor.
Rules:
- Never diagnose, never say what disease someone has, never prescribe, and never tell them to start, stop or change a medicine or dose;
  say to ask their doctor or pharmacist.
- Use simple words, short sentences, max ~120 words. No markdown headings.
- Reply in the language requested: 'en' = plain English, 'hi' = Hinglish (Hindi written in Roman script).
- If something sounds urgent (chest pain, trouble breathing, fainting, stroke signs, heavy bleeding), tell them to call 112 / go to the ER now.
- Use the patient context below when relevant; if it doesn't contain the answer, say so instead of guessing.
- End with one short line reminding them to confirm with their doctor."""


def _context(req: ChatRequest) -> str:
    lines = []
    if req.meds:
        lines.append("Medicines: " + "; ".join(f"{m.name} {m.dose} ({', '.join(m.slots) or 'no slot'}; {m.food})".strip() for m in req.meds))
    if req.labs:
        lines.append("Latest labs: " + "; ".join(
            f"{l.get('name')} {l.get('curr')} {l.get('unit', '')} (ref {l.get('refLow')}-{l.get('refHigh')}, previous {l.get('prev')})"
            for l in req.labs[:20]))
    return "\n".join(lines) or "No patient context supplied."


def rules_reply(req: ChatRequest, lang: str) -> str:
    q = req.question.lower()
    hi = lang == "hi"
    for l in labs_kb.LABS:
        if any(a in q for a in l.aliases if len(a) > 2):
            given = next((x for x in req.labs if labs_kb.find_def(str(x.get("name", ""))) == l), None)
            if given:
                e, h = labs_kb.explain(l, float(given["curr"]), given.get("prev"), given.get("refLow"), given.get("refHigh"), given.get("unit", l.unit))
                return safety.with_safe_line(h if hi else e, lang)
            what = l.what_hi if hi else l.what_en
            tail = ("Apni report ka value yahan upload karein to main use samjha dunga." if hi
                    else "Upload your report and I can explain your own value.")
            return safety.with_safe_line(f"{what} {tail}", lang)
    if any(w in q for w in ("medicine", "dawai", "dawa", "tablet", "goli", "schedule")) and req.meds:
        rows = []
        for s in ("morning", "afternoon", "night"):
            names = [f"{m.name} {m.dose}".strip() for m in req.meds if s in m.slots]
            if names:
                rows.append(f"{s.capitalize()}: {', '.join(names)}")
        head = "Aaj ka schedule:" if hi else "Today's schedule:"
        tail = "Dose badalne se pehle doctor se poochein." if hi else "Please ask your doctor before changing any dose."
        return f"{head}\n" + "\n".join(rows) + f"\n\n{tail}"
    if any(w in q for w in ("symptom", "pain", "dard", "headache", "chakkar", "dizz")):
        return ("Symptoms ko 'Symptoms' page par body map se log karein. Agar dard tez ho ya achanak badhe, jaldi doctor ko dikhayein."
                if hi else "Log it on the Symptoms page using the body map. If the pain is severe or sudden, see a doctor soon.")
    return ("Main aapki reports, dawaiyon aur symptoms samajhne mein madad kar sakta hoon. Jaise: \"Mera hemoglobin kaisa hai?\""
            if hi else "I can help you understand your reports, medicines and symptoms. Try: \"What does my hemoglobin mean?\"")


async def answer(client: GeminiClient | None, req: ChatRequest) -> ChatResponse:
    lang = safety.detect_lang(req.question, req.lang)
    if safety.is_red_flag(req.question):
        return ChatResponse(reply=safety.EMERGENCY[lang], source="rules")
    if client:
        prompt = f"Language: {lang}\n\nPatient context:\n{_context(req)}\n\nQuestion: {req.question}"
        try:
            text = await client.generate_text(SYSTEM, prompt)
            return ChatResponse(reply=safety.with_safe_line(text, lang), source="gemini")
        except GeminiUnavailable as e:
            log.warning("Gemini chat failed, using rules: %s", e)
    return ChatResponse(reply=rules_reply(req, lang), source="rules")
