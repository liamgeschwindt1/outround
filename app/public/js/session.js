'use strict';

// ---------------------------------------------------------------------------
// Load session history + stats from DB on init
// ---------------------------------------------------------------------------
async function loadHistory() {
  try {
    const res = await apiFetch('/api/session/history');
    if (!res.ok) return;
    const { sessions } = await res.json();
    if (!sessions || sessions.length === 0) return;
    _s.history = sessions.map((s) => ({
      name: s.persona_id === 'natalie' ? 'Natalie Pemberton' : 'Hendrik van der Berg',
      role: s.persona_id === 'natalie' ? 'Partner — Baobab Capital' : 'CFO — Vandermeer Logistics',
      score: s.score || 0,
      date: new Date(s.started_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
      duration: fmtSecs(s.duration_seconds || 0),
      mode: s.persona_id === 'natalie' ? 'investor_pitch' : 'cold_call',
    }));
    renderHistory();
  } catch {
    /* offline or no auth — ignore */
  }
}

async function loadStats() {
  try {
    const res = await apiFetch('/api/session/stats');
    if (!res.ok) return;
    const { stats } = await res.json();
    if (!stats || stats.total_sessions === 0) return;
    renderStatsCard(stats);
  } catch {
    /* ignore */
  }
}

function renderStatsCard(s) {
  const card = document.getElementById('statsCard');
  if (!card) return;
  const score = s.avg_score ?? '--';
  const best = s.best_score ?? '--';
  const trends = s.trends || {};
  const sub = [
    { label: 'Opening', val: s.avg_opening ?? '--', trend: trends.opening },
    { label: 'Objections', val: s.avg_objections ?? '--', trend: trends.objections },
    { label: 'Talk ratio', val: s.avg_talk_ratio ?? '--', trend: trends.talk_ratio },
    { label: 'Clear ask', val: s.avg_clear_ask ?? '--', trend: trends.clear_ask },
  ];
  const arrow = (t) => {
    if (t === 'up') return '<span class="sc-trend up" title="Trending up">▲</span>';
    if (t === 'down') return '<span class="sc-trend down" title="Trending down">▼</span>';
    if (t === 'flat') return '<span class="sc-trend flat" title="Flat">→</span>';
    return '';
  };
  const coachBadge =
    s.coach && s.coach.id
      ? `<div class="sc-coach"><div class="sc-coach-av">${s.coach.id.charAt(0).toUpperCase()}</div><div class="sc-coach-meta"><div class="sc-coach-lbl">COACH</div><div class="sc-coach-name">${escHtml(s.coach.id.charAt(0).toUpperCase() + s.coach.id.slice(1))}</div></div></div>`
      : '';
  card.innerHTML = `
    <div class="sc-left">
      <div class="sc-label">AVG SCORE ${arrow(trends.score)}</div>
      <div class="sc-score">${score}</div>
      <div class="sc-meta">Best <strong>${best}</strong></div>
      <div class="sc-counts">
        <span>${s.total_sessions} round${s.total_sessions !== 1 ? 's' : ''}</span>
        <span class="sc-dot">·</span>
        <span>${s.sessions_this_week} this week</span>
        ${s.streak > 1 ? `<span class="sc-dot">·</span><span class="sc-streak">${s.streak}🔥</span>` : ''}
      </div>
      ${coachBadge}
    </div>
    <div class="sc-right">
      ${sub
        .map(
          (x) => `
        <div class="sc-sub">
          <div class="sc-sub-label">${x.label}</div>
          <div class="sc-sub-bar"><div class="sc-sub-fill" style="width:${Math.min(x.val, 100)}%"></div></div>
          <div class="sc-sub-val">${x.val}${arrow(x.trend)}</div>
        </div>`
        )
        .join('')}
    </div>`;
  card.style.display = 'flex';
}

// ---------------------------------------------------------------------------
// Test sample transcripts — winning calls for each mode
// ---------------------------------------------------------------------------
const TEST_TRANSCRIPTS = {
  cold_call: [
    {
      speaker: 'rep',
      text: "Hendrik, quick call — two minutes. I saw Vandermeer grew 40% last year, adding three new depots. That kind of expansion typically creates one specific finance problem: spend variance that doesn't surface until after quarter close because the reconciliation process hasn't scaled with the business. Is that showing up for you?",
      start_ms: 0,
    },
    {
      speaker: 'prospect',
      text: 'Who gave you this number? Make it quick — I have a meeting in five minutes.',
      start_ms: 8000,
    },
    {
      speaker: 'rep',
      text: "Understood. I'm Alex from Spendly. We work with logistics CFOs in the Netherlands who are scaling fast and hitting the same reconciliation wall. I found you on LinkedIn — your growth numbers stood out. The specific problem I'm solving is close cycle time. CFOs at your growth stage typically close a quarter 10 to 14 days late because cost centre data sits across too many systems. What does your current close cycle look like?",
      start_ms: 12000,
    },
    { speaker: 'prospect', text: 'We manage it. We have systems in place.', start_ms: 28000 },
    {
      speaker: 'rep',
      text: "I'd expect that. The CFOs I speak to who say that usually have the right systems — they just have too many of them. The problem isn't capability, it's consolidation time. I'm not asking you to change anything. I want 20 minutes to show you one number your current stack probably can't surface in under an hour. If it's not useful, tell me and I won't call again.",
      start_ms: 33000,
    },
    { speaker: 'prospect', text: 'What number exactly?', start_ms: 53000 },
    {
      speaker: 'rep',
      text: "Real-time committed spend versus approved budget, broken down by depot, updated within the hour. Most logistics CFOs I speak to can only get that view at month end. I want to show you what that looks like live. Thursday at 2pm — does that work? I'll send a calendar invite you can decline if it no longer makes sense.",
      start_ms: 56000,
    },
    { speaker: 'prospect', text: 'Fine. Send me a calendar invite for Thursday.', start_ms: 73000 },
    {
      speaker: 'rep',
      text: "Done. Thursday 2pm — I'll send the invite with a one-line agenda. Thank you, Hendrik.",
      start_ms: 77000,
    },
  ],
  investor_pitch: [
    {
      speaker: 'rep',
      text: "Natalie — the problem: 73% of European B2B sales reps go into high-stakes calls cold. Sales training tools analyse transcripts. None of them analyse your voice. Outround is a pre-performance readiness platform — not training, readiness. You pick your scenario, you face an AI persona that behaves exactly like the real prospect, you get a score on what you said and how you said it. We use Hume AI for vocal affect analysis — no competitor has this. Target is European SMB sales teams, 10 to 100 reps, pricing from 49 euros per seat per month. We have 12 paying teams in beta, 94% seat-level retention at day 60, median user runs 3.4 sessions per week. The landing page is a live demo — every visitor calls Hendrik, gets scored, and the shame of a bad score drives the share. We're raising 400,000 euros to reach 50 paying teams and prove the viral loop. That's the ask.",
      start_ms: 0,
    },
    {
      speaker: 'prospect',
      text: '94% retention across 12 teams — how many total users is that?',
      start_ms: 62000,
    },
    {
      speaker: 'rep',
      text: '87 active users. 12 teams averaging 7 seats. The 94% is seat-level — 82 of the original 87 still active at day 60. We define active as at least two full practice sessions in the trailing two weeks. We set that bar deliberately high.',
      start_ms: 68000,
    },
    {
      speaker: 'prospect',
      text: "What does the Hume AI integration actually surface that a transcript doesn't?",
      start_ms: 82000,
    },
    {
      speaker: 'rep',
      text: "Three things a transcript misses. First, pace under pressure — reps slow down or speed up when nervous and the voice signals it before they're aware. Second, the confidence of the close — whether an ask lands committed or tentative. Third, emotional congruence — when your words say confident but your voice says uncertain, Hendrik picks up on it. The model flags those exact moments in the feedback. That's the differentiation no transcript-only tool can replicate.",
      start_ms: 88000,
    },
    { speaker: 'prospect', text: "What's your biggest risk right now?", start_ms: 110000 },
    {
      speaker: 'rep',
      text: "Honest answer: distribution. The viral mechanic works in early data — our demo page has a 34% email capture rate from strangers, unprompted. The risk is it doesn't scale without a brand presence. The 400k gets us to 50 paying teams and a LinkedIn launch moment with real retention data behind it. That de-risks distribution before Series A.",
      start_ms: 115000,
    },
    { speaker: 'prospect', text: 'I want 30 minutes. Are you free Thursday?', start_ms: 133000 },
    { speaker: 'rep', text: 'Thursday works. Morning or afternoon?', start_ms: 137000 },
    { speaker: 'prospect', text: '10am. My EA will send a hold.', start_ms: 140000 },
    {
      speaker: 'rep',
      text: "Perfect. I'll have the retention data and the live demo ready. Thank you, Natalie.",
      start_ms: 143000,
    },
  ],
};

// ---------------------------------------------------------------------------
// Onboarding — legacy (no auth) and 3-step (authenticated)
// ---------------------------------------------------------------------------
function openSession() {
  goToStep(_s.onboardingDone ? 'mode' : 'onboarding');
}

function completeOnboarding() {
  const fn = (document.getElementById('ob-fn')?.value || '').trim() || 'L';
  const ln = (document.getElementById('ob-ln')?.value || '').trim() || 'G';
  const email = (document.getElementById('ob-email')?.value || '').trim();
  const role = document.getElementById('ob-role')?.value || 'Account Executive';
  _s.user = { name: fn + ' ' + ln, email, role };
  _s.onboardingDone = true;
  updateUserUI();
  loadLeaderboard();
  const overlay = document.getElementById('focusOverlay');
  overlay.classList.remove('open');
  _currentStep = null;
}

function skipOnboarding() {
  _s.onboardingDone = true;
  const overlay = document.getElementById('focusOverlay');
  overlay.classList.remove('open');
  _currentStep = null;
}

function updateUserUI() {
  const ini = (_s.user.name || 'LG')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
  const el = document.getElementById('userAva');
  if (el) el.textContent = ini;
  const av = document.getElementById('ulbav');
  if (av) av.textContent = ini;
  const nm = document.getElementById('ulbn');
  if (nm) nm.textContent = (_s.user.name || '').split(' ')[0] + ' (you)';
}

// 3-step onboarding helpers (used when auth is enabled)
function advanceOnboarding() {
  _s._onboardingSubStep = (_s._onboardingSubStep || 1) + 1;
  goToStep('onboarding');
}

function ob3SelectCoach(el, coachId) {
  document.querySelectorAll('.ob3-coach-card').forEach((c) => {
    c.classList.remove('ob3-coach-selected');
    const chk = c.querySelector('.ob3-coach-check');
    if (chk) chk.style.opacity = '0';
  });
  el.classList.add('ob3-coach-selected');
  const chk = el.querySelector('.ob3-coach-check');
  if (chk) chk.style.opacity = '1';
  _s._selectedCoach = coachId;
}

function finishOnboarding3Step() {
  const coachId = _s._selectedCoach || 'alex';
  completeOnboardingStep3(coachId);
}

// ---------------------------------------------------------------------------
// Session start
// ---------------------------------------------------------------------------
async function beginSession() {
  uiLog('Starting session…', 'send');
  const persona_id = _s.mode === 'investor_pitch' ? 'natalie' : 'hendrik';
  let ok = false;
  try {
    const res = await apiFetch('/api/session/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_name: _s.user.name || null,
        user_email: _s.user.email || null,
        user_role: _s.user.role || null,
        persona_id,
        mode: _s.mode || 'cold_call',
      }),
    });
    if (res.ok) {
      const data = await res.json();
      _s.sessionId = data.session_id;
      uiLog('Session created: ' + data.session_id, 'ok');
      ok = true;
    } else {
      const body = await res.text().catch(() => '');
      uiLog(
        'Session start failed: HTTP ' + res.status + (body ? ' — ' + body.slice(0, 120) : ''),
        'err'
      );
    }
  } catch (err) {
    uiLog('Session start error: ' + err.message, 'err');
  }

  if (!ok) {
    // Don't continue into brief/call if we don't have a session — that path needs sessionId
    if (typeof showToast === 'function')
      showToast('Could not start session. Check connection and try again.');
    try {
      goToStep && goToStep('mode');
    } catch {}
    return;
  }

  if (_s.mode === 'investor_pitch') {
    initiateCall();
  } else {
    startBrief();
  }
}

