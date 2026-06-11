from pathlib import Path

from fastapi import APIRouter, HTTPException

from models.grade_session import (
    GradeSessionDeepRequest,
    GradeSessionDeepResult,
    GradeSessionFastRequest,
    GradeSessionFastResult,
)
from models.grade_pitch import (
    GradePitchDeepResult,
    GradePitchFastResult,
)
from services import get_client

router = APIRouter(prefix="/v1/ai/grade")
PROMPTS = Path(__file__).parent.parent.parent / "prompts"


def _load_prompt(name: str) -> str:
    return (PROMPTS / name).read_text()


def _build_transcript_text(transcript: list) -> str:
    return "\n".join(
        f"[{t.speaker.upper()}] {t.text}" for t in transcript
    )


def _build_name_note(persona) -> str:
    if persona.canonical_name:
        variants = persona.phonetic_variants or [persona.canonical_name]
        variant_str = ", ".join(f'"{v}"' for v in variants)
        return (
            f"PROSPECT NAME NOTE: The prospect's canonical first name is "
            f'"{persona.canonical_name}". STT may produce variants like '
            f"{variant_str}. Never penalise the rep for a transcription "
            f"spelling error on a proper noun.\n\n"
        )
    return ""


# ── Session grading ───────────────────────────────────────────────────────────

@router.post("/session/fast", response_model=GradeSessionFastResult)
async def grade_session_fast(req: GradeSessionFastRequest):
    try:
        client = get_client()
        template = _load_prompt("grade_session_fast.txt")
        prompt = template.format(
            name_note=_build_name_note(req.persona),
            persona_name=req.persona.name,
            persona_title=req.persona.title,
            persona_company=req.persona.company,
            persona_location=req.persona.location,
            persona_traits=", ".join(req.persona.traits),
            transcript_text=_build_transcript_text(req.transcript),
            wpm=req.audio_metrics.wpm,
            talk_ratio_rep=req.audio_metrics.talk_ratio.rep,
            talk_ratio_prospect=req.audio_metrics.talk_ratio.prospect,
            filler_words=req.audio_metrics.filler_words,
            longest_monologue=req.audio_metrics.longest_monologue_seconds,
        )
        return client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=512,
            messages=[{"role": "user", "content": prompt}],
            response_model=GradeSessionFastResult,
            max_retries=3,
        )
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Grading failed: {exc}")


@router.post("/session/deep", response_model=GradeSessionDeepResult)
async def grade_session_deep(req: GradeSessionDeepRequest):
    try:
        client = get_client()
        br = req.basic_result
        template = _load_prompt("grade_session_deep.txt")
        numbered = "\n".join(
            f"[{i}][{t.speaker.upper()}] {t.text}"
            for i, t in enumerate(req.transcript)
        )
        prompt = template.format(
            name_note=_build_name_note(req.persona),
            persona_name=req.persona.name,
            persona_title=req.persona.title,
            persona_company=req.persona.company,
            persona_location=req.persona.location,
            overall_score=br.overall_score,
            opening_score=br.score_breakdown.opening,
            objections_score=br.score_breakdown.objections,
            talk_ratio_score=br.score_breakdown.talk_ratio,
            clear_ask_score=br.score_breakdown.clear_ask,
            call_verdict=br.call_verdict.value,
            call_momentum=br.call_momentum.value,
            numbered_transcript=numbered,
            wpm=req.audio_metrics.wpm,
            talk_ratio_rep=req.audio_metrics.talk_ratio.rep,
            talk_ratio_prospect=req.audio_metrics.talk_ratio.prospect,
            filler_words=req.audio_metrics.filler_words,
            longest_monologue=req.audio_metrics.longest_monologue_seconds,
        )
        return client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=4096,
            messages=[{"role": "user", "content": prompt}],
            response_model=GradeSessionDeepResult,
            max_retries=3,
        )
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Deep grading failed: {exc}")


# ── Pitch grading ─────────────────────────────────────────────────────────────

@router.post("/pitch/fast", response_model=GradePitchFastResult)
async def grade_pitch_fast(req: GradeSessionFastRequest):
    try:
        client = get_client()
        template = _load_prompt("grade_pitch_fast.txt")
        location = f" in {req.persona.location}" if req.persona.location else ""
        prompt = template.format(
            name_note=_build_name_note(req.persona),
            persona_name=req.persona.name,
            persona_title=req.persona.title,
            persona_company=req.persona.company,
            persona_location=location,
            persona_traits=", ".join(req.persona.traits),
            transcript_text=_build_transcript_text(req.transcript),
            wpm=req.audio_metrics.wpm,
            talk_ratio_rep=req.audio_metrics.talk_ratio.rep,
            talk_ratio_prospect=req.audio_metrics.talk_ratio.prospect,
            filler_words=req.audio_metrics.filler_words,
            longest_monologue=req.audio_metrics.longest_monologue_seconds,
        )
        return client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=512,
            messages=[{"role": "user", "content": prompt}],
            response_model=GradePitchFastResult,
            max_retries=3,
        )
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Pitch grading failed: {exc}")


@router.post("/pitch/deep", response_model=GradePitchDeepResult)
async def grade_pitch_deep(req: GradeSessionDeepRequest):
    try:
        client = get_client()
        br = req.basic_result
        bd = br.score_breakdown
        template = _load_prompt("grade_pitch_deep.txt")
        numbered = "\n".join(
            f"[{i}][{t.speaker.upper()}] {t.text}"
            for i, t in enumerate(req.transcript)
        )
        prompt = template.format(
            name_note=_build_name_note(req.persona),
            persona_name=req.persona.name,
            persona_title=req.persona.title,
            persona_company=req.persona.company,
            overall_score=br.overall_score,
            problem_clarity=getattr(bd, "problem_clarity", "?"),
            why_now=getattr(bd, "why_now", "?"),
            right_to_win=getattr(bd, "right_to_win", "?"),
            ask_clarity=getattr(bd, "ask_clarity", "?"),
            call_verdict=br.call_verdict.value,
            call_momentum=br.call_momentum.value,
            numbered_transcript=numbered,
            wpm=req.audio_metrics.wpm,
            talk_ratio_rep=req.audio_metrics.talk_ratio.rep,
            talk_ratio_prospect=req.audio_metrics.talk_ratio.prospect,
            filler_words=req.audio_metrics.filler_words,
            longest_monologue=req.audio_metrics.longest_monologue_seconds,
        )
        return client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=4096,
            messages=[{"role": "user", "content": prompt}],
            response_model=GradePitchDeepResult,
            max_retries=3,
        )
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Pitch deep grading failed: {exc}")
