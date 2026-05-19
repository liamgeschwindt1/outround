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

  // Build a name-normalisation note if the persona declares a canonical name
  const nameNote = persona.canonical_name
    ? `PROSPECT NAME NOTE: The prospect's canonical first name is "${persona.canonical_name}". STT transcription may produce variants such as ${(persona.phonetic_variants || [persona.canonical_name]).map(v => `"${v}"`).join(', ')}. Treat all phonetic variants as the same name. Never penalise the rep for a transcription spelling error on a proper noun — evaluate name usage on intent and consistency, not spelling.\n\n`
    : '';

  const prompt = `You are the grading engine for Outround, a cold-call practice platform. You are a brutal, commercially-minded coach who has reviewed thousands of cold calls. You have no patience for vague feedback or participation trophies.

${nameNote}You are grading a cold call practice session. The rep was calling ${persona.name}, ${persona.title} at ${persona.company} in ${persona.location}. Persona traits: ${persona.traits.join(', ')}.

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

/**
 * Fast basic grading — score, sub-scores, headline, verdict, momentum, focus only.
 * No per-turn annotations or coaching feedback. Much faster than full grading.
 */
async function gradeSessionFast(transcript, audioMetrics, persona) {
  if (!process.env.ANTHROPIC_KEY) {
    throw new Error('ANTHROPIC_KEY not configured');
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_KEY });

  const transcriptText = transcript
    .map((t) => `[${t.speaker.toUpperCase()}] ${t.text}`)
    .join('\n');

  const nameNote = persona.canonical_name
    ? `PROSPECT NAME NOTE: The prospect's canonical first name is "${persona.canonical_name}". STT may produce variants like ${(persona.phonetic_variants || [persona.canonical_name]).map(v => `"${v}"`).join(', ')}. Never penalise the rep for a transcription spelling error.\n\n`
    : '';

  const prompt = `You are a brutal cold-call grading engine. Grade this call quickly and return ONLY valid JSON — no preamble, no markdown fences.

${nameNote}Rep called ${persona.name}, ${persona.title} at ${persona.company} in ${persona.location}. Persona traits: ${persona.traits.join(', ')}.

TRANSCRIPT:
${transcriptText}

AUDIO METRICS:
- WPM: ${audioMetrics.wpm} | Talk ratio: Rep ${audioMetrics.talk_ratio.rep}% / Prospect ${audioMetrics.talk_ratio.prospect}%
- Fillers: ${audioMetrics.filler_words} | Longest monologue: ${audioMetrics.longest_monologue_seconds}s

SCORING (0–100 each):
- Opening: Specific hook that earned 30 more seconds? 90+ = trigger+question. <50 = pitch dump.
- Objections: Pivoted intelligently? 90+ = reframed and advanced. <50 = folded or ignored.
- Talk ratio: Listened? 90+ = rep <45% talk, open questions. <50 = monologue.
- Clear ask: Specific next step? 90+ = named day/time + value framing. <50 = vague or absent.

call_verdict: "advance" (clear next step agreed), "soft_advance" (ambiguous), "dead" (hard no or no step)
call_momentum: "building" (prospect became more engaged), "flat", "declining"

Return JSON:
{
  "overall_score": 0-100,
  "score_breakdown": {
    "opening": 0-100,
    "objections": 0-100,
    "talk_ratio": 0-100,
    "clear_ask": 0-100
  },
  "headline": "One brutal specific sentence — what really happened on this call",
  "call_verdict": "advance|soft_advance|dead",
  "call_momentum": "building|flat|declining",
  "next_session_focus": "The single most important thing to work on — one direct sentence"
}`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 512,
    messages: [{ role: 'user', content: prompt }],
  });

  const raw = response.content[0].text.trim();
  const cleaned = raw.replace(/^```json?\s*/i, '').replace(/\s*```$/i, '').trim();

  try {
    return JSON.parse(cleaned);
  } catch (parseErr) {
    console.error('gradeSessionFast JSON parse failed:', raw.slice(0, 300));
    throw new Error('Claude fast grading returned unparseable response: ' + parseErr.message);
  }
}