async function beginPitchSession() {
  goToStep('pitchprep');
  // Prefetch token + warm SDK while user reads the prep card
  prefetchVoiceToken();
  warmConversationSdk();
  // Auto-countdown 5s then kick off
  let secs = 5;
  const update = () => {
    const el = document.getElementById('pitchPrepCountdown');
    if (el) el.textContent = '0:0' + secs;
  };
  update();
  const iv = setInterval(async () => {
    secs--;
    update();
    if (secs <= 0) {
      clearInterval(iv);
      await beginSession();
    }
  }, 1000);
  _s._pitchPrepInterval = iv;
}

function skipPitchPrep() {
  if (_s._pitchPrepInterval) {
    clearInterval(_s._pitchPrepInterval);
    _s._pitchPrepInterval = null;
  }
  beginSession();
}

// ---------------------------------------------------------------------------
// Test mode — inject sample winning transcript, skip real call
// ---------------------------------------------------------------------------
async function runTestSession() {
  // Clear any active countdowns
  if (_briefInterval) {
    clearInterval(_briefInterval);
    _briefInterval = null;
  }
  if (_s._pitchPrepInterval) {
    clearInterval(_s._pitchPrepInterval);
    _s._pitchPrepInterval = null;
  }
  _voiceTokenPromise = null;

  const mode = _s.mode || 'cold_call';
  const transcript = TEST_TRANSCRIPTS[mode];
  if (!transcript) {
    uiLog('No test transcript for mode: ' + mode, 'err');
    return;
  }

  // Create session if not yet created (e.g. triggered from pitchprep before countdown ended)
  if (!_s.sessionId) {
    uiLog('Creating test session…', 'send');
    const persona_id = mode === 'investor_pitch' ? 'natalie' : 'hendrik';
    try {
      const res = await apiFetch('/api/session/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_name: _s.user?.name || null,
          user_email: _s.user?.email || null,
          user_role: _s.user?.role || null,
          persona_id,
          mode,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        _s.sessionId = data.session_id;
        uiLog('Test session: ' + data.session_id, 'ok');
      } else {
        uiLog('Test session start failed: HTTP ' + res.status, 'err');
        return;
      }
    } catch (err) {
      uiLog('Test session start error: ' + err.message, 'err');
      return;
    }
  }

  _s.callDuration = 90;
  await goToStep('loading');
  _startLoadingCycle();

  uiLog('Submitting test transcript (' + transcript.length + ' turns)…', 'send');
  try {
    const r = await apiFetch('/api/session/' + _s.sessionId + '/end-test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transcript, duration_seconds: 90 }),
    });
    if (r.ok) {
      uiLog('Test transcript submitted — polling for results…', 'ok');
      pollForResults();
    } else {
      uiLog('end-test failed: HTTP ' + r.status, 'err');
    }
  } catch (err) {
    uiLog('end-test error: ' + err.message, 'err');
  }
}

