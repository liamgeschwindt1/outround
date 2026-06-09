'use strict';

/**
 * Meeting intelligence — Claude-powered post-call extraction.
 *
 * Takes a transcript (array of utterances or plain text) and returns a
 * structured JSON object with summary, next steps, objections, deal signals,
 * and CRM fields. Every extractable field includes a source citation (timestamp
 * or speaker label from the transcript).
 *
 * Env vars required:
 *   ANTHROPIC_API_KEY  — Claude API key
 *
 * Also contains the Pipedrive push helper that uses PIPEDRIVE_API_KEY directly.
 */

const Anthropic = require('@anthropic-ai/sdk').default || require('@anthropic-ai/sdk');

// ── Claude extraction ──────────────────────────────────────────────────────

const EXTRACTION_PROMPT = `You are a post-call intelligence engine for a B2B sales team. You receive a meeting transcript and extract structured data that will be pushed directly into a CRM.

Rules:
- Be precise. Quote the exact words from the transcript for every citation.
- Source citations must include the speaker label and timestamp (if available), e.g. "[Speaker 1, 00:04:32]".
- If a field cannot be determined from the transcript, set it to null — do not guess.
- next_steps must be actionable, owner-assigned items (e.g. "Alice to send proposal by Friday").
- deal_stage must be one of: prospecting | qualification | proposal | negotiation | closed_won | closed_lost | unknown
- close_date must be ISO 8601 date (YYYY-MM-DD) or null.

Return ONLY valid JSON. No markdown fences. No preamble.

Schema:
{
  "summary": "2–4 sentence overview of what was discussed and the outcome",
  "call_outcome": "advance | soft_advance | dead | unknown",
  "next_steps": [
    { "action": "...", "owner": "...", "due_date": "YYYY-MM-DD or null", "citation": "..." }
  ],
  "objections": [
    { "objection": "...", "response": "...", "resolved": true|false, "citation": "..." }
  ],
  "deal_signals": [
    { "signal": "positive|negative|neutral", "detail": "...", "citation": "..." }
  ],
  "crm_fields": {
    "deal_stage": "...",
    "close_date": "...",
    "deal_value": null,
    "stakeholders": [
      { "name": "...", "title": "...", "email": "...", "role": "champion|blocker|evaluator|unknown" }
    ],
    "budget_confirmed": true|false|null,
    "decision_timeline": "... or null"
  }
}`;

/**
 * Extract structured intelligence from a meeting transcript.
 *
 * @param {string|Array} transcript — plain text or array of {speaker, text, start} utterances
 * @param {object} [context]        — optional metadata (meetingTitle, attendees, date)
 * @returns {Promise<object>}       — parsed extraction result
 */
async function extractIntelligence(transcript, context = {}) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not configured');

  const client = new Anthropic({ apiKey });

  const transcriptText = Array.isArray(transcript)
    ? transcript.map(u => {
        const ts = u.start != null ? ` [${formatTimestamp(u.start)}]` : '';
        return `[${u.speaker}${ts}] ${u.text}`;
      }).join('\n')
    : String(transcript);

  const contextBlock = [
    context.meetingTitle && `Meeting: ${context.meetingTitle}`,
    context.date && `Date: ${context.date}`,
    context.attendees?.length && `Attendees: ${context.attendees.join(', ')}`,
  ].filter(Boolean).join('\n');

  const userMessage = contextBlock
    ? `${contextBlock}\n\nTRANSCRIPT:\n${transcriptText}`
    : `TRANSCRIPT:\n${transcriptText}`;

  const msg = await client.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 2048,
    system: EXTRACTION_PROMPT,
    messages: [{ role: 'user', content: userMessage }],
  });

  const raw = msg.content[0]?.text || '';
  try {
    return JSON.parse(raw);
  } catch {
    throw new Error(`Claude returned non-JSON: ${raw.slice(0, 200)}`);
  }
}

function formatTimestamp(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

// ── Pipedrive push (API key auth) ──────────────────────────────────────────

const PIPEDRIVE_BASE = process.env.PIPEDRIVE_API_URL || 'https://api.pipedrive.com/v1';

function pdHeaders() {
  const key = process.env.PIPEDRIVE_API_KEY;
  if (!key) throw new Error('PIPEDRIVE_API_KEY not configured');
  return { 'Content-Type': 'application/json' };
}

function pdUrl(path) {
  return `${PIPEDRIVE_BASE}${path}?api_token=${process.env.PIPEDRIVE_API_KEY}`;
}

async function pdGet(path) {
  const resp = await fetch(pdUrl(path));
  if (!resp.ok) throw new Error(`Pipedrive GET ${path} → ${resp.status}`);
  return resp.json();
}

async function pdPost(path, body) {
  const resp = await fetch(pdUrl(path), {
    method: 'POST',
    headers: pdHeaders(),
    body: JSON.stringify(body),
  });
  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(`Pipedrive POST ${path} → ${resp.status}: ${txt}`);
  }
  return resp.json();
}

async function pdPut(path, body) {
  const resp = await fetch(pdUrl(path), {
    method: 'PUT',
    headers: pdHeaders(),
    body: JSON.stringify(body),
  });
  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(`Pipedrive PUT ${path} → ${resp.status}: ${txt}`);
  }
  return resp.json();
}

/**
 * Find a Pipedrive person by email address.
 * Returns the first match or null.
 */
