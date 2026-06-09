'use strict';

/**
 * Slack DM delivery service.
 *
 * Functions now accept a `creds` object as their first argument:
 *   { botToken, slackUserId }
 *
 * Falls back to env vars (SLACK_BOT_TOKEN / SLACK_USER_ID) when creds are
 * omitted, so existing call-sites continue to work without changes.
 *
 * Env vars (fallback only — prefer storing tokens in Supabase integrations):
 *   SLACK_BOT_TOKEN
 *   SLACK_USER_ID
 */

function _resolve(creds) {
  return {
    botToken:   creds?.botToken   || process.env.SLACK_BOT_TOKEN  || null,
    slackUserId: creds?.slackUserId || process.env.SLACK_USER_ID   || null,
  };
}

function isConfigured(creds) {
  const r = _resolve(creds);
  return !!(r.botToken && r.slackUserId);
}

/**
 * Send a plain-text DM.
 *
 * @param {object} [creds]  — { botToken, slackUserId } — omit to use env vars
 * @param {string} text
 */
async function sendDM(creds, text) {
  // Back-compat: if creds is a string, treat as (text) call
  if (typeof creds === 'string') { text = creds; creds = null; }
  const { botToken, slackUserId } = _resolve(creds);
  if (!botToken || !slackUserId) {
    console.warn('[slack] credentials missing — skipping DM');
    return null;
  }

  const resp = await fetch('https://slack.com/api/chat.postMessage', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${botToken}`,
      'Content-Type': 'application/json; charset=utf-8',
    },
    body: JSON.stringify({ channel: slackUserId, text }),
  });

  const data = await resp.json();
  if (!data.ok) throw new Error(`Slack API error: ${data.error}`);
  return data;
}

/**
 * Send a Block Kit DM.
 *
 * @param {object} [creds]  — { botToken, slackUserId }
 * @param {string} text     — fallback notification text
 * @param {Array}  blocks
 */
async function sendBlocksDM(creds, text, blocks) {
  // Back-compat: if creds is a string, treat as (text, blocks) call
  if (typeof creds === 'string') { blocks = text; text = creds; creds = null; }
  const { botToken, slackUserId } = _resolve(creds);
  if (!botToken || !slackUserId) {
    console.warn('[slack] credentials missing — skipping DM');
    return null;
  }

  const resp = await fetch('https://slack.com/api/chat.postMessage', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${botToken}`,
      'Content-Type': 'application/json; charset=utf-8',
    },
    body: JSON.stringify({ channel: slackUserId, text, blocks }),
  });

  const data = await resp.json();
  if (!data.ok) throw new Error(`Slack API error: ${data.error}`);
  return data;
}

/**
 * Send the standard post-call briefing DM.
 *
 * @param {object} [creds]  — { botToken, slackUserId } — omit to use env vars
 * @param {object} opts     — { contactName, summary, nextSteps, dealUrl, meetingTitle }
 */
async function sendCallBriefing(creds, opts) {
  // Back-compat: if creds has contactName it is the opts object
  if (creds && creds.contactName) { opts = creds; creds = null; }

  const { contactName, summary, nextSteps, dealUrl, meetingTitle } = opts || {};

  const steps = nextSteps?.length
    ? nextSteps.map((s, i) => `${i + 1}. ${s}`).join('\n')
    : '_None identified_';

  const blocks = [
    {
      type: 'header',
      text: { type: 'plain_text', text: `📞 Post-call brief: ${contactName}`, emoji: true },
    },
    { type: 'divider' },
    { type: 'section', text: { type: 'mrkdwn', text: `*Summary*\n${summary}` } },
    { type: 'section', text: { type: 'mrkdwn', text: `*Next steps*\n${steps}` } },
  ];

  if (dealUrl) {
    blocks.push({
      type: 'actions',
      elements: [{
        type: 'button',
        text: { type: 'plain_text', text: 'Open in Pipedrive', emoji: true },
        url: dealUrl,
        action_id: 'open_pipedrive',
      }],
    });
  }

  const fallbackText = `Post-call brief: ${contactName} — ${summary}`;
  return sendBlocksDM(creds, fallbackText, blocks);
}

module.exports = { isConfigured, sendDM, sendBlocksDM, sendCallBriefing };