// ---------------------------------------------------------------------------
// Brief countdown — auto-transitions to call, or rep can skip early
// ---------------------------------------------------------------------------
let _briefTimer = 30;
let _briefInterval = null;

function skipBrief() {
  clearInterval(_briefInterval);
  initiateCall();
}

function startBrief() {
  goToStep('brief');
  _briefTimer = 30;
  clearInterval(_briefInterval);
  // Prefetch signed URL + warm SDK module in parallel while the brief countdown runs
  prefetchVoiceToken();
  warmConversationSdk();
  setTimeout(() => {
    _briefInterval = setInterval(() => {
      _briefTimer--;
      const el = document.getElementById('briefCountdown');
      if (el) {
        el.textContent = '0:' + String(_briefTimer).padStart(2, '0');
        if (_briefTimer <= 10) el.classList.add('urgent');
      }
      if (_briefTimer <= 0) {
        clearInterval(_briefInterval);
        initiateCall();
      }
    }, 1000);
  }, 280);
}

// ---------------------------------------------------------------------------
// Call — ElevenLabs websocket
// ---------------------------------------------------------------------------
async function initiateCall() {
  if (!_s.sessionId) {
    uiLog('No session ID — cannot start call', 'err');
    return;
  }
  await goToStep('call');
  if (_s.mode !== 'investor_pitch') await playSoundAndWait('/start_call.mp3');
  await startCall();
}

let _voiceTokenPromise = null;
let _conversationSdkPromise = null;

function prefetchVoiceToken() {
  if (!_s.sessionId || _voiceTokenPromise) return _voiceTokenPromise;
  uiLog('Prefetching voice token…', 'send');
  _voiceTokenPromise = apiFetch('/api/session/' + _s.sessionId + '/voice-token')
    .then(async (r) => {
      if (!r.ok) throw new Error('Voice token HTTP ' + r.status);
      const data = await r.json();
      uiLog('Voice token ready (prefetched)', 'ok');
      return data; // { signed_url, overrides }
    })
    .catch((err) => {
      _voiceTokenPromise = null;
      throw err;
    });
  return _voiceTokenPromise;
}

function warmConversationSdk() {
  if (_conversationSdkPromise) return _conversationSdkPromise;
  _conversationSdkPromise = import('https://cdn.jsdelivr.net/npm/@11labs/client/+esm')
    .then((m) => {
      uiLog('ElevenLabs SDK warmed', 'ok');
      return m;
    })
    .catch((err) => {
      _conversationSdkPromise = null;
      throw err;
    });
  return _conversationSdkPromise;
}