/**
 * Deep grading — annotates each transcript turn and provides detailed coaching.
 * Call only when the user explicitly requests deep analysis.
 * @param {Array} transcript - [{speaker, text, start_ms}]
 * @param {Object} audioMetrics
 * @param {Object} persona
 * @param {Object} basicResult - result from gradeSessionFast (for context)
 */
async function gradeSessionDeep(transcript, audioMetrics, persona, basicResult) {
  if (!process.env.ANTHROPIC_KEY) {
    throw new Error('ANTHROPIC_KEY not configured');
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_KEY });

  const numberedTranscript = transcript
    .map((t, i) => `[${i}][${t.speaker.toUpperCase()}] ${t.text}`)
    .join('\n');

  const nameNote = persona.canonical_name
    ? `PROSPECT NAME NOTE: Canonical name is "${persona.canonical_name}". Never penalise spelling variants.\n\n`
    : '';

  const prompt = `You are a detailed cold-call coach. Provide deep annotation and feedback.

${nameNote}Rep called ${persona.name}, ${persona.title} at ${persona.company} in ${persona.location}.

BASIC SCORES (context): Overall ${basicResult.overall_score}/100 | Opening ${basicResult.score_breakdown?.opening} | Objections ${basicResult.score_breakdown?.objections} | Talk ratio ${basicResult.score_breakdown?.talk_ratio} | Clear ask ${basicResult.score_breakdown?.clear_ask}
Verdict: ${basicResult.call_verdict} | Momentum: ${basicResult.call_momentum}

NUMBERED TRANSCRIPT (annotate each REP turn only):
${numberedTranscript}

AUDIO METRICS:
- WPM: ${audioMetrics.wpm} | Talk ratio: Rep ${audioMetrics.talk_ratio.rep}% / Prospect ${audioMetrics.talk_ratio.prospect}%
- Fillers: ${audioMetrics.filler_words} | Longest monologue: ${audioMetrics.longest_monologue_seconds}s

ANNOTATION RULES for rep turns:
- quality: "good" (effective move), "ok" (acceptable but improvable), "poor" (mistake or missed opportunity)
- coaching: 1–2 direct sentences — what worked or what to do differently. Reference exact words.
- For prospect turns: quality must be "neutral", coaching must be null.

COACHING FEEDBACK: 2–4 specific moments that defined this call.
- Each must reference a direct quote from the transcript.
- category: opening | discovery | objection | rapport | close
- score_label: bad | mid | good
- action: exact alternative line the rep can use word-for-word

SENTIMENT TIMELINE: prospect engagement in 20% chunks (neutral/positive/negative).

Return ONLY valid JSON, no markdown fences:
{
  "annotated_transcript": [
    { "index": 0, "quality": "good|ok|poor|neutral", "coaching": "..." }
  ],
  "coaching_feedback": [
    {
      "category": "opening|discovery|objection|rapport|close",
      "title": "Short label",
      "score": 0-100,
      "score_label": "bad|mid|good",
      "body": "What happened and why it matters.",
      "quote": "Exact words from the rep",
      "action": "Word-for-word alternative"
    }
  ],
  "sentiment_timeline": [
    { "start_pct": 0, "end_pct": 20, "sentiment": "neutral" }
  ]
}`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    messages: [{ role: 'user', content: prompt }],
  });

  const raw = response.content[0].text.trim();
  const cleaned = raw.replace(/^```json?\s*/i, '').replace(/\s*```$/i, '').trim();

  try {
    const result = JSON.parse(cleaned);
    // Merge annotations back into transcript turns
    const annotated = transcript.map((turn, i) => {
      const ann = (result.annotated_transcript || []).find(a => a.index === i);
      return {
        ...turn,
        quality: ann?.quality || (turn.speaker === 'rep' ? 'neutral' : 'neutral'),
        coaching: ann?.coaching || null,
      };
    });
    return {
      annotated_transcript: annotated,
      coaching_feedback: result.coaching_feedback || [],
      sentiment_timeline: result.sentiment_timeline || [],
    };
  } catch (parseErr) {
    console.error('gradeSessionDeep JSON parse failed:', raw.slice(0, 300));
    throw new Error('Claude deep grading returned unparseable response: ' + parseErr.message);
  }
}

module.exports = { gradeSession, gradeSessionFast, gradeSessionDeep };
