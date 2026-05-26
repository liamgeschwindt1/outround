'use strict';

const Anthropic = require('@anthropic-ai/sdk').default || require('@anthropic-ai/sdk');

/**
 * @deprecated Use gradeSessionFast + gradeSessionDeep instead.
 * This monolithic grading function is no longer called by the application.
 * Kept for reference only — do not invoke.
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
- action must be a complete sentence the rep can say verbatim on their next call — not advice, not a direction, an actual spoken line
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
    { "start_pct": 0, "end_pct": 20, "sentiment": "neutral", "label": "neutral" },
    { "start_pct": 21, "end_pct": 60, "sentiment": "positive", "label": "engaged" }
  ]
}

sentiment_timeline label must be one of: engaged | checking_out | resistant | warming | neutral — one word describing the quality of prospect engagement in that chunk, for direct UI display.`;

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
- action: a complete sentence the rep can say verbatim on their next call — not advice, not a direction, an actual spoken line

SENTIMENT TIMELINE: prospect engagement in 20% chunks. For each chunk include: sentiment (neutral/positive/negative) and label (engaged/checking_out/resistant/warming/neutral) — one word describing quality of engagement for direct UI display.

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
      "action": "A complete sentence the rep can say verbatim on their next call — not advice, not a direction, an actual spoken line"
    }
  ],
  "sentiment_timeline": [
    { "start_pct": 0, "end_pct": 20, "sentiment": "neutral", "label": "neutral" }
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

// ---------------------------------------------------------------------------
// Investor pitch — fast grading
// ---------------------------------------------------------------------------
/**
 * Fast grading for a 60-second investor pitch + Q&A session.
 * Returns score_breakdown with pitch-specific dimensions.
 */
async function gradePitchFast(transcript, audioMetrics, persona) {
  if (!process.env.ANTHROPIC_KEY) {
    throw new Error('ANTHROPIC_KEY not configured');
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_KEY });

  const transcriptText = transcript
    .map((t) => `[${t.speaker.toUpperCase()}] ${t.text}`)
    .join('\n');

  const nameNote = persona.canonical_name
    ? `INVESTOR NAME NOTE: The investor's canonical first name is "${persona.canonical_name}". Never penalise STT spelling errors.\n\n`
    : '';

  const prompt = `You are a senior venture capital analyst grading a 60-second seed pitch. Be precise, unsparing, and commercially-minded. Return ONLY valid JSON — no preamble, no markdown fences.

${nameNote}Founder pitched to ${persona.name}, ${persona.title} at ${persona.company}${persona.location ? ', ' + persona.location : ''}. Investor traits: ${(persona.traits || []).join(', ')}.

Context: The founder had 60 seconds to pitch, then the investor asked questions. The investor does not interrupt in the first 60 seconds.

TRANSCRIPT:
${transcriptText}

AUDIO METRICS:
- WPM: ${audioMetrics.wpm} | Talk ratio: Founder ${audioMetrics.talk_ratio?.rep ?? '?'}% / Investor ${audioMetrics.talk_ratio?.prospect ?? '?'}%
- Fillers: ${audioMetrics.filler_words} | Longest monologue: ${audioMetrics.longest_monologue_seconds}s

SCORING (0–100 each):
- problem_clarity: Did the founder articulate a specific, real problem with a named customer segment? 90+ = vivid, specific, quantified. <50 = vague hand-waving.
- why_now: Did the founder explain what changed (model capability, data availability, regulation) that makes this the right moment? 90+ = precise unlock named. <50 = absent or generic "AI is transforming".
- right_to_win: Did the founder establish why they specifically — not a well-funded competitor — are best positioned? 90+ = specific unfair advantage (data, distribution, domain). <50 = "we're building a great team".
- ask_clarity: Was the raise amount, milestone, and use of funds clear and rational? 90+ = specific ask + 18-month milestone + use of funds. <50 = no ask or "we're raising a round".

call_verdict:
- "meeting_set" — investor agreed to a follow-up meeting
- "deck_requested" — investor asked for deck/materials only, no meeting yet
- "passed" — investor passed or gave no next step

call_momentum: "building" / "flat" / "declining" (based on how investor engagement evolved through the call)

Return JSON:
{
  "overall_score": 0-100,
  "score_breakdown": {
    "problem_clarity": 0-100,
    "why_now": 0-100,
    "right_to_win": 0-100,
    "ask_clarity": 0-100
  },
  "headline": "One brutal sentence — what this pitch actually communicated",
  "call_verdict": "meeting_set|deck_requested|passed",
  "call_momentum": "building|flat|declining",
  "next_session_focus": "The single most important thing to fix — one direct sentence"
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
    console.error('gradePitchFast JSON parse failed:', raw.slice(0, 300));
    throw new Error('Claude pitch fast grading returned unparseable response: ' + parseErr.message);
  }
}

// ---------------------------------------------------------------------------
// Investor pitch — deep grading
// ---------------------------------------------------------------------------
/**
 * Deep grading for a pitch session — annotates transcript and gives coaching.
 */
async function gradePitchDeep(transcript, audioMetrics, persona, basicResult) {
  if (!process.env.ANTHROPIC_KEY) {
    throw new Error('ANTHROPIC_KEY not configured');
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_KEY });

  const numberedTranscript = transcript
    .map((t, i) => `[${i}][${t.speaker.toUpperCase()}] ${t.text}`)
    .join('\n');

  const nameNote = persona.canonical_name
    ? `INVESTOR NAME NOTE: Canonical name is "${persona.canonical_name}". Never penalise spelling variants.\n\n`
    : '';

  const bd = basicResult.score_breakdown || {};

  const prompt = `You are a senior venture capital coach providing deep pitch feedback. Annotate every turn and give coaching.