async function startCall() {
  _s.callStart = Date.now();
  uiLog('Fetching voice token…', 'send');
  try {
    // Use prefetched promises if available — otherwise kick them off now
    const tokenP = prefetchVoiceToken();
    const sdkP = warmConversationSdk();
    const [tokenData, { Conversation }] = await Promise.all([tokenP, sdkP]);
    uiLog('Voice token received', 'ok');
    const sessionOpts = { signedUrl: tokenData.signed_url };
    if (tokenData.overrides) sessionOpts.overrides = tokenData.overrides;
    _s.conversation = await Conversation.startSession({
      ...sessionOpts,
      onConnect: () => {
        uiLog('ElevenLabs connected', 'ok');
        const cst = document.getElementById('cst');
        if (cst) cst.textContent = 'Connected — start talking';
        const wf = document.getElementById('wf');
        if (wf) wf.classList.remove('idle');
        const ring = document.getElementById('cvRing');
        if (ring) ring.classList.add('on');
        if (_s.mode !== 'investor_pitch') {
          const eb = document.getElementById('eb');
          if (eb) eb.style.display = 'flex';
        }
        if (_s.mode === 'investor_pitch') {
          // Pitch mode: show countdown in the main timer, phase label above it
          _s._pitchPhase = 'pitching';
          let pitchSecs = 60;
          const phaseBar = document.getElementById('pitchPhaseBar');
          const timer = document.getElementById('cvTimer');
          if (phaseBar) phaseBar.textContent = 'YOUR PITCH';
          if (timer) {
            timer.textContent = '1:00';
            timer.style.fontSize = '2.2rem';
            timer.style.fontWeight = '800';
            timer.style.color = 'var(--ink)';
          }
          _s._pitchTimerInterval = setInterval(() => {
            pitchSecs--;
            const bar = document.getElementById('pitchPhaseBar');
            const t = document.getElementById('cvTimer');
            if (pitchSecs > 0) {
              if (t) {
                t.textContent = fmtSecs(pitchSecs);
                t.style.color = pitchSecs <= 10 ? '#e05252' : 'var(--ink)';
              }
            } else {
              clearInterval(_s._pitchTimerInterval);
              _s._pitchPhase = 'qa';
              if (bar) bar.textContent = "NATALIE'S QUESTIONS";
              if (t) {
                t.textContent = '';
                t.style.fontSize = '';
                t.style.fontWeight = '';
                t.style.color = '';
              }
            }
          }, 1000);
        } else {
          _s.callTimerInterval = setInterval(() => {
            const elapsed = _s.callStart ? Math.floor((Date.now() - _s.callStart) / 1000) : 0;
            const el = document.getElementById('cvTimer');
            if (el) el.textContent = fmtSecs(elapsed);
          }, 1000);
        }
      },
      onDisconnect: (details) => {
        const reasonStr = details
          ? ` [${details.reason}${details.message ? ': ' + details.message : ''}]`
          : '';
        uiLog('ElevenLabs disconnected — callEnding=' + _s._callEnding + reasonStr, 'info');
        if (_s.callTimerInterval) {
          clearInterval(_s.callTimerInterval);
          _s.callTimerInterval = null;
        }
        if (_s._pitchTimerInterval) {
          clearInterval(_s._pitchTimerInterval);
          _s._pitchTimerInterval = null;
        }
        if (!_s._callEnding) {
          // Prospect/investor ended the call — reflect in UI then auto-transition
          _s._callEnding = true;
          _s.callDuration = _s.callStart ? Math.floor((Date.now() - _s.callStart) / 1000) : 0;
          const hangupMsg =
            _s.mode === 'investor_pitch' ? 'Natalie ended the call.' : 'Hendrik hung up.';
          uiLog(hangupMsg + ' (' + _s.callDuration + 's)', 'info');
          const wf = document.getElementById('wf');
          if (wf) wf.classList.add('idle');
          const ring = document.getElementById('cvRing');
          if (ring) ring.classList.remove('on');
          const eb = document.getElementById('eb');
          if (eb) eb.style.display = 'none';
          const cst = document.getElementById('cst');
          if (cst) cst.textContent = '';
          const cvTimer = document.getElementById('cvTimer');
          if (cvTimer) {
            cvTimer.textContent = '';
            cvTimer.style.fontSize = '';
            cvTimer.style.fontWeight = '';
            cvTimer.style.color = '';
          }
          const phaseBar = document.getElementById('pitchPhaseBar');
          if (phaseBar) phaseBar.textContent = '';
          const callStep = document.querySelector('.call-step');
          if (callStep) {
            const banner = document.createElement('div');
            banner.className = 'hangup-banner';
            banner.textContent = hangupMsg;
            callStep.insertBefore(banner, callStep.firstChild);
          }
          let convId = null;
          try {
            convId = _s.conversation?.getId ? _s.conversation.getId() : null;
          } catch {}
          if (_s.mode !== 'investor_pitch') playSound('/end_call.mp3');
          setTimeout(() => _finishCall(convId), 2000);
        }
      },
      onMessage: (msg) => {
        if (!msg) return;
        uiLog('msg: ' + (msg.type || msg.source || '?'), 'recv');
        let isAgent = false,
          isUser = false;
        if (msg.source === 'ai' && msg.message) isAgent = true;
        else if (msg.source === 'user' && msg.message) isUser = true;
        else if (msg.type === 'agent_response' && msg.agent_response_event?.agent_response)
          isAgent = true;
        else if (msg.type === 'user_transcript' && msg.user_transcription_event?.user_transcript)
          isUser = true;
        const cst = document.getElementById('cst');
        if (cst)
          cst.textContent = isAgent
            ? _s.mode === 'investor_pitch'
              ? 'Natalie speaking'
              : 'Hendrik speaking'
            : isUser
              ? 'Your turn'
              : cst.textContent;
      },
      onError: (err) => {
        uiLog('ElevenLabs error: ' + (err?.message || err), 'err');
        const cst = document.getElementById('cst');
        if (cst) cst.textContent = 'Connection error';
      },
    });
  } catch (err) {
    uiLog('startCall error: ' + err.message, 'err');
    const cst = document.getElementById('cst');
    if (cst) cst.textContent = 'Failed to connect';
  }
}

