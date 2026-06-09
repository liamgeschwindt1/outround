'use strict';

// ---------------------------------------------------------------------------
// Dummy meeting data — replaced by real Google Calendar + Pipedrive data
// when those integrations are connected.
// ---------------------------------------------------------------------------
const DUMMY_MEETINGS = [
  {
    id: 'm1',
    title: 'Discovery call',
    prospect: {
      name: 'Hendrik van der Berg',
      first: 'Hendrik',
      title: 'CFO',
      company: 'Vandermeer Logistics',
      initials: 'HV',
      flag: '🇳🇱',
      linkedin: 'https://linkedin.com',
    },
    time: 'Today · 2:00 PM',
    urgency: 'today',
    deal: {
      name: 'Vandermeer — Q3 Budget Review',
      stage: 'Discovery',
      value: '€48,000',
      days_in_stage: 8,
    },
    outround_done: false,
    locked: false,
    persona_id: 'hendrik',
    mode: 'cold_call',
  },
  {
    id: 'm2',
    title: 'Demo + pricing walk',
    prospect: {
      name: 'Klaus Richter',
      first: 'Klaus',
      title: 'VP Operations',
      company: 'Berliner Handel GmbH',
      initials: 'KR',
      flag: '🇩🇪',
      linkedin: 'https://linkedin.com',
    },
    time: 'Tomorrow · 10:30 AM',
    urgency: 'tomorrow',
    deal: { name: 'Berliner Handel — Annual', stage: 'Demo', value: '€92,000', days_in_stage: 3 },
    outround_done: false,
    locked: true,
    persona_id: 'hendrik',
    mode: 'cold_call',
  },
  {
    id: 'm3',
    title: 'Negotiation follow-up',
    prospect: {
      name: 'Astrid Söderström',
      first: 'Astrid',
      title: 'Head of Finance',
      company: 'Söderström & Partners',
      initials: 'AS',
      flag: '🇸🇪',
      linkedin: 'https://linkedin.com',
    },
    time: 'Thu · 3:00 PM',
    urgency: '',
    deal: {
      name: 'Söderström — SMB Pro',
      stage: 'Negotiation',
      value: '€34,000',
      days_in_stage: 12,
    },
    outround_done: false,
    locked: true,
    persona_id: 'hendrik',
    mode: 'cold_call',
  },
];

// Dummy CRM notes for meeting prep page
const DUMMY_NOTES = [
  {
    date: 'May 19, 2026',
    author: 'You',
    body: 'First call — cold outbound. Hendrik was sceptical but stayed on for 8 minutes. Main objection: "we already have systems in place." Opened the door slightly when I mentioned close cycle time. He asked specifically about depot-level spend visibility. Agreed to a 20-min demo. Send calendar invite.',
  },
  {
    date: 'May 12, 2026',
    author: 'You',
    body: 'LinkedIn touch — no reply. He viewed the profile 2 days later. Good signal.',
  },
  {
    date: 'Apr 30, 2026',
    author: 'You',
    body: 'Initial research: Vandermeer grew 40% last year, added 3 depots (Rotterdam, Ghent, Hamburg). CFO role is relatively new — 14 months. Previous CFO was there 9 years. Finance team is 6 people. No visible tech stack for spend management.',
  },
];

// AI-generated coaching bullets (dummy)
const DUMMY_COACHING = [
  {
    icon: '⚡',
    label: 'Watch your talk ratio',
    body: 'You spoke 68% of your last call with Hendrik. He asked a direct question and you answered with three paragraphs. Let him fill the silence.',
  },
  {
    icon: '🎯',
    label: 'Lead with the depot angle',
    body: "He lit up when you mentioned depot-level visibility. Open with that — don't save it for midway through the call.",
  },
  {
    icon: '🛡',
    label: 'He will object on timing',
    body: '"Q3 budget is set" is his expected move. Have a response ready: you\'re not asking him to move budget, you\'re asking him to decide before the next cycle.',
  },
];