${nameNote}Founder pitched to ${persona.name}, ${persona.title} at ${persona.company}. This was a 60-second pitch followed by investor Q&A.

BASIC SCORES (context): Overall ${basicResult.overall_score}/100 | Problem clarity ${bd.problem_clarity} | Why now ${bd.why_now} | Right to win ${bd.right_to_win} | Ask clarity ${bd.ask_clarity}
Verdict: ${basicResult.call_verdict} | Momentum: ${basicResult.call_momentum}

NUMBERED TRANSCRIPT (annotate each FOUNDER turn only):
${numberedTranscript}

AUDIO METRICS:
- WPM: ${audioMetrics.wpm} | Talk ratio: Founder ${audioMetrics.talk_ratio?.rep ?? '?'}% / Investor ${audioMetrics.talk_ratio?.prospect ?? '?'}%
- Fillers: ${audioMetrics.filler_words} | Longest monologue: ${audioMetrics.longest_monologue_seconds}s

ANNOTATION RULES for founder turns:
- quality: "good" (strong move), "ok" (acceptable, room to improve), "poor" (missed opportunity or mistake)
- coaching: 1–2 direct sentences on what worked or what to do differently. Be specific to the words used.
- For investor turns: quality must be "neutral", coaching must be null.

COACHING FEEDBACK: 2–4 moments that defined this pitch.
- Each must reference a direct quote.
- category: problem | why_now | right_to_win | ask | qa_response
- score_label: bad | mid | good
- action: a complete sentence the founder can say verbatim on their next call — not advice, not a direction, an actual spoken line

SENTIMENT TIMELINE: investor engagement in 20% chunks. For each chunk include: sentiment (neutral/positive/negative) and label (engaged/checking_out/resistant/warming/neutral) — one word describing quality of engagement for direct UI display.

