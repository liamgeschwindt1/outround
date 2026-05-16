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

  const client = new Anthropic.default({ apiKey: process.env.ANTHROPIC_KEY });

  const transcriptText = transcript
    .map((t) => `[${t.speaker.toUpperCase()}] ${t.text}`)
    .join('\n');

  const prompt = `You are the grading engine for Outround, a pre-performance readiness platform for sales professionals. You are not a trainer. You are a brutal, honest coach who has heard thousands of cold calls and has no patience for vague feedback.

You are grading a cold call practice session. The rep was calling ${persona.name}, ${persona.title} at ${persona.company} in ${persona.location}. The persona is: ${persona.traits.join(', ')}.

THE TRANSCRIPT:
${transcriptText}

AUDIO METRICS:
- Words per minute: ${audioMetrics.wpm}
- Talk ratio: Rep ${audioMetrics.talk_ratio.rep}% / Prospect ${audioMetrics.talk_ratio.prospect}%
- Filler words: ${audioMetrics.filler_words}
- Longest rep monologue: ${audioMetrics.longest_monologue_seconds}s
- Avg response latency: ${audioMetrics.avg_response_latency_seconds}s

YOUR TASK:
Score the call across four dimensions (0-100 each):
1. Opening hook — did they earn the next 30 seconds?
2. Objection handling — did they fold or pivot intelligently?
3. Talk ratio — did they listen or monologue?
4. Clear ask — was there a specific, confident next step?

Then provide 3-5 coaching items. Each must:
- Name the specific moment (with a direct quote)
- Say exactly what went wrong or right in plain language — not HR language
- Give a specific alternative the rep can use next time
- Be the kind of feedback that makes the rep wince if they failed, or feel genuinely proud if they succeeded

Rules for feedback:
- Never say "confrontational dynamic" — say "you were rude to this prospect"
- Never say "professionalism broke down" — say "you told a CTO to hold on while you finished talking. The call ended there."
- Be specific about the timestamp if you can identify it
- If the rep did something genuinely well, say so clearly — do not soften it with caveats
- If the call was a disaster, say so. The rep needs to know.

Return valid JSON only. No preamble, no markdown:
{
  "overall_score": 0-100,
  "score_breakdown": {
    "opening": 0-100,
    "objections": 0-100,
    "talk_ratio": 0-100,
    "clear_ask": 0-100
  },
  "headline": "One sentence verdict on the call — direct and specific",
  "coaching_feedback": [
    {
      "title": "Short label for this moment",
      "score": 0-100,
      "score_label": "bad|mid|good",
      "body": "What happened and why it matters. Plain language. No softening.",
      "quote": "The exact words the rep said that this feedback relates to",
      "action": "Specific alternative they should use next time — word for word if possible"
    }
  ],
  "sentiment_timeline": [
    { "start_pct": 0, "end_pct": 20, "sentiment": "neutral" },
    { "start_pct": 21, "end_pct": 60, "sentiment": "positive" }
  ]
}`;

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2000,
    messages: [{ role: 'user', content: prompt }],
  });

  const raw = response.content[0].text.trim();

  // Strip any accidental markdown fences
  const cleaned = raw.replace(/^```json?\s*/i, '').replace(/\s*```$/i, '');
  return JSON.parse(cleaned);
}

module.exports = { gradeSession };