// ---------------------------------------------------------------------------
// Render meetings panel (right column of dashboard)
// Tries /api/meetings/upcoming first, falls back to dummy data so the demo
// stays intact when no Google Calendar account is connected.
// ---------------------------------------------------------------------------
async function renderMeetingsPanel() {
  const panel = document.getElementById('meetingsPanel');
  if (!panel) return;

  let meetings = DUMMY_MEETINGS;
  let connected = false;
  let botConfigured = false;

  try {
    const r = await fetch('/api/meetings/upcoming', { credentials: 'include' });
    if (r.ok) {
      const data = await r.json();
      connected = !!data.connected;
      botConfigured = !!data.bot_configured;
      if (connected && Array.isArray(data.meetings) && data.meetings.length) {
        meetings = data.meetings.map(adaptApiMeeting);
      }
    }
  } catch {
    /* fallback to dummy */
  }

  if (window._s) _s._meetings = meetings;

  const rows = meetings.map((m, i) => meetingRowHtml(m, i, botConfigured)).join('');

  panel.innerHTML = `
    <div class="panel-hdr">
      <div class="panel-title">Upcoming meetings</div>
      <div class="tag" style="background:rgba(59,130,246,0.07);color:#2563eb;border-color:rgba(59,130,246,0.18)">${connected ? 'GCal' : 'Demo'}</div>
    </div>
    <div class="mtg-list">${rows}</div>
    <div class="mtg-footer">
      <span>${connected ? 'Live from Google Calendar + Pipedrive' : 'Powered by Google Calendar + Pipedrive'}</span>
    </div>`;
}