Return ONLY valid JSON, no markdown fences:
{
  "annotated_transcript": [
    { "index": 0, "quality": "good|ok|poor|neutral", "coaching": "..." }
  ],
  "coaching_feedback": [
    {
      "category": "problem|why_now|right_to_win|ask|qa_response",
      "title": "Short label",
      "score": 0-100,
      "score_label": "bad|mid|good",
      "body": "What happened and why it matters.",
      "quote": "Exact words from the founder",
      "action": "A complete sentence the founder can say verbatim on their next call — not advice, not a direction, an actual spoken line"
    }
  ],
  "sentiment_timeline": [
    { "start_pct": 0, "end_pct": 20, "sentiment": "neutral", "label": "neutral" }
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
    const annotated = transcript.map((turn, i) => {
      const ann = (result.annotated_transcript || []).find(a => a.index === i);
      return {
        ...turn,
        quality: ann?.quality || 'neutral',
        coaching: ann?.coaching || null,
      };
    });
    return {
      annotated_transcript: annotated,
      coaching_feedback: result.coaching_feedback || [],
      sentiment_timeline: result.sentiment_timeline || [],
    };
  } catch (parseErr) {
    console.error('gradePitchDeep JSON parse failed:', raw.slice(0, 300));
    throw new Error('Claude pitch deep grading returned unparseable response: ' + parseErr.message);
  }
}

// ---------------------------------------------------------------------------
// Meeting prep — prospect intel, coaching notes, persona assembly
// ---------------------------------------------------------------------------

const PREP_MODEL = process.env.ANTHROPIC_PREP_MODEL || 'claude-sonnet-4-6';

function buildCrmContext({ person, deal, notes, activities }) {
  const lines = [];
  if (person) {
    lines.push(`PROSPECT: ${person.name || 'unknown'}${person.title ? ` — ${person.title}` : ''}${person.org ? ` at ${person.org}` : ''}`);
    if (person.email) lines.push(`Email: ${person.email}`);
    if (person.open_deals_count != null) lines.push(`Open deals: ${person.open_deals_count} | Closed: ${person.closed_deals_count ?? 0}`);
    if (person.last_activity_date) lines.push(`Last activity: ${person.last_activity_date}`);
  }
  if (deal) {
    lines.push('');
    lines.push(`DEAL: ${deal.title}${deal.value ? ` — ${deal.value}${deal.currency ? ' ' + deal.currency : ''}` : ''}`);
    if (deal.stage_name) lines.push(`Stage: ${deal.stage_name}${deal.days_in_stage != null ? ` (${deal.days_in_stage} days)` : ''}`);
    if (deal.probability != null) lines.push(`Probability: ${deal.probability}%`);
    if (deal.expected_close_date) lines.push(`Expected close: ${deal.expected_close_date}`);
  }
  const recentNotes = (notes || []).slice(0, 10);
  if (recentNotes.length) {
    lines.push('');
    lines.push('CRM NOTES (most recent first):');
    recentNotes.forEach(n => {
      const when = n.add_time ? n.add_time.split('T')[0] : '';
      const body = (n.content || '').slice(0, 600);
      if (body) lines.push(`- [${when}] ${body}`);
    });
  }
  const recentActivities = (activities || []).slice(0, 10);
  if (recentActivities.length) {
    lines.push('');
    lines.push('ACTIVITIES (most recent first):');
    recentActivities.forEach(a => {
      const when = a.marked_as_done_time || a.due_date || a.add_time || '';
      const status = a.done ? 'done' : 'open';
      const note = a.note ? ` — ${a.note.slice(0, 200)}` : '';
      lines.push(`- [${when}] ${a.type || 'activity'} (${status}): ${a.subject || '(no subject)'}${note}`);
    });
  }
  return lines.join('\n').trim() || 'No CRM data available for this prospect.';
}

/**
 * Generate the full meeting-prep AI payload in a single Claude call.
 *
 *   {
 *     prospect_summary: string,                 // one-paragraph synthesis
 *     last_interaction: string|null,            // one-sentence summary of most recent call/meeting
 *     open_next_steps: string[],                // bullets — what was agreed next
 *     coaching_notes: string[],                 // 3 bullets — what to watch for
 *     persona: {
 *       system_prompt: string,                  // for ElevenLabs override (NEVER returned to UI)
 *       summary: {                              // user-facing only
 *         communication_style: string,
 *         known_objections: string[],
 *         resistance_level: 1|2|3|4|5,
 *         what_moves_them: string[],
 *       }
 *     }
 *   }
 */