// ---------------------------------------------------------------------------
// End call → loading
// ---------------------------------------------------------------------------
async function endCall() {
  if (_s._callEnding) return; // already ending (e.g. Hendrik hung up)
  _s._callEnding = true;
  if (_s.callTimerInterval) {
    clearInterval(_s.callTimerInterval);
    _s.callTimerInterval = null;
  }
  _s.callDuration = _s.callStart ? Math.floor((Date.now() - _s.callStart) / 1000) : 0;
  let conversationId = null;
  if (_s.conversation) {
    try {
      conversationId = _s.conversation.getId ? _s.conversation.getId() : null;
      await _s.conversation.endSession();
    } catch (err) {
      uiLog('ElevenLabs end: ' + err.message, 'err');
    }
  }
  await _finishCall(conversationId);
}

async function _finishCall(conversationId) {
  // Signed URL is single-use — clear it so the next call prefetches a fresh one
  _voiceTokenPromise = null;
  if (_s.callDuration < 15) {
    uiLog('Call too short (' + _s.callDuration + 's) — skipping analysis', 'info');
    await goToStep('tooshort');
    return;
  }
  // Show loading screen, stays open until basic analysis is ready
  await goToStep('loading');
  _startLoadingCycle();

  // Fetch analysis in background (survey runs in parallel — doesn't block)
  uiLog('Ending session (duration: ' + _s.callDuration + 's)', 'send');
  try {
    const r = await apiFetch('/api/session/' + _s.sessionId + '/end', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        elevenlabs_conversation_id: conversationId || null,
        duration_seconds: _s.callDuration,
      }),
    });
    if (r.ok) {
      uiLog('Session ended, polling for results…', 'ok');
      pollForResults();
    } else {
      uiLog('End session failed: HTTP ' + r.status, 'err');
    }
  } catch (err) {
    uiLog('End session error: ' + err.message, 'err');
  }
}

// ---------------------------------------------------------------------------
// Poll for results and lens cycling
// ---------------------------------------------------------------------------
var _lensInterval = null;
let _loadCycleInterval = null;

async function pollForResults() {
  let attempts = 0;
  const check = async () => {
    attempts++;
    if (attempts > 45) return;
    try {
      const res = await apiFetch('/api/session/' + _s.sessionId + '/status');
      const data = await res.json();
      uiLog('Poll status: ' + data.status + (data.score ? ' score=' + data.score : ''), 'recv');
      if (data.status === 'complete') {
        // Analysis complete — open Results page (Screen 2)
        if (_lensInterval) clearInterval(_lensInterval);
        _s.analysis = data;
        openResultsPage(data);
        uiLog('Analysis complete: score=' + data.score, 'ok');
      } else if (data.status === 'processing') {
        setTimeout(check, 2000);
      } else if (attempts <= 5) {
        setTimeout(check, 3000);
      }
    } catch (e) {
      uiLog('Poll error: ' + (e.message || e), 'err');
      if (attempts <= 45) setTimeout(check, 3000);
    }
  };
  check();
}

// ---------------------------------------------------------------------------
// Finish analysis → finish card
// ---------------------------------------------------------------------------
async function finishAnalysis() {
  document.getElementById('analysisPage').classList.remove('open');
  addToHistory();
  await fetchFinishLb();
  loadStats(); // refresh stats card with new session data
  goToStep('finish');
}

async function fetchFinishLb() {
  try {
    const res = await apiFetch('/api/leaderboard');
    const { entries } = await res.json();
    if (entries && entries.length > 0) _s._finishLb = entries;
  } catch {
    /* use fallback */
  }
}

// ---------------------------------------------------------------------------
// History
// ---------------------------------------------------------------------------
function addToHistory() {
  const isPitch = _s.mode === 'investor_pitch';
  const histName = isPitch ? 'Natalie Pemberton' : 'Hendrik van der Berg';
  const histRole = isPitch ? 'Partner — Baobab Capital' : 'CFO — Vandermeer Logistics';
  _s.history.unshift({
    name: histName,
    role: histRole,
    score: _s.analysis?.score || 0,
    date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
    duration: fmtSecs(_s.callDuration),
    mode: _s.mode,
  });
  renderHistory();
}

function renderHistory() {
  const empty = document.getElementById('emptyState');
  const list = document.getElementById('historyList');
  if (!list) return;
  if (_s.history.length === 0) {
    empty.style.display = 'flex';
    list.style.display = 'none';
    return;
  }
  empty.style.display = 'none';
  list.style.display = 'flex';
  list.innerHTML = _s.history
    .map(
      (h) => `<div class="hist-item">
    <div class="hist-flag" style="overflow:hidden;padding:0"><img src="/hendrik.jpg" alt="${escHtml(h.name)}" style="width:100%;height:100%;object-fit:cover" onerror="this.style.display='none';this.parentElement.innerHTML='<svg width=\\'18\\'height=\\'18\\'viewBox=\\'0 0 24 24\\'fill=\\'none\\'stroke=\\'currentColor\\'stroke-width=\\'1.6\\'stroke-linecap=\\'round\\'><circle cx=\\'12\\'cy=\\'8\\'r=\\'4\\'/><path d=\\'M4 20c0-4 3.6-7 8-7s8 3 8 7\\'/></svg>';this.parentElement.style.cssText='display:flex;align-items:center;justify-content:center;color:var(--ink-2)'"/></div>
    <div class="hist-info"><div class="hist-name">${escHtml(h.name)}</div><div class="hist-meta">${escHtml(h.role)} · ${h.duration}</div></div>
    <div class="hist-score">${h.score}</div>
    <div class="hist-date">${h.date}</div>
  </div>`
    )
    .join('');
}

