from typing import Literal

from pydantic import BaseModel, Field

from models.common import (
    CallMomentum,
    CallVerdict,
    PitchCoachingCategory,
    ScoreLabel,
    SentimentLabel,
    TurnQuality,
)


# ── Output models — Fast pitch grading ────────────────────────────────────────

class PitchScoreBreakdown(BaseModel):
    problem_clarity: int = Field(ge=0, le=100)
    why_now: int = Field(ge=0, le=100)
    right_to_win: int = Field(ge=0, le=100)
    ask_clarity: int = Field(ge=0, le=100)


class GradePitchFastResult(BaseModel):
    overall_score: int = Field(ge=0, le=100)
    score_breakdown: PitchScoreBreakdown
    headline: str = Field(max_length=200)
    call_verdict: CallVerdict
    call_momentum: CallMomentum
    next_session_focus: str = Field(max_length=200)


# ── Output models — Deep pitch grading ────────────────────────────────────────

class PitchCoachingFeedbackItem(BaseModel):
    category: PitchCoachingCategory
    title: str
    score: int = Field(ge=0, le=100)
    score_label: ScoreLabel
    body: str
    quote: str
    action: str


class GradePitchDeepResult(BaseModel):
    annotated_transcript: list["TurnAnnotation"] = Field(default_factory=list)
    coaching_feedback: list[PitchCoachingFeedbackItem] = Field(default_factory=list)
    sentiment_timeline: list["SentimentChunk"] = Field(default_factory=list)


# Re-use shared types from grade_session
from models.grade_session import SentimentChunk, TurnAnnotation