async function generateMeetingPrepIntel({ meeting, person, deal, notes, activities, user, userStats }) {
  if (!process.env.ANTHROPIC_KEY) throw new Error('ANTHROPIC_KEY not configured');
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_KEY });

  const crm = buildCrmContext({ person, deal, notes, activities });

  const repWeakSpots = (() => {
    if (!userStats || !userStats.score_breakdown) return 'No prior round data yet.';
    const sb = userStats.score_breakdown;
    const entries = Object.entries(sb).sort((a, b) => a[1] - b[1]).slice(0, 2);
    return entries.map(([k, v]) => `${k}: ${v}/100`).join(', ');
  })();

  const prompt = `You are the meeting prep engine for Outround. The rep has a meeting coming up with the prospect described below. Synthesise everything we know into a single tight prep payload — and assemble a digital twin persona the rep can rehearse against.

REP: ${user?.name || 'the rep'}${user?.role ? ` (${user.role})` : ''}
REP WEAK SPOTS (lowest sub-scores from recent rounds): ${repWeakSpots}

MEETING:
- Title: ${meeting?.title || '(untitled)'}
- When: ${meeting?.starts_at || 'TBC'}

CRM DATA:
${crm}

INSTRUCTIONS:
1. prospect_summary (1 paragraph, ~80 words): who is this person, how do they buy, what matters to them, what has been tried. Synthesise — don't list. If data is thin, say so plainly in the first sentence and base the rest on role/industry priors.
2. last_interaction: one sentence summarising the most recent meaningful interaction (note or completed activity). null if nothing meaningful.
3. open_next_steps: array of short strings — what was agreed but not yet done. [] if nothing open.
4. coaching_notes: 3 short bullets — specific things to watch for in THIS meeting, given the prospect's history AND the rep's weak spots. Direct, no fluff.
5. persona.system_prompt: a complete system prompt (300–500 words) for a voice agent playing this prospect. Include: name, role, company, communication style, current beliefs, objections they will raise, what would move them, hang-up conditions, response-length rules (short, real-CFO style — see the Outround house style: no monologues, silence is a tool). Build it from the CRM data — quote specifics where they exist. If data is thin, fall back sensibly to role-typical behaviour.
6. persona.summary (USER-FACING — never reveals system prompt internals):
   - communication_style: one sentence
   - known_objections: 2–4 short strings, each phrased as the prospect would say it
   - resistance_level: integer 1 (open) to 5 (hostile)
   - what_moves_them: 2–3 short strings

Return ONLY valid JSON, no preamble, no markdown fences:
{
  "prospect_summary": "...",
  "last_interaction": "..." | null,
  "open_next_steps": ["..."],
  "coaching_notes": ["...", "...", "..."],
  "persona": {
    "system_prompt": "...",
    "summary": {
      "communication_style": "...",
      "known_objections": ["..."],
      "resistance_level": 3,
      "what_moves_them": ["..."]
    }
  }
}`;

  const response = await client.messages.create({
    model: PREP_MODEL,
    max_tokens: 2048,
    messages: [{ role: 'user', content: prompt }],
  });

  const raw = response.content[0].text.trim();
  const cleaned = raw.replace(/^```json?\s*/i, '').replace(/\s*```$/i, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch (parseErr) {
    console.error('generateMeetingPrepIntel JSON parse failed:', raw.slice(0, 400));
    throw new Error('Claude meeting prep returned unparseable response: ' + parseErr.message);
  }
}

module.exports = {
  gradeSession,
  gradeSessionFast,
  gradeSessionDeep,
  gradePitchFast,
  gradePitchDeep,
  generateMeetingPrepIntel,
};
