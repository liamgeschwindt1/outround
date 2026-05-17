'use strict';

const Anthropic = require('@anthropic-ai/sdk').default || require('@anthropic-ai/sdk');

/**
 * Grade a completed call session using Claude.
 * @param {Array} transcript - [{speaker, text, start_ms}]
 * @param {Object} audioMetrics
 * @param {Object} persona - persona definition
 * @returns {Promise<Object>} grading result
 */
async function gradeSession(transcript, audioMetrics, persona) {
  if (!process.env.ANTHROPIC_KEY) {
    throw new Error('ANTHROPIC_KEY not configured');
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_KEY });

  const transcriptText = transcript
    .map((t) => `[${t.speaker.toUpperCase()}] ${t.text}`)
    .join('\n');

  const prompt = `You are the grading engine for Outround, a cold-call practice platform. You are a brutal, commercially-minded coach who has reviewed thousands of cold calls. You have no patience for vague feedback or participation trophies.

You are grading a cold call practice session. The rep was calling ${persona.name}, ${persona.title} at ${persona.company} in ${persona.location}. Persona traits: ${persona.traits.join(', ')}.

THE TRANSCRIPT:
${transcriptText}

AUDIO METRICS:
- Words per minute: ${audioMetrics.wpm}
- Talk ratio: Rep ${audioMetrics.talk_ratio.rep}% / Prospect ${audioMetrics.talk_ratio.prospect}%
- Filler words: ${audioMetrics.filler_words}
- Longest rep monologue: ${audioMetrics.longest_monologue_seconds}s
- Avg response latency: ${audioMetrics.avg_response_latency_seconds}s

SCORING RUBRIC:

Opening hook (0–100): Did they open with a specific, relevant hook that earned the next 30 seconds? 90+ = specific trigger + question. 70+ = relevant but generic. Below 50 = pitch dump or cold intro.

Objection handling (0–100): When the prospect pushed back, did the rep fold, get defensive, or pivot intelligently? 90+ = acknowledged objection, reframed it, used it to advance. Below 50 = folded or ignored.

Talk ratio (0–100): Did the rep listen? 90+ = rep spoke <45% of the time and asked open questions. Below 50 = rep monologued. Score based on actual talk_ratio metric.

Clear ask (0–100): Was there a specific, time-bound, confident next step? 90+ = named day/time, framed the value of the next step. Below 50 = vague "let me send something" or no ask.

COACHING FEEDBACK RULES:
- Each item must reference a specific moment with a direct quote
- Say exactly what went wrong or right — not HR language
- "Confrontational dynamic" → "you were rude to this prospect"
- If a move was good, say clearly why it worked — don't soften it
- If the call was a disaster, say so
- action must be a specific line the rep can use word-for-word next time
- category must be one of: opening | discovery | objection | rapport | close

CALL VERDICT:
- "advance" — the prospect agreed to a clear next step (meeting, callback, referral)
- "soft_advance" — the prospect didn't say no but the next step is ambiguous (send me info, maybe, I'll think about it)
- "dead" — the call ended with a hard no, hung up, or no next step was established

CALL MOMENTUM:
- "building" — the prospect became more engaged as the call progressed
- "flat" — engagement level didn't change meaningfully
- "declining" — the prospect became more resistant or checked out

Return valid JSON only. No preamble, no markdown fences:
{
  "overall_score": 0-100,
  "score_breakdown": {
    "opening": 0-100,
    "objections": 0-100,
    "talk_ratio": 0-100,
    "clear_ask": 0-100
  },
  "headline": "One brutal sentence verdict — specific and direct",
  "call_verdict": "advance|soft_advance|dead",
  "call_momentum": "building|flat|declining",
  "next_session_focus": "The single most important thing this rep must work on — one sentence, direct",
  "coaching_feedback": [
    {
      "category": "opening|discovery|objection|rapport|close",
      "title": "Short label for this moment",
      "score": 0-100,
      "score_label": "bad|mid|good",
      "body": "What happened and why it matters. Plain language. No softening.",
      "quote": "The exact words the rep said that this feedback relates to",
      "action": "Specific alternative — word for word if possible"
    }
  ],
  "sentiment_timeline": [
    { "start_pct": 0, "end_pct": 20, "sentiment": "neutral" },
    { "start_pct": 21, "end_pct": 60, "sentiment": "positive" }
  ]
}`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    messages: [{ role: 'user', content: prompt }],
  });

  const raw = response.content[0].text.trim();

  // Strip any accidental markdown fences
  const cleaned = raw.replace(/^```json?\s*/i, '').replace(/\s*```$/i, '').trim();

  try {
    return JSON.parse(cleaned);
  } catch (parseErr) {
    console.error('Claude JSON parse failed. stop_reason:', response.stop_reason,
      '| tokens used:', response.usage?.output_tokens,
      '| raw (first 500):', raw.slice(0, 500));
    throw new Error('Claude returned unparseable response: ' + parseErr.message);
  }
}

module.exports = { gradeSession };