// ---------------------------------------------------------------------------
// Dismiss + Go again
// ---------------------------------------------------------------------------
async function dismissFinish() {
  const overlay = document.getElementById('focusOverlay');
  overlay.classList.remove('open');
  _currentStep = null;
}

async function goAgain() {
  _s.sessionId = null;
  _s.conversation = null;
  _s.analysis = null;
  _s.callStart = null;
  _s.callDuration = 0;
  _s.muted = false;
  _s._callEnding = false;
  _s.mode = 'cold_call';
  _s._pitchPhase = null;
  if (_s.callTimerInterval) {
    clearInterval(_s.callTimerInterval);
    _s.callTimerInterval = null;
  }
  if (_s._pitchTimerInterval) {
    clearInterval(_s._pitchTimerInterval);
    _s._pitchTimerInterval = null;
  }
  clearInterval(_briefInterval);
  // Close full-page screens if open
  const rp = document.getElementById('resultsPage');
  if (rp) rp.classList.remove('open');
  const ap = document.getElementById('analysisPage');
  if (ap) {
    ap.classList.remove('open');
    // Reset layout and topbar for next time
    const layout = ap.querySelector('.an-layout');
    if (layout) layout.classList.remove('no-middle');
    const tb = document.getElementById('anTopbar');
    if (tb) _resetAnTopbar(tb);
  }
  goToStep('mode');
}

// ---------------------------------------------------------------------------
// Share
// ---------------------------------------------------------------------------
function shareLI() {
  const score = _s.analysis?.score || '?';
  const raw = _s.analysis?.headline || '';
  const verdictLine = raw ? `"${raw}"\n\n` : '';
  let text;
  if (_s.mode === 'investor_pitch') {
    text = `Just pitched to an AI seed investor on Outround.\n\n${verdictLine}Scored ${score}/100.\n\nThink you can beat it? → outround.io`;
  } else {
    text = `Just practised a cold call on Outround against an AI Dutch CFO.\n\n${verdictLine}Scored ${score}/100.\n\nTry to beat it → outround.io`;
  }
  window.open(
    'https://www.linkedin.com/feed/?shareActive=true&text=' + encodeURIComponent(text),
    '_blank'
  );
}

// ---------------------------------------------------------------------------
// Leaderboard
// ---------------------------------------------------------------------------
async function loadLeaderboard() {
  try {
    const res = await apiFetch('/api/leaderboard');
    const { entries } = await res.json();
    if (entries && entries.length > 0) renderLeaderboard(entries);
  } catch {
    /* keep static */
  }
}