async function findPersonByEmail(email) {
  if (!process.env.PIPEDRIVE_API_KEY || !email) return null;
  try {
    const data = await pdGet(
      `/persons/search?term=${encodeURIComponent(email)}&fields=email&exact_match=true&limit=1`
    );
    return data?.data?.items?.[0]?.item || null;
  } catch {
    return null;
  }
}

/**
 * Find the most recent open deal for a Pipedrive person.
 */
async function findOpenDeal(personId) {
  if (!personId) return null;
  try {
    const data = await pdGet(`/persons/${personId}/deals?status=open&limit=1`);
    return data?.data?.[0] || null;
  } catch {
    return null;
  }
}

const STAGE_MAP = {
  prospecting: null,   // resolve dynamically if needed
  qualification: null,
  proposal: null,
  negotiation: null,
  closed_won: null,
  closed_lost: null,
};

/**
 * Add a note to a Pipedrive deal.
 */
async function addDealNote(dealId, content) {
  return pdPost('/notes', { deal_id: dealId, content });
}

/**
 * Push extracted intelligence into Pipedrive.
 *
 * - Finds person by email
 * - Finds associated open deal
 * - Adds a note with full summary + transcript link
 * - Updates deal fields (close date, stage) if determinable
 *
 * @param {object} intel    — output of extractIntelligence()
 * @param {object} meta
 * @param {string} meta.prospectEmail
 * @param {string} [meta.transcriptUrl]
 * @param {string} [meta.meetingTitle]
 * @returns {{ person, deal, note, dealUrl }}
 */
async function pushToPipedrive(intel, meta = {}) {
  if (!process.env.PIPEDRIVE_API_KEY) {
    console.warn('[meeting-intel] PIPEDRIVE_API_KEY not set — skipping Pipedrive push');
    return null;
  }

  const person = await findPersonByEmail(meta.prospectEmail);
  const deal = person ? await findOpenDeal(person.id) : null;

  // Build note content
  const nextStepsText = (intel.next_steps || [])
    .map(s => `- ${s.action}${s.owner ? ` (${s.owner})` : ''}${s.due_date ? ` — due ${s.due_date}` : ''}${s.citation ? `  _[${s.citation}]_` : ''}`)
    .join('\n');

  const objectionsText = (intel.objections || [])
    .map(o => `- ${o.objection}${o.citation ? `  _[${o.citation}]_` : ''}`)
    .join('\n');

  const noteLines = [
    `**${meta.meetingTitle || 'Meeting'} — Post-call brief**`,
    '',
    `**Summary**`,
    intel.summary || '_No summary_',
    '',
    nextStepsText ? `**Next steps**\n${nextStepsText}` : '',
    objectionsText ? `**Objections raised**\n${objectionsText}` : '',
    meta.transcriptUrl ? `**Transcript:** ${meta.transcriptUrl}` : '',
  ].filter(l => l !== undefined).join('\n').trim();

  let note = null;
  let dealUrl = null;

  if (deal) {
    note = await addDealNote(deal.id, noteLines);

    // Update deal fields if we have them
    const updates = {};
    if (intel.crm_fields?.close_date) updates.expected_close_date = intel.crm_fields.close_date;
    if (Object.keys(updates).length) {
      await pdPut(`/deals/${deal.id}`, updates).catch(err =>
        console.warn('[meeting-intel] deal update failed:', err.message)
      );
    }

    const companyDomain = process.env.COMPANY_DOMAIN;
    dealUrl = companyDomain
      ? `https://${companyDomain}.pipedrive.com/deal/${deal.id}`
      : null;
  } else {
    console.warn(`[meeting-intel] No open deal found for ${meta.prospectEmail} — note not added`);
  }

  return { person, deal, note, dealUrl };
}

// ── Full pipeline ──────────────────────────────────────────────────────────

/**
 * Run the full post-call pipeline: extract → Pipedrive → Slack.
 *
 * @param {string|Array} transcript
 * @param {object} meta
 * @param {string} [meta.prospectEmail]
 * @param {string} [meta.prospectName]
 * @param {string} [meta.transcriptUrl]
 * @param {string} [meta.meetingTitle]
 * @param {string[]} [meta.attendees]
 * @param {string} [meta.date]
 * @returns {Promise<{ intel, pipedrive, slack }>}
 */
async function runPipeline(transcript, meta = {}) {
  const slack = require('./slack');

  // Step 1: Claude extraction
  const intel = await extractIntelligence(transcript, {
    meetingTitle: meta.meetingTitle,
    date: meta.date,
    attendees: meta.attendees,
  });

  // Step 2: Pipedrive push
  let pipedriveResult = null;
  try {
    pipedriveResult = await pushToPipedrive(intel, meta);
  } catch (err) {
    console.error('[meeting-intel] Pipedrive push failed:', err.message);
  }

  // Step 3: Slack DM
  let slackResult = null;
  try {
    slackResult = await slack.sendCallBriefing({
      contactName: meta.prospectName || meta.prospectEmail || 'Unknown contact',
      summary: intel.summary,
      nextSteps: (intel.next_steps || []).map(s => s.action),
      dealUrl: pipedriveResult?.dealUrl,
      meetingTitle: meta.meetingTitle,
    });
  } catch (err) {
    console.error('[meeting-intel] Slack DM failed:', err.message);
  }

  return { intel, pipedrive: pipedriveResult, slack: slackResult };
}

module.exports = {
  extractIntelligence,
  findPersonByEmail,
  findOpenDeal,
  pushToPipedrive,
  runPipeline,
};
