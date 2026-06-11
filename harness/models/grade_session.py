from typing import Literal

from pydantic import BaseModel, Field

from models.common import (
    CallMomentum,
    CallVerdict,
    ScoreLabel,
    SentimentLabel,
    SessionCoachingCategory,
    TurnQuality,
)


# ── Input models ──────────────────────────────────────────────────────────────

class TranscriptTurn(BaseModel):
    speaker: Literal["rep", "prospect", "unknown"] = "unknown"
    text: str
    start_ms: int | None = None


class TalkRatio(BaseModel):
    rep: float
    prospect: float


class AudioMetrics(BaseModel):
    wpm: int
    talk_ratio: TalkRatio
    filler_words: int
    longest_monologue_seconds: float
    avg_response_latency_seconds: float = 0.0


class PersonaContext(BaseModel):
    name: str
    title: str = ""
    company: str = ""
    location: str = ""
    traits: list[str] = Field(default_factory=list)
    canonical_name: str | None = None
    phonetic_variants: list[str] = Field(default_factory=list)


class GradeSessionFastRequest(BaseModel):
    transcript: list[TranscriptTurn]
    audio_metrics: AudioMetrics
    persona: PersonaContext


class GradeSessionDeepRequest(BaseModel):
    transcript: list[TranscriptTurn]
    audio_metrics: AudioMetrics
    persona: PersonaContext
    basic_result: "GradeSessionFastResult"


# ── Output models — Fast grading ──────────────────────────────────────────────

class SessionScoreBreakdown(BaseModel):
    opening: int = Field(ge=0, le=100)
    objections: int = Field(ge=0, le=100)
    talk_ratio: int = Field(ge=0, le=100)
    clear_ask: int = Field(ge=0, le=100)


class GradeSessionFastResult(BaseModel):
    overall_score: int = Field(ge=0, le=100)
    score_breakdown: SessionScoreBreakdown
    headline: str = Field(max_length=200)
    call_verdict: CallVerdict
    call_momentum: CallMomentum
    next_session_focus: str = Field(max_length=200)


# ── Output models — Deep grading ──────────────────────────────────────────────

class TurnAnnotation(BaseModel):
    index: int
    quality: TurnQuality
    coaching: str | None = None


class CoachingFeedbackItem(BaseModel):
    category: SessionCoachingCategory
    title: str
    score: int = Field(ge=0, le=100)
    score_label: ScoreLabel
    body: str
    quote: str
    action: str


class SentimentChunk(BaseModel):
    start_pct: int = Field(ge=0, le=100)
    end_pct: int = Field(ge=0, le=100)
    sentiment: Literal["neutral", "positive", "negative"]
    label: SentimentLabel


class GradeSessionDeepResult(BaseModel):
    annotated_transcript: list[TurnAnnotation]
    coaching_feedback: list[CoachingFeedbackItem] = Field(default_factory=list)
    sentiment_timeline: list[SentimentChunk] = Field(default_factory=list)
