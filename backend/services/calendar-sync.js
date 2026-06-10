/**
 * Calendar sync — pulls Google Calendar events, matches them to Pipedrive
 * persons/deals by attendee email, and upserts them into the `meetings` table.
 *
 * Degrades gracefully:
 *   - No GCal connection  → returns { connected:false, meetings:[] }
 *   - No Pipedrive        → meetings returned without deal info
 *   - No DB               → returns the assembled list without persisting
 */

const gcal = require('./gcal');
const pipedrive = require('./pipedrive');
const { getPool } = require('../db/client');

const CONFERENCE_HOSTS = [
  { re: /zoom\.us\//i, provider: 'zoom' },
  { re: /meet\.google\.com/i, provider: 'google_meet' },
  { re: /teams\.microsoft\.com|teams\.live\.com/i, provider: 'teams' },
];

function detectConference(event) {
  const entry = event?.conferenceData?.entryPoints?.find((e) => e.entryPointType === 'video');
  if (entry?.uri) {
    const match = CONFERENCE_HOSTS.find((h) => h.re.test(entry.uri));
    return { url: entry.uri, provider: match?.provider || 'other' };
  }
  const text = `${event?.location || ''} ${event?.description || ''}`;
  const urlRe = /https?:\/\/[^\s<>"]+/gi;
  const urls = text.match(urlRe) || [];
  for (const url of urls) {
    const match = CONFERENCE_HOSTS.find((h) => h.re.test(url));
    if (match) return { url, provider: match.provider };
  }
  return { url: null, provider: null };
}

function pickExternalAttendee(event, ownerEmail) {
  const list = event?.attendees || [];
  const owner = (ownerEmail || '').toLowerCase();
  return list.find((a) => a.email && a.email.toLowerCase() !== owner && !a.resource && !a.self);
}

/**
 * Look up a Pipedrive person + open deal by email. Returns null on failure.
 */
async function findPipedrivePerson(userId, email) {
  if (!email) return null;
  try {
    const data = await pipedrive.get(
      userId,
      `/persons/search?term=${encodeURIComponent(email)}&fields=email&exact_match=true&limit=1`
    );
    const item = data?.data?.items?.[0]?.item;
    if (!item) return null;
    let deal = null;
    try {
      const deals = await pipedrive.get(userId, `/persons/${item.id}/deals?status=open&limit=1`);
      deal = deals?.data?.[0] || null;
    } catch {
      /* ignore */
    }
    return { person: item, deal };
  } catch {
    return null;
  }
}

/**
 * Fetch upcoming meetings for a user, enrich, persist, return view rows.
 */
async function syncUpcoming(userId, ownerEmail, days = 7) {
  let events;
  try {
    const list = await gcal.listUpcomingEvents(userId, days);
    events = list.items || [];
  } catch (err) {
    return { connected: false, error: err.message, meetings: [] };
  }

  const pool = getPool();
  const out = [];

  for (const ev of events) {
    if (ev.status === 'cancelled') continue;
    const conf = detectConference(ev);
    const attendee = pickExternalAttendee(ev, ownerEmail);
    const pd = await findPipedrivePerson(userId, attendee?.email);

    const row = {
      external_event_id: ev.id,
      title: ev.summary || '(untitled)',
      starts_at: ev.start?.dateTime || ev.start?.date,
      ends_at: ev.end?.dateTime || ev.end?.date,
      attendees: ev.attendees || [],
      conference_url: conf.url,
      conference_provider: conf.provider,
      prospect_email: attendee?.email || null,
      prospect_name: pd?.person?.name || attendee?.displayName || null,
      prospect_company: pd?.person?.organization?.name || null,
      pipedrive_person_id: pd?.person?.id || null,
      pipedrive_deal_id: pd?.deal?.id || null,
    };

    if (pool) {
      try {
        const { rows } = await pool.query(
          `INSERT INTO meetings (user_id, source, external_event_id, title, starts_at, ends_at,
              attendees, conference_url, conference_provider,
              prospect_email, prospect_name, prospect_company,
              pipedrive_person_id, pipedrive_deal_id, raw, updated_at)
           VALUES ($1,'gcal',$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14, NOW())
           ON CONFLICT (user_id, source, external_event_id) DO UPDATE SET
              title=EXCLUDED.title, starts_at=EXCLUDED.starts_at, ends_at=EXCLUDED.ends_at,
              attendees=EXCLUDED.attendees,
              conference_url=EXCLUDED.conference_url, conference_provider=EXCLUDED.conference_provider,
              prospect_email=EXCLUDED.prospect_email, prospect_name=EXCLUDED.prospect_name,
              prospect_company=EXCLUDED.prospect_company,
              pipedrive_person_id=EXCLUDED.pipedrive_person_id,
              pipedrive_deal_id=EXCLUDED.pipedrive_deal_id,
              raw=EXCLUDED.raw, updated_at=NOW()
           RETURNING id, outround_done, outround_session_id`,
          [
            userId,
            row.external_event_id,
            row.title,
            row.starts_at,
            row.ends_at,
            JSON.stringify(row.attendees),
            row.conference_url,
            row.conference_provider,
            row.prospect_email,
            row.prospect_name,
            row.prospect_company,
            row.pipedrive_person_id,
            row.pipedrive_deal_id,
            ev,
          ]
        );
        Object.assign(row, rows[0]);
      } catch (err) {
        console.error('[calendar-sync] upsert failed:', err.message);
      }
    }
    out.push(row);
  }

  return { connected: true, meetings: out };
}

module.exports = { syncUpcoming, detectConference };
