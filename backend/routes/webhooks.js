/**
 * Recall.ai webhook receiver.
 * Mounted at /api/bots  → /api/bots/webhook
 * Mounted at /api       → /api/webhooks/recall  (matches Recall dashboard config)
 *
 * Events handled:
 *   bot.status_change     — status updates
 *   recording.done        — recording ready; start transcription
 *   transcript.done       — transcript ready
 *   transcript.failed     — transcription failed
 *   bot.done              — legacy fallback
 */

const express = require('express');
const { getPool } = require('../db/client');
const recall = require('../services/recall');
const meetingIntel = require('../services/meeting-intel');
const tokenManager = require('../services/token-manager');

const router = express.Router();

async function loadTranscriptUtterances(transcriptId) {
  const artifact = await recall.getTranscriptArtifact(transcriptId).catch(() => null);
  const downloadUrl = artifact?.data?.download_url || artifact?.download_url || artifact?.data?.data?.download_url || null;
  if (!downloadUrl) return { utterances: null, downloadUrl: null };

  const resp = await fetch(downloadUrl);
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`failed to fetch transcript download: ${resp.status}: ${text}`);
  }

  const payload = await resp.json();
  return { utterances: recall.normaliseTranscriptDownload(payload), downloadUrl };
}

async function hydrateMeetingContext(pool, botId) {
  let meetingMeta = {};
  let orgId = null;

  const { rows } = await pool.query(
    `SELECT b.org_id, b.recording_url, m.title, m.prospect_email, m.prospect_name, m.starts_at
       FROM meeting_bots b
       LEFT JOIN meetings m ON m.id = b.meeting_id
      WHERE b.recall_bot_id = $1
      LIMIT 1`,
    [botId]
  ).catch(() => ({ rows: [] }));

  if (rows[0]) {
    orgId = rows[0].org_id || null;
    meetingMeta = {
      meetingTitle:  rows[0].title,
      prospectEmail: rows[0].prospect_email,
      prospectName:  rows[0].prospect_name,
      date: rows[0].starts_at?.toISOString?.()?.slice(0, 10),
      transcriptUrl: rows[0].recording_url || null,
    };
  }

  const creds = (orgId && tokenManager.isConfigured())
    ? await tokenManager.getOrgCredentials(orgId).catch(() => ({}))
    : {};

  return { meetingMeta, creds };
}

// raw body required for HMAC verification — applies to both path aliases
router.use('/bots/webhook', express.raw({ type: '*/*' }));
router.use('/webhooks/recall', express.raw({ type: '*/*' }));

async function handleRecallWebhook(req, res) {
  const sig = req.headers['x-recall-signature'];
  const raw = req.body instanceof Buffer ? req.body.toString('utf8') : '';

  if (process.env.RECALL_SECRET && !recall.verifyWebhook(raw, sig)) {
    return res.status(401).json({ error: 'invalid signature' });
  }

  let event;
  try { event = JSON.parse(raw); } catch { return res.status(400).end(); }

  const botId = event?.data?.bot_id || event?.bot_id || event?.data?.bot?.id;
  const recordingId = event?.data?.recording?.id || event?.recording?.id || event?.data?.recording_id || null;
  const transcriptId = event?.data?.transcript?.id || event?.transcript?.id || null;
  if (!botId && !recordingId && !transcriptId) return res.status(200).end();

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
    } else if (type === 'recording.done') {
      const started = await pool.query(
        `UPDATE meeting_bots
            SET status='transcribing',
                status_detail='recording.done',
                updated_at=NOW()
          WHERE recall_bot_id=$1
            AND status <> 'transcribing'`,
        [botId]
      );

      if (!started.rowCount) {
        return res.status(200).end();
      }

      setImmediate(async () => {
        try {
          if (!recordingId) {
            console.warn(`[webhook] recording.done missing recording id for bot ${botId}`);
            return;
          }

          await recall.createTranscript(recordingId, {
            apiKey: process.env.RECALL_API_KEY,
            language: 'auto',
            useSeparateStreams: true,
          });

          console.log(`[webhook] started transcript job for recording ${recordingId}`);
        } catch (err) {
          console.error('[webhook] create transcript failed:', err.message);
        }
      });
    } else if (type === 'transcript.done') {
      const transcriptResult = transcriptId
        ? await loadTranscriptUtterances(transcriptId).catch(() => null)
        : null;
      const transcriptSource = transcriptResult?.utterances || null;

      const bot = botId ? await recall.getBot(botId).catch(() => null) : null;

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
          transcriptSource ? JSON.stringify(transcriptSource) : null,
          transcriptResult?.downloadUrl || null,
          bot?.video_url || bot?.recording?.download_url || null,
          bot?.duration || null,
          botId,
        ]
      );

      if (!transcriptSource) {
        console.warn(`[webhook] transcript.done without transcript payload for bot ${botId} -- skipping intel`);
        return;
      }

      setImmediate(async () => {
        try {
          const { meetingMeta, creds } = await hydrateMeetingContext(pool, botId);
          meetingMeta.transcriptUrl = event?.data?.transcript?.download_url || event?.transcript?.download_url || meetingMeta.transcriptUrl || null;
          await meetingIntel.runPipeline(transcriptSource, meetingMeta, creds);
        } catch (err) {
          console.error('[webhook] post-call pipeline error:', err.message);
        }
      });
    } else if (type === 'transcript.failed') {
      const subCode = event.data?.status?.sub_code || event.data?.data?.sub_code || event.data?.sub_code || 'failed';
      await pool.query(
        `UPDATE meeting_bots
            SET status='failed',
                status_detail=$1,
                updated_at=NOW()
          WHERE recall_bot_id=$2`,
        [subCode, botId]
      );
      console.warn(`[webhook] transcript failed for bot ${botId}: ${subCode}`);
    } else if (type === 'bot.done') {
      // Legacy fallback: use the bot transcript endpoint if Recall sends it.
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

      setImmediate(async () => {
        try {
          const { meetingMeta, creds } = await hydrateMeetingContext(pool, botId);
          let transcriptSource = transcript;

          if (transcriptSource) {
            meetingMeta.transcriptUrl = bot?.transcript?.download_url || null;
          }

          if (!transcriptSource) {
            console.warn(`[webhook] no transcript available for bot ${botId} -- skipping intel`);
            return;
          }

          await meetingIntel.runPipeline(transcriptSource, meetingMeta, creds);
        } catch (err) {
          console.error('[webhook] post-call pipeline error:', err.message);
        }
      });
    }

    res.status(200).end();
  } catch (err) {
    console.error('[webhook] error:', err);
    res.status(500).end();
  }
}

router.post('/bots/webhook', handleRecallWebhook);
router.post('/webhooks/recall', handleRecallWebhook);

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