function renderLeaderboard(entries) {
  const body = document.getElementById('lbBody');
  if (!body) return;
  body.innerHTML = entries
    .map((e, i) => {
      const rank = i + 1;
      const ini = (e.name || '?')
        .split(' ')
        .map((w) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
      return `<div class="lb-row"><div class="lb-rank${rank <= 3 ? ' top' : ''}">${rank}</div><div class="lb-av">${escHtml(ini)}</div><div class="lb-info"><div class="lb-name">${escHtml(e.name)}</div><div class="lb-role">${escHtml(e.role || '')}${e.location ? ' · ' + escHtml(e.location) : ''}</div></div><div class="lb-bar-w"><div class="lb-bar-f" style="width:${e.score}%"></div></div><div class="lb-sc">${e.score}</div></div>`;
    })
    .join('');
}

// ---------------------------------------------------------------------------
// Loading cycle text
// ---------------------------------------------------------------------------
const _LOAD_CYCLE_TEXTS_COLD = [
  'Reading between the lines...',
  'Finding the moment it turned...',
  'Scoring your opening...',
  'Building your coaching report...',
];
const _LOAD_CYCLE_TEXTS_PITCH = [
  'Reading between the lines...',
  'Scoring your problem clarity...',
  'Finding the moment it turned...',
  'Building your coaching report...',
];

function _startLoadingCycle() {
  if (_loadCycleInterval) {
    clearInterval(_loadCycleInterval);
    _loadCycleInterval = null;
  }
  const texts = _s.mode === 'investor_pitch' ? _LOAD_CYCLE_TEXTS_PITCH : _LOAD_CYCLE_TEXTS_COLD;
  let idx = 0;
  const set = () => {
    const el = document.getElementById('loadCycleText');
    if (!el) {
      clearInterval(_loadCycleInterval);
      return;
    }
    el.classList.add('fade');
    setTimeout(() => {
      idx = (idx + 1) % texts.length;
      const el2 = document.getElementById('loadCycleText');
      if (el2) {
        el2.textContent = texts[idx];
        el2.classList.remove('fade');
      }
    }, 360);
  };
  _loadCycleInterval = setInterval(set, 3000);
}

// ---------------------------------------------------------------------------
// Survey — decision tree, runs in parallel with analysis
// ---------------------------------------------------------------------------
const _SURVEY_FLOW = {
  q1: {
    q: 'How did that round feel?',
    opts: ['Tough', 'Decent', 'Strong'],
    next: (a) => (a === 'Tough' ? 'q2a' : a === 'Decent' ? 'q2b' : 'q2c'),
  },
  q2a: {
    q: 'What caught you off guard?',
    opts: ['The opener', 'First objection', 'Ran out of things to say'],
    next: () => 'q3',
  },
  q2b: {
    q: 'What would have helped most?',
    opts: ['Better opening line', 'Handling objections', 'Knowing when to close'],
    next: () => 'q3',
  },
  q2c: {
    q: 'Do you prep like this before every call?',
    opts: ['Yes always', 'Sometimes', 'This was my first time'],
    next: () => 'q3',
  },
  q3: { q: "What's your role?", opts: ['SDR', 'AE', 'Founder', 'Other'], next: () => 'q4' },
  q4: {
    q: 'How often are you in high-stakes calls?',
    opts: ['Daily', 'Weekly', 'A few times a month'],
    next: () => null,
  },
};

function startSurvey(targetId) {
  window._surveyAnswers = {};
  window._surveyTargetId = targetId || 'surveyPanel';
  _renderSurveyQ('q1');
}

function _renderSurveyQ(qId) {
  const panel = document.getElementById(window._surveyTargetId || 'surveyPanel');
  if (!panel) return;
  const q = _SURVEY_FLOW[qId];
  if (!q) {
    _finishSurvey();
    return;
  }
  panel.innerHTML = `<div class="survey-q">
    <div class="survey-eyebrow">Quick question</div>
    <div class="survey-question">${escHtml(q.q)}</div>
    <div class="survey-options">${q.opts
      .map(
        (o) =>
          `<button class="survey-opt" onclick="_pickSurveyOpt('${qId}','${escHtml(o).replace(/'/g, "\\'")}',this)">${escHtml(o)}</button>`
      )
      .join('')}</div>
    <span class="survey-skip-link" onclick="_skipSurvey()">Skip</span>
  </div>`;
}

function _pickSurveyOpt(qId, value, btn) {
  btn
    .closest('.survey-options')
    .querySelectorAll('.survey-opt')
    .forEach((b) => b.classList.remove('selected'));
  btn.classList.add('selected');
  window._surveyAnswers[qId] = value;
  setTimeout(() => {
    const nextId = _SURVEY_FLOW[qId]?.next(value);
    if (nextId) _renderSurveyQ(nextId);
    else _finishSurvey();
  }, 400);
}

function _skipSurvey() {
  _postSurvey();
  const panel = document.getElementById('surveyPanel');
  if (panel)
    panel.innerHTML = `<div class="survey-done"><div class="survey-done-icon">→</div><div class="survey-done-text">Skipped. Results incoming.</div></div>`;
}

function _finishSurvey() {
  _postSurvey();
  const panel = document.getElementById('surveyPanel');
  if (panel)
    panel.innerHTML = `<div class="survey-done"><div class="survey-done-icon">✦</div><div class="survey-done-text">Thanks — that helps.</div></div>`;
}

function _postSurvey() {
  if (!_s.sessionId) return;
  apiFetch('/api/survey', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_id: _s.sessionId, answers: window._surveyAnswers || {} }),
  }).catch(() => {});
}

// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// Win celebration — confetti + banner when meeting is booked
// ---------------------------------------------------------------------------
function _triggerWinCelebration(mode) {
  if (!document.getElementById('_winCelebStyles')) {
    const s = document.createElement('style');
    s.id = '_winCelebStyles';
    s.textContent = `
      @keyframes _confettiFall {
        0%   { transform: translateY(-10px) rotate(0deg); opacity: 1; }
        100% { transform: translateY(105vh) rotate(720deg); opacity: 0; }
      }
      @keyframes _winBannerIn {
        0%   { transform: translateX(-50%) translateY(-20px) scale(0.85); opacity: 0; }
        12%  { transform: translateX(-50%) translateY(0) scale(1.06); opacity: 1; }
        75%  { transform: translateX(-50%) translateY(0) scale(1); opacity: 1; }
        100% { transform: translateX(-50%) translateY(-12px) scale(0.95); opacity: 0; }
      }
    `;
    document.head.appendChild(s);
  }

  // Banner
  const banner = document.createElement('div');
  banner.style.cssText = [
    'position:fixed',
    'top:22%',
    'left:50%',
    'transform:translateX(-50%)',
    'background:#111',
    'color:#fff',
    'font-size:1.05rem',
    'font-weight:800',
    'letter-spacing:0.07em',
    'text-transform:uppercase',
    'padding:14px 36px',
    'border-radius:12px',
    'z-index:9999',
    'pointer-events:none',
    'animation:_winBannerIn 3s ease forwards',
    'white-space:nowrap',
    'box-shadow:0 8px 32px rgba(0,0,0,0.18)',
  ].join(';');
  banner.textContent = mode === 'investor_pitch' ? 'Meeting booked ✓' : 'Meeting set ✓';
  document.body.appendChild(banner);
  setTimeout(() => banner.remove(), 3100);

  // Confetti
  const colours = ['#f59e0b', '#22c55e', '#3b82f6', '#ec4899', '#a855f7', '#ef4444', '#f97316'];
  for (let i = 0; i < 90; i++) {
    const p = document.createElement('div');
    const size = 5 + Math.random() * 9;
    const left = Math.random() * 100;
    const delay = Math.random() * 0.9;
    const dur = 1.6 + Math.random() * 1.6;
    const colour = colours[Math.floor(Math.random() * colours.length)];
    p.style.cssText = [
      'position:fixed',
      'top:0',
      `left:${left}%`,
      `width:${size}px`,
      `height:${size}px`,
      `background:${colour}`,
      `border-radius:${Math.random() > 0.5 ? '50%' : '2px'}`,
      'z-index:9998',
      'pointer-events:none',
      `animation:_confettiFall ${dur}s ${delay}s ease-in forwards`,
    ].join(';');
    document.body.appendChild(p);
    setTimeout(() => p.remove(), (dur + delay) * 1000 + 300);
  }
}

// Results page — Screen 2
// ---------------------------------------------------------------------------
function openResultsPage(data) {
  // Stop loading cycle
  if (_loadCycleInterval) {
    clearInterval(_loadCycleInterval);
    _loadCycleInterval = null;
  }
  // Close loading overlay
  const overlay = document.getElementById('focusOverlay');
  if (overlay) overlay.classList.remove('open');
  const card = document.getElementById('focusCard');
  if (card) card.classList.remove('loading-wide');
  // Open results
  const page = document.getElementById('resultsPage');
  if (page) page.classList.add('open');
  renderResultsPage(data);
  // Win celebration — meeting booked
  const isWin = data.call_verdict === 'advance' || data.call_verdict === 'meeting_set';
  if (isWin) setTimeout(() => _triggerWinCelebration(data.mode || _s.mode || 'cold_call'), 700);
}

function renderResultsPage(data) {
  const el = document.getElementById('resultsInner');
  if (!el) return;
  const score = data.score || 0;
  const bd = data.score_breakdown || {};
  // Auto-detect pitch mode from breakdown keys in case data.mode was lost
  let mode = data.mode || bd.mode || _s.mode || 'cold_call';
  if (
    mode !== 'investor_pitch' &&
    (bd.problem_clarity !== undefined || bd.why_now !== undefined || bd.right_to_win !== undefined)
  ) {
    mode = 'investor_pitch';
  }
  const isPitch = mode === 'investor_pitch';
  const vMap = {
    advance: 'Meeting advanced',
    soft_advance: 'Soft advance',
    dead: 'No next step',
    meeting_set: 'Meeting set',
    deck_requested: 'Deck requested',
    passed: 'Passed',
  };
  const mMap = { building: '↗ Building', flat: '→ Flat', declining: '↘ Declining' };

  const labels = isPitch
    ? ['Problem clarity', 'Why now', 'Right to win', 'Ask clarity']
    : ['Opening', 'Objections', 'Talk ratio', 'Clear ask'];
  const vals = isPitch
    ? [bd.problem_clarity || 0, bd.why_now || 0, bd.right_to_win || 0, bd.ask_clarity || 0]
    : [bd.opening || 0, bd.objections || 0, bd.talk_ratio || 0, bd.clear_ask || 0];

  el.innerHTML = `
    <div class="res-score-num">${score}</div>
    <div class="res-score-den">/100</div>
    <div class="res-badges">
      ${data.call_verdict ? `<div class="verdict-badge ${escHtml(data.call_verdict)}">${escHtml(vMap[data.call_verdict] || data.call_verdict)}</div>` : ''}
      ${data.call_momentum ? `<div class="momentum-badge">${escHtml(mMap[data.call_momentum] || data.call_momentum)}</div>` : ''}
    </div>
    ${data.headline ? `<div class="res-headline">${escHtml(data.headline)}</div>` : ''}
    <div class="res-subcards">
      <div class="res-subcard"><div class="res-subcard-label">${labels[0]}</div><div class="res-subcard-val" id="rsc1">—</div><div class="res-subcard-bar"><div class="res-subcard-fill" id="rsf1"></div></div></div>
      <div class="res-subcard"><div class="res-subcard-label">${labels[1]}</div><div class="res-subcard-val" id="rsc2">—</div><div class="res-subcard-bar"><div class="res-subcard-fill" id="rsf2"></div></div></div>
      <div class="res-subcard"><div class="res-subcard-label">${labels[2]}</div><div class="res-subcard-val" id="rsc3">—</div><div class="res-subcard-bar"><div class="res-subcard-fill" id="rsf3"></div></div></div>
      <div class="res-subcard"><div class="res-subcard-label">${labels[3]}</div><div class="res-subcard-val" id="rsc4">—</div><div class="res-subcard-bar"><div class="res-subcard-fill" id="rsf4"></div></div></div>
    </div>
    ${data.next_session_focus ? `<div class="res-focus-block"><div class="res-focus-lbl">Next focus</div><div class="res-focus-txt">${escHtml(data.next_session_focus)}</div></div>` : ''}
    <div class="res-share-row">
      <button class="share-btn" title="Share on LinkedIn" onclick="shareResults('linkedin')">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
      </button>
      <button class="share-btn" title="Share on WhatsApp" onclick="shareResults('whatsapp')">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
      </button>
      <button class="share-btn" title="Copy for Slack" onclick="shareResults('slack')">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z"/></svg>
      </button>
      <button class="share-btn" title="Copy link" onclick="shareResults('copy')">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
      </button>
      <button class="share-btn" title="Share on X / Twitter" onclick="shareResults('twitter')">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L1.254 2.25H8.08l4.253 5.622zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
      </button>
    </div>
    <div class="res-actions">
      <button class="res-btn-primary" onclick="openDeepAnalysis()">✦ Deep analysis</button>
      <button class="res-btn-secondary" onclick="goAgain()">Go again</button>
    </div>
  `;

  // Animate sub-scores
  setTimeout(() => {
    vals.forEach((v, i) => {
      const vi = 'rsc' + (i + 1);
      const fi = 'rsf' + (i + 1);
      setTimeout(() => {
        const vel = document.getElementById(vi);
        const fel = document.getElementById(fi);
        if (vel) vel.textContent = v;
        if (fel) fel.style.width = v + '%';
      }, i * 150);
    });
  }, 300);
}

function shareResults(platform) {
  const score = _s.analysis?.score || '?';
  const isPitch = (_s.mode || 'cold_call') === 'investor_pitch';
  const text = isPitch
    ? `I scored ${score}/100 pitching to an AI seed investor on Outround. Think you can beat it? → outround.io`
    : `I scored ${score}/100 on a cold call against an AI Dutch CFO. Think you can beat it? → outround.io`;
  const enc = encodeURIComponent(text);
  switch (platform) {
    case 'linkedin':
      window.open('https://www.linkedin.com/feed/?shareActive=true&text=' + enc, '_blank');
      break;
    case 'whatsapp':
      window.open('https://wa.me/?text=' + enc, '_blank');
      break;
    case 'twitter':
      window.open('https://twitter.com/intent/tweet?text=' + enc, '_blank');
      break;
    case 'slack':
      navigator.clipboard
        .writeText(text)
        .then(() => showToast('Copied for Slack'))
        .catch(() => showToast('Copied for Slack'));
      break;
    case 'copy':
      navigator.clipboard
        .writeText('outround.io')
        .then(() => showToast('Link copied'))
        .catch(() => showToast('Link copied'));
      break;
  }
}
