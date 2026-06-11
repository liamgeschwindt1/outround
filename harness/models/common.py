from enum import Enum


class CallVerdict(str, Enum):
    advance = "advance"
    soft_advance = "soft_advance"
    dead = "dead"
    meeting_set = "meeting_set"
    deck_requested = "deck_requested"
    passed = "passed"


class CallMomentum(str, Enum):
    building = "building"
    flat = "flat"
    declining = "declining"


class ScoreLabel(str, Enum):
    bad = "bad"
    mid = "mid"
    good = "good"


class SentimentLabel(str, Enum):
    engaged = "engaged"
    checking_out = "checking_out"
    resistant = "resistant"
    warming = "warming"
    neutral = "neutral"


class TurnQuality(str, Enum):
    good = "good"
    ok = "ok"
    poor = "poor"
    neutral = "neutral"


class SessionCoachingCategory(str, Enum):
    opening = "opening"
    discovery = "discovery"
    objection = "objection"
    rapport = "rapport"
    close = "close"


class PitchCoachingCategory(str, Enum):
    problem = "problem"
    why_now = "why_now"
    right_to_win = "right_to_win"
    ask = "ask"
    qa_response = "qa_response"
