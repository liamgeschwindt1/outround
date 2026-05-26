/**
 * Recall.ai webhook receiver.
 * Mounted at /api/bots — no auth, HMAC verified.
 *
 * Events handled:
 *   bot.status_change     — status updates
 *   bot.done              — bot left call
 *   transcript.done       — transcript ready
 */

const express = require('express');
const { getPool } = require('../db/client');
const recall = require('../services/recall');

const router = express.Router();

// raw body required for HMAC verification
router.use('/bots/webhook', express.raw({ type: '*/*' }));

router.post('/bots/webhook', async (req, res) => {
  const sig = req.headers['x-recall-signature'];
  const raw = req.body instanceof Buffer ? req.body.toString('utf8') : '';

  if (process.env.RECALL_SECRET && !recall.verifyWebhook(raw, sig)) {
    return res.status(401).json({ error: 'invalid signature' });
  }

  let event;
  try { event = JSON.parse(raw); } catch { return res.status(400).end(); }

  const botId = event?.data?.bot_id || event?.bot_id || event?.data?.bot?.id;
  if (!botId) return res.status(200).end();

  const pool = getPool();
  if (!pool) return res.status(200).end();

  try {
    const type = event.event || event.type;

    if (type === 'bot.status_change') {
      const code = event.data?.status?.code || 'unknown';
      await pool.query(
        `UPDATE meeting_bots
            SET status=$1, status_detail=$2, updated_at=NOW()
          WHERE recall_bot_id=$3`,
        [mapStatus(code), code, botId]
      );
    } else if (type === 'bot.done' || type === 'transcript.done') {
      let transcript = null;
      try { transcript = await recall.getTranscript(botId); } catch {}
      const bot = await recall.getBot(botId).catch(() => null);

      await pool.query(
        `UPDATE meeting_bots
            SET status='done',
                transcript=$1,
                transcript_url=$2,
                recording_url=$3,
                duration_seconds=$4,
                updated_at=NOW()
          WHERE recall_bot_id=$5`,
        [
          transcript ? JSON.stringify(transcript) : null,
          bot?.transcript?.download_url || null,
          bot?.video_url || bot?.recording?.download_url || null,
          bot?.duration || null,
          botId,
        ]
      );
      // TODO: kick off Claude post-call analysis + Pipedrive push
    }

    res.status(200).end();
  } catch (err) {
    console.error('[webhook] error:', err);
    res.status(500).end();
  }
});

function mapStatus(code) {
  const m = {
    'ready':                 'scheduled',
    'joining_call':          'joining',
    'in_waiting_room':       'joining',
    'in_call_not_recording': 'in_call',
    'in_call_recording':     'in_call',
    'call_ended':            'done',
    'done':                  'done',
    'fatal':                 'failed',
  };
  return m[code] || 'scheduled';
}

module.exports = router;