// Map a backend meeting view-model to the dashboard row shape.
function adaptApiMeeting(m) {
  const name = m.prospect?.name || 'Unknown';
  const initials = name
    .split(' ')
    .map((s) => s[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  const tld = (m.prospect?.email || '').split('@')[1]?.split('.').pop() || '';
  const flag =
    { nl: '🇳🇱', de: '🇩🇪', se: '🇸🇪', fr: '🇫🇷', uk: '🇬🇧', es: '🇪🇸', dk: '🇩🇰' }[tld] || '👤';
  const when = m.starts_at ? new Date(m.starts_at) : null;
  const time = when
    ? when.toLocaleString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' })
    : '';
  return {
    id: m.id,
    title: m.title || '',
    prospect: {
      name,
      first: name.split(' ')[0],
      title: '',
      company: m.prospect?.company || '',
      initials,
      flag,
      linkedin: 'https://linkedin.com',
    },
    time,
    urgency: '',
    deal: { name: '', stage: m.deal ? 'Open' : '—', value: '', days_in_stage: 0 },
    outround_done: m.outround_done,
    locked: false,
    persona_id: 'hendrik',
    mode: 'cold_call',
    conference: m.conference,
    bot: m.bot,
    bot_supported: m.bot_supported,
  };
}

function meetingRowHtml(m, i, botConfigured) {
  const stageBg = stageColour(m.deal.stage);
  const doneHtml = m.outround_done
    ? `<div class="mtg-ready-badge">✓ Ready</div>`
    : m.locked
      ? ''
      : `<button class="mtg-cta" onclick="openMeetingPrep('${m.id}')">Get ready →</button>`;
  const lockHtml = m.locked
    ? `<div class="mtg-lock"><svg width="10" height="10" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="2" y="6" width="10" height="7" rx="2"/><path d="M4 6V4a3 3 0 1 1 6 0v2"/></svg></div>`
    : '';

  let botHtml = '';
  if (m.bot_supported) {
    if (!botConfigured) {
      botHtml = ''; // hide entirely if Recall not configured
    } else if (m.bot) {
      botHtml = `<button class="mtg-bot-toggle on" onclick="toggleBot('${m.id}', event)" title="${m.bot.status}">🎙 Bot ${m.bot.status}</button>`;
    } else {
      botHtml = `<button class="mtg-bot-toggle" onclick="toggleBot('${m.id}', event)">+ Send bot</button>`;
    }
  }

  return `
    <div class="mtg-row${m.locked ? ' locked' : ''}${i === 0 ? ' next' : ''}">
      <div class="mtg-av">${m.prospect.flag}</div>
      <div class="mtg-info">
        <div class="mtg-name">${escHtml(m.prospect.name)}</div>
        <div class="mtg-meta">${escHtml(m.prospect.company)}${m.title ? ' · ' + escHtml(m.title) : ''}</div>
        <div class="mtg-bottom">
          <span class="mtg-time">${m.time}</span>
          <span class="mtg-stage" style="${stageBg}">${m.deal.stage}</span>
          ${botHtml}
        </div>
      </div>
      <div class="mtg-actions">
        ${doneHtml}
        ${lockHtml}
      </div>
    </div>`;
}

async function toggleBot(meetingId, ev) {
  ev.stopPropagation();
  const btn = ev.currentTarget;
  const isOn = btn.classList.contains('on');
  btn.disabled = true;
  const original = btn.innerHTML;
  btn.innerHTML = '…';
  try {
    const r = await fetch(`/api/meetings/${meetingId}/bot`, {
      method: isOn ? 'DELETE' : 'POST',
      credentials: 'include',
    });
    if (r.status === 503) {
      const d = await r.json().catch(() => ({}));
      alert(d.error || 'Meeting bot not configured yet');
      btn.innerHTML = original;
      return;
    }
    if (!r.ok) throw new Error(await r.text());
    await renderMeetingsPanel();
  } catch (e) {
    btn.innerHTML = original;
    alert('Could not update bot: ' + e.message);
  } finally {
    btn.disabled = false;
  }
}

function stageColour(stage) {
  const map = {
    Discovery: 'background:rgba(96,165,250,0.08);color:#60a5fa;border-color:rgba(96,165,250,0.25)',
    Demo: 'background:rgba(52,211,153,0.08);color:#34d399;border-color:rgba(52,211,153,0.25)',
    Proposal: 'background:rgba(251,146,60,0.08);color:#fb923c;border-color:rgba(251,146,60,0.25)',
    Negotiation:
      'background:rgba(244,114,182,0.08);color:#f472b6;border-color:rgba(244,114,182,0.25)',
    'Closed Won':
      'background:rgba(74,222,128,0.08);color:#4ade80;border-color:rgba(74,222,128,0.25)',
  };
  return map[stage] || 'background:var(--surface-2);color:var(--ink-2);border-color:var(--border)';
}

// ---------------------------------------------------------------------------
// Meeting prep page
// ---------------------------------------------------------------------------
function openMeetingPrep(meetingId) {
  const pool = (window._s && _s._meetings) || DUMMY_MEETINGS;
  const meeting =
    pool.find((m) => m.id === meetingId) || DUMMY_MEETINGS.find((m) => m.id === meetingId);
  if (!meeting) return;
  _s._activeMeeting = meeting;
  renderMeetingPrepPage(meeting);
  document.getElementById('meetingPrepPage').classList.add('open');
}

function closeMeetingPrep() {
  document.getElementById('meetingPrepPage').classList.remove('open');
  _s._activeMeeting = null;
}

function startSessionFromPrep() {
  closeMeetingPrep();
  // Mark this meeting's outround as done after session
  _s._prepMeetingId = _s._activeMeeting?.id || null;
  openSession();
}

function renderMeetingPrepPage(m) {
  const p = m.prospect;
  const stageBg = stageColour(m.deal.stage);

  const notesHtml = DUMMY_NOTES.map(
    (n) => `
    <div class="prep-note">
      <div class="prep-note-meta">${n.date} · ${n.author}</div>
      <div class="prep-note-body">${escHtml(n.body)}</div>
    </div>`
  ).join('');

  const coachHtml = DUMMY_COACHING.map(
    (c) => `
    <div class="prep-coach-item">
      <div class="prep-coach-icon">${c.icon}</div>
      <div>
        <div class="prep-coach-label">${escHtml(c.label)}</div>
        <div class="prep-coach-body">${escHtml(c.body)}</div>
      </div>
    </div>`
  ).join('');

  document.getElementById('prepContent').innerHTML = `
    <!-- Prospect header -->
    <div class="prep-header">
      <div class="prep-av">${p.flag}</div>
      <div class="prep-header-info">
        <div class="prep-name">${escHtml(p.name)}</div>
        <div class="prep-title-co">${escHtml(p.title)} · ${escHtml(p.company)}</div>
        <div class="prep-badges">
          <span class="prep-stage-badge" style="${stageBg}">${m.deal.stage}</span>
          <span class="prep-deal-val">${m.deal.value}</span>
          <span class="prep-days">${m.deal.days_in_stage}d in stage</span>
          <a class="prep-li-link" href="${p.linkedin}" target="_blank" rel="noopener">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M20.45 20.45h-3.554v-5.57c0-1.327-.024-3.037-1.85-3.037-1.851 0-2.135 1.445-2.135 2.939v5.668H9.357V9h3.414v1.561h.046c.476-.9 1.637-1.85 3.368-1.85 3.602 0 4.267 2.37 4.267 5.455v6.284zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
            LinkedIn
          </a>
        </div>
      </div>
      <div class="prep-header-right">
        <div class="prep-meeting-time">
          <div class="prep-meeting-label">NEXT MEETING</div>
          <div class="prep-meeting-val">${m.time}</div>
          <div class="prep-meeting-title">${escHtml(m.title)}</div>
        </div>
      </div>
    </div>

    <!-- Two-column layout -->
    <div class="prep-cols">
      <div class="prep-left">

        <!-- Intelligence summary -->
        <div class="prep-section">
          <div class="prep-section-title">Prospect intelligence</div>
          <div class="prep-intel-box">
            Hendrik van der Berg joined Vandermeer Logistics as CFO 14 months ago, replacing a 9-year incumbent. He inherited a finance function built for a smaller business — manual reconciliation, siloed depot reporting, and no real-time spend visibility. His mandate is modernisation without disruption. He is data-driven, direct, and deeply sceptical of vendor promises. The 40% growth last year (3 new depots: Rotterdam, Ghent, Hamburg) has exposed gaps he can no longer ignore. He knows the problem exists — he just hasn't committed to solving it externally yet. The way to win him is specificity: show him the exact number he can't see today, and tie it to a cost he's already absorbing.
          </div>
        </div>

        <!-- CRM notes -->
        <div class="prep-section">
          <div class="prep-section-title">CRM notes <span class="prep-section-count">${DUMMY_NOTES.length}</span></div>
          <div class="prep-notes-list">${notesHtml}</div>
        </div>

        <!-- Deal details -->
        <div class="prep-section">
          <div class="prep-section-title">Deal</div>
          <div class="prep-deal-card">
            <div class="prep-deal-row"><span>Deal name</span><strong>${escHtml(m.deal.name)}</strong></div>
            <div class="prep-deal-row"><span>Stage</span><strong>${m.deal.stage}</strong></div>
            <div class="prep-deal-row"><span>Value</span><strong>${m.deal.value}</strong></div>
            <div class="prep-deal-row"><span>Days in stage</span><strong>${m.deal.days_in_stage} days</strong></div>
          </div>
        </div>

      </div>
      <div class="prep-right">

        <!-- AI coaching -->
        <div class="prep-section">
          <div class="prep-section-title">Pre-call coaching</div>
          <div class="prep-coach-list">${coachHtml}</div>
        </div>

        <!-- Persona card -->
        <div class="prep-section">
          <div class="prep-section-title">Your practice persona</div>
          <div class="prep-persona-card">
            <div class="prep-persona-av">🇳🇱</div>
            <div class="prep-persona-info">
              <div class="prep-persona-name">Hendrik van der Berg</div>
              <div class="prep-persona-role">CFO · Vandermeer Logistics</div>
              <div class="prep-persona-traits">
                <span class="prep-trait">Sceptical</span>
                <span class="prep-trait">Time-poor</span>
                <span class="prep-trait">Data-driven</span>
                <span class="prep-trait">Resistance 3/5</span>
              </div>
              <div class="prep-persona-note">Built from your Pipedrive data for this prospect. The AI will behave like ${escHtml(p.first)} based on your CRM history.</div>
            </div>
          </div>
        </div>

        <!-- CTA -->
        <button class="prep-start-btn" onclick="startSessionFromPrep()">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><polygon points="3,2 12,7 3,12"/></svg>
          Start your round
        </button>
        <div class="prep-start-sub">30s brief · then you're live against ${escHtml(p.first)}</div>

      </div>
    </div>`;
}
