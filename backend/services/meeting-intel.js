'use strict';

/**
 * Meeting intelligence — Claude-powered post-call extraction.
 *
 * All public functions now accept a `creds` argument (third param for most)
 * so per-org credentials fetched from Supabase can be threaded through.
 * Falls back to env vars when creds are omitted, preserving backward compat.
 *
 * Shared service credentials that remain as env vars per spec:
 *   ANTHROPIC_API_KEY
 *
 * Per-org credentials (now fetched from Supabase integrations table):
 *   pipedriveApiKey, pipedriveDomain, slackBotToken, slackUserId
 */

const Anthropic = require('@anthropic-ai/sdk').default || require('@anthropic-ai/sdk');

// ── Claude extraction ──────────────────────────────────────────────────────────────

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
 * @param {object} [creds]          — { anthropicApiKey } — falls back to ANTHROPIC_API_KEY env
 * @returns {Promise<object>}       — parsed extraction result
 */
async function extractIntelligence(transcript, context = {}, creds = {}) {
  const apiKey = creds.anthropicApiKey || process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not configured');

  const client = new Anthropic({ apiKey });

  const transcriptText = Array.isArray(transcript)
    ? transcript
        .map((u) => {
          const ts = u.start != null ? ` [${formatTimestamp(u.start)}]` : '';
          return `[${u.speaker}${ts}] ${u.text}`;
        })
        .join('\n')
    : String(transcript);

  const contextBlock = [
    context.meetingTitle && `Meeting: ${context.meetingTitle}`,
    context.date && `Date: ${context.date}`,
    context.attendees?.length && `Attendees: ${context.attendees.join(', ')}`,
  ]
    .filter(Boolean)
    .join('\n');

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
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0');
  const s = Math.floor(seconds % 60)
    .toString()
    .padStart(2, '0');
  return `${m}:${s}`;
}

// ── Pipedrive push (API key auth) ──────────────────────────────────────────

const PIPEDRIVE_BASE = process.env.PIPEDRIVE_API_URL || 'https://api.pipedrive.com/v1';

function pdHeaders(apiKey) {
  if (!apiKey) throw new Error('Pipedrive API key not provided');
  return { 'Content-Type': 'application/json' };
}

function pdUrl(path, apiKey) {
  return `${PIPEDRIVE_BASE}${path}?api_token=${apiKey}`;
}

async function pdGet(path, apiKey) {
  const resp = await fetch(pdUrl(path, apiKey));
  if (!resp.ok) throw new Error(`Pipedrive GET ${path} → ${resp.status}`);
  return resp.json();
}

async function pdPost(path, body, apiKey) {
  const resp = await fetch(pdUrl(path, apiKey), {
    method: 'POST',
    headers: pdHeaders(apiKey),
    body: JSON.stringify(body),
  });
  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(`Pipedrive POST ${path} → ${resp.status}: ${txt}`);
  }
  return resp.json();
}

async function pdPut(path, body, apiKey) {
  const resp = await fetch(pdUrl(path, apiKey), {
    method: 'PUT',
    headers: pdHeaders(apiKey),
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
async function findPersonByEmail(email, apiKey) {
  if (!apiKey || !email) return null;
  try {
    const data = await pdGet(
      `/persons/search?term=${encodeURIComponent(email)}&fields=email&exact_match=true&limit=1`,
      apiKey
    );
    return data?.data?.items?.[0]?.item || null;
  } catch {
    return null;
  }
}

/**
 * Find the most recent open deal for a Pipedrive person.
 */
async function findOpenDeal(personId, apiKey) {
  if (!personId) return null;
  try {
    const data = await pdGet(`/persons/${personId}/deals?status=open&limit=1`, apiKey);
    return data?.data?.[0] || null;
  } catch {
    return null;
  }
}

/**
 * Add a note to a Pipedrive deal.
 */
async function addDealNote(dealId, content, apiKey) {
  return pdPost('/notes', { deal_id: dealId, content }, apiKey);
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
 * @param {object} [creds]  — { pipedriveApiKey, pipedriveDomain } — falls back to env
 * @returns {{ person, deal, note, dealUrl }}
 */
async function pushToPipedrive(intel, meta = {}, creds = {}) {
  const apiKey = creds.pipedriveApiKey || process.env.PIPEDRIVE_API_KEY || null;
  if (!apiKey) {
    console.warn('[meeting-intel] Pipedrive API key not available — skipping Pipedrive push');
    return null;
  }

  const person = await findPersonByEmail(meta.prospectEmail, apiKey);
  const deal = person ? await findOpenDeal(person.id, apiKey) : null;

  // Build note content
  const nextStepsText = (intel.next_steps || [])
    .map(
      (s) =>
        `- ${s.action}${s.owner ? ` (${s.owner})` : ''}${s.due_date ? ` — due ${s.due_date}` : ''}${s.citation ? `  _[${s.citation}]_` : ''}`
    )
    .join('\n');

  const objectionsText = (intel.objections || [])
    .map((o) => `- ${o.objection}${o.citation ? `  _[${o.citation}]_` : ''}`)
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
  ]
    .filter((l) => l !== undefined)
    .join('\n')
    .trim();

  let note = null;
  let dealUrl = null;

  if (deal) {
    note = await addDealNote(deal.id, noteLines, apiKey);

    // Update deal fields if we have them
    const updates = {};
    if (intel.crm_fields?.close_date) updates.expected_close_date = intel.crm_fields.close_date;
    if (Object.keys(updates).length) {
      await pdPut(`/deals/${deal.id}`, updates, apiKey).catch((err) =>
        console.warn('[meeting-intel] deal update failed:', err.message)
      );
    }

    const domain =
      creds.pipedriveDomain || process.env.PIPEDRIVE_DOMAIN || process.env.COMPANY_DOMAIN;
    dealUrl = domain ? `https://${domain}.pipedrive.com/deal/${deal.id}` : null;
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
 * @param {object} [creds]  — { anthropicApiKey, pipedriveApiKey, pipedriveDomain, slackBotToken, slackUserId }
 * @returns {Promise<{ intel, pipedrive, slack }>}
 */
async function runPipeline(transcript, meta = {}, creds = {}) {
  const slack = require('./slack');

  // Step 1: Claude extraction
  const intel = await extractIntelligence(
    transcript,
    {
      meetingTitle: meta.meetingTitle,
      date: meta.date,
      attendees: meta.attendees,
    },
    creds
  );

  // Step 2: Pipedrive push
  let pipedriveResult = null;
  try {
    pipedriveResult = await pushToPipedrive(intel, meta, creds);
  } catch (err) {
    console.error('[meeting-intel] Pipedrive push failed:', err.message);
  }

  // Step 3: Slack DM
  let slackResult = null;
  const slackCreds =
    creds.slackBotToken || creds.slackUserId
      ? { botToken: creds.slackBotToken, slackUserId: creds.slackUserId }
      : null; // null lets sendCallBriefing fall back to env vars
  try {
    slackResult = await slack.sendCallBriefing(slackCreds, {
      contactName: meta.prospectName || meta.prospectEmail || 'Unknown contact',
      summary: intel.summary,
      nextSteps: (intel.next_steps || []).map((s) => s.action),
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
