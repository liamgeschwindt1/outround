'use strict';

/**
 * Slack DM delivery service.
 *
 * Env vars required:
 *   SLACK_BOT_TOKEN  — xoxb-... bot token with chat:write scope
 *   SLACK_USER_ID    — Slack user ID to DM (e.g. U01XXXXXXX)
 *
 * All functions no-op gracefully when env vars are missing.
 */

function isConfigured() {
  return !!(process.env.SLACK_BOT_TOKEN && process.env.SLACK_USER_ID);
}

/**
 * Send a plain-text DM to the configured SLACK_USER_ID.
 */
async function sendDM(text) {
  if (!isConfigured()) {
    console.warn('[slack] SLACK_BOT_TOKEN or SLACK_USER_ID not set — skipping DM');
    return null;
  }

  const resp = await fetch('https://slack.com/api/chat.postMessage', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.SLACK_BOT_TOKEN}`,
      'Content-Type': 'application/json; charset=utf-8',
    },
    body: JSON.stringify({
      channel: process.env.SLACK_USER_ID,
      text,
    }),
  });

  const data = await resp.json();
  if (!data.ok) throw new Error(`Slack API error: ${data.error}`);
  return data;
}

/**
 * Send a rich DM with Block Kit blocks.
 */
async function sendBlocksDM(text, blocks) {
  if (!isConfigured()) {
    console.warn('[slack] SLACK_BOT_TOKEN or SLACK_USER_ID not set — skipping DM');
    return null;
  }

  const resp = await fetch('https://slack.com/api/chat.postMessage', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.SLACK_BOT_TOKEN}`,
      'Content-Type': 'application/json; charset=utf-8',
    },
    body: JSON.stringify({
      channel: process.env.SLACK_USER_ID,
      text,   // fallback for notifications
      blocks,
    }),
  });

  const data = await resp.json();
  if (!data.ok) throw new Error(`Slack API error: ${data.error}`);
  return data;
}

/**
 * Send the standard post-call briefing DM.
 *
 * @param {object} opts
 * @param {string} opts.contactName
 * @param {string} opts.summary
 * @param {string[]} opts.nextSteps
 * @param {string} [opts.dealUrl]   — Pipedrive deal URL
 * @param {string} [opts.meetingTitle]
 */
async function sendCallBriefing({ contactName, summary, nextSteps, dealUrl, meetingTitle }) {
  const title = meetingTitle ? `*${meetingTitle}*` : `*Call with ${contactName}*`;
  const steps = nextSteps?.length
    ? nextSteps.map((s, i) => `${i + 1}. ${s}`).join('\n')
    : '_None identified_';

  const blocks = [
    {
      type: 'header',
      text: { type: 'plain_text', text: `📞 Post-call brief: ${contactName}`, emoji: true },
    },
    { type: 'divider' },
    {
      type: 'section',
      text: { type: 'mrkdwn', text: `*Summary*\n${summary}` },
    },
    {
      type: 'section',
      text: { type: 'mrkdwn', text: `*Next steps*\n${steps}` },
    },
  ];

  if (dealUrl) {
    blocks.push({
      type: 'actions',
      elements: [
        {
          type: 'button',
          text: { type: 'plain_text', text: 'Open in Pipedrive', emoji: true },
          url: dealUrl,
          action_id: 'open_pipedrive',
        },
      ],
    });
  }

  const fallbackText = `Post-call brief: ${contactName} — ${summary}`;
  return sendBlocksDM(fallbackText, blocks);
}

module.exports = { isConfigured, sendDM, sendBlocksDM, sendCallBriefing };
