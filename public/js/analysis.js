'use strict';

// ---------------------------------------------------------------------------
// Analysis page rendering - Progressive loading UX
// ---------------------------------------------------------------------------

async function renderAnalysisPageLoading(sessionId) {
  const leftEl = document.getElementById('anLeft');
  const middleEl = document.getElementById('anMiddle');
  const rightEl = document.getElementById('anRight');
  if (!leftEl || !middleEl || !rightEl) return;
  
  // Show transcript loading state
  leftEl.innerHTML = '<div class="an-section-label">Annotated transcript</div><p style="font-size:0.76rem;color:var(--ink-2);padding-top:20px">Loading transcript...</p>';
  renderMiddleLoading();
  
  // Show right panel with metrics and lens cycling
  renderRightPanelLoading({});
  
  // Start polling for transcript data (it arrives from ElevenLabs)
  pollForTranscript(sessionId);
}

async function pollForTranscript(sessionId) {
  let attempts = 0;
  const maxAttempts = 30; // Try for ~30 seconds
  
  const check = async () => {
    attempts++;
    try {
      // Poll for status to get transcript
      const res = await fetch('/api/session/' + sessionId + '/status');
      const data = await res.json();
      
      if ((data.status === 'processing' || data.status === 'complete') && data.transcript && data.transcript.length > 0) {
        // Transcript is available — render it
        _s._transcript = data.transcript;
        _s._sentiment = data.sentiment_timeline || [];
        _s._audioMetrics = data.audio_metrics || {};
        if (data.mode) _s.mode = data.mode;
        uiLog('Transcript ready, audio_metrics keys: ' + Object.keys(_s._audioMetrics).join(','), 'ok');
        renderTranscriptOnly(_s._transcript, _s._sentiment, data.mode || _s.mode);
        updateMetricsPanel(_s._audioMetrics);
        return;
      } else if (data.status === 'processing' && attempts < maxAttempts) {
        setTimeout(check, 1000);
      }
    } catch (e) { uiLog('Transcript poll error: ' + e.message, 'err'); if (attempts < maxAttempts) setTimeout(check, 1000); }
  };
  check();
}

function renderTranscriptOnly(transcript, timeline, mode) {
  const el = document.getElementById('anLeft');
  if (!el || !transcript || transcript.length === 0) {
    el.innerHTML = '<div class="an-section-label">Annotated transcript</div><div style="padding:40px 0;text-align:center;font-size:0.74rem;color:var(--ink-3)">Transcript not available.</div>';
    return;
  }
  
  const totalMs = (transcript[transcript.length - 1]?.start_ms) || 1;
  let html = '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">'
    + '<div class="an-section-label" style="margin:0">Annotated transcript</div>'
    + '<div class="tl-legend">'
    + '<div class="leg"><div class="leg-dot" style="background:#22c55e"></div>Positive</div>'
    + '<div class="leg"><div class="leg-dot" style="background:#f59e0b"></div>Neutral</div>'
    + '<div class="leg"><div class="leg-dot" style="background:#ef4444"></div>Disengaged</div>'
    + '</div></div>';

  transcript.forEach((t, idx) => {
    const isRep = t.speaker === 'rep';
    const pct = Math.round(((t.start_ms || 0) / totalMs) * 100);
    const sc = isRep ? 's-n' : sentimentClass(timeline, pct);
    const prospectName = ((mode || _s.mode) === 'investor_pitch') ? 'Natalie' : 'Hendrik';
    html += `<div class="t-line" data-line-idx="${idx}">
      <div class="sent-bar ${sc}"></div>
      <div class="t-spk${isRep ? ' rep' : ''}">${isRep ? 'You' : prospectName}</div>
      <div class="t-content">
        <div class="t-txt${isRep ? ' rep' : ''}">${escHtml(t.text)}</div>
        ${t.start_ms ? `<div class="t-time">${fmtMs(t.start_ms)}</div>` : ''}
      </div>
    </div>`;
  });

  if (timeline && timeline.length > 0) {
    const sentMap = { positive: '#22c55e', neutral: '#f59e0b', negative: '#ef4444' };
    const segs = timeline.map(s => `<div class="tl-seg" style="left:${s.start_pct}%;width:${s.end_pct - s.start_pct}%;background:${sentMap[s.sentiment] || '#ccc'}"></div>`).join('');
    html += `<div class="tl-section"><div class="an-section-label">Prospect sentiment</div><div class="tl-track">${segs}</div><div class="tl-ts"><span>0:00</span><span>${fmtSecs(_s.callDuration)}</span></div></div>`;
  }
  
  el.innerHTML = html;
}

function renderRightPanelLoading(audioMetrics, mode) {
  const el = document.getElementById('anRight');
  if (!el) return;
  
  // Section 1: Score (with lens cycling)
  const scoreSection = document.createElement('div');
  scoreSection.className = 'an-right-section';
  scoreSection.innerHTML = `
    <div style="text-align:center">
      <div id="anScoreValue" style="font-size:2.4rem;font-weight:900;letter-spacing:-0.04em;color:var(--ink);margin-bottom:6px">—</div>
      <div style="font-size:0.6rem;font-weight:700;color:var(--ink-3);letter-spacing:0.12em;text-transform:uppercase;margin-bottom:16px">/100 Performance</div>
      <div class="verdict-row" id="verdictRow"></div>
    </div>
  `;
  
  // Section 2: Deterministic Metrics (appear immediately)
  const metricsSection = document.createElement('div');
  metricsSection.className = 'an-right-section';
  const wpm = audioMetrics.wpm || '—';
  const fill = audioMetrics.filler_words !== undefined ? audioMetrics.filler_words : '—';
  const rep = audioMetrics.talk_ratio?.rep ?? '—';
  const mono = audioMetrics.longest_monologue_seconds ? fmtSecs(audioMetrics.longest_monologue_seconds) : '—';
  
  const wpmOk = typeof wpm === 'number' && wpm >= 140 && wpm <= 190;
  const talkOk = typeof rep === 'number' && rep <= 55;
  const fillOk = typeof fill === 'number' && fill <= 5;
  const monoOk = !audioMetrics.longest_monologue_seconds || audioMetrics.longest_monologue_seconds <= 20;
  
  metricsSection.innerHTML = `
    <div class="an-section-label">Metrics</div>
    <div class="metrics-grid">
      <div class="m-card"><div class="m-lbl">Pace</div><div class="m-val">${typeof wpm === 'number' ? wpm : '—'}<span style="font-size:0.7rem;font-weight:600;color:var(--ink-3)"> wpm</span></div><div class="m-note${wpmOk ? ' ok' : ' warn'}">${wpmOk ? 'Optimal range' : 'Aim 140–190'}</div></div>
      <div class="m-card"><div class="m-lbl">Filler words</div><div class="m-val">${fill}</div><div class="m-note${fillOk ? ' ok' : ' warn'}">${fillOk ? 'Clean delivery' : 'Too many fillers'}</div></div>
      <div class="m-card"><div class="m-lbl">Talk ratio</div><div class="m-val">${rep}<span style="font-size:0.7rem;color:var(--ink-3)">%</span></div><div class="m-note${talkOk ? ' ok' : ' warn'}">${talkOk ? 'Good balance' : 'Talking too much'}</div></div>
      <div class="m-card"><div class="m-lbl">Monologue</div><div class="m-val">${mono}</div><div class="m-note${monoOk ? '' : ' warn'}">${monoOk ? 'Short & punchy' : 'Break it up'}</div></div>
    </div>
  `;
  
  // Section 3: Sub-scores (loading state)
  const resolvedMode = mode || _s.mode || 'cold_call';
  const isPitch = resolvedMode === 'investor_pitch';
  const subLabels = isPitch
    ? ['Problem clarity', 'Why now', 'Right to win', 'Ask clarity']
    : ['Opening hook', 'Objection handling', 'Talk ratio', 'Clear ask'];
  const subscoresSection = document.createElement('div');
  subscoresSection.className = 'an-right-section';
  subscoresSection.innerHTML = `
    <div class="an-section-label">Sub-scores</div>
    <div class="subscores">
      <div class="sc-row">
        <div class="sc-label">${subLabels[0]}</div>
        <div class="sc-bar"><div class="sc-fill" id="anf1"></div></div>
        <div class="sc-val loading" id="anv1">—</div>
      </div>
      <div class="sc-row">
        <div class="sc-label">${subLabels[1]}</div>
        <div class="sc-bar"><div class="sc-fill" id="anf2"></div></div>
        <div class="sc-val loading" id="anv2">—</div>
      </div>
      <div class="sc-row">
        <div class="sc-label">${subLabels[2]}</div>
        <div class="sc-bar"><div class="sc-fill" id="anf3"></div></div>
        <div class="sc-val loading" id="anv3">—</div>
      </div>
      <div class="sc-row">
        <div class="sc-label">${subLabels[3]}</div>
        <div class="sc-bar"><div class="sc-fill" id="anf4"></div></div>
        <div class="sc-val loading" id="anv4">—</div>
      </div>
    </div>
  `;
  
  el.innerHTML = '';
  el.appendChild(scoreSection);
  el.appendChild(metricsSection);
  el.appendChild(subscoresSection);
}

function renderMiddleLoading() {
  const el = document.getElementById('anMiddle');
  if (!el) return;

  el.innerHTML = `
    <div class="an-middle-section">
      <div class="an-middle-label">Analysis in progress</div>
      <div class="lens-container">
        <div class="lens-text" id="lensText" style="opacity:0"></div>
      </div>
    </div>
  `;
  startLensCycling();
}

function updateMetricsPanel(audioMetrics) {
  // Update metrics if they weren't available initially
  const metricsSection = document.querySelector('.an-right-section:nth-child(2)');
  if (!metricsSection) return;
  
  const wpm = audioMetrics.wpm || '—';
  const fill = audioMetrics.filler_words !== undefined ? audioMetrics.filler_words : '—';
  const rep = audioMetrics.talk_ratio?.rep ?? '—';
  const mono = audioMetrics.longest_monologue_seconds ? fmtSecs(audioMetrics.longest_monologue_seconds) : '—';
  
  const wpmOk = typeof wpm === 'number' && wpm >= 140 && wpm <= 190;
  const talkOk = typeof rep === 'number' && rep <= 55;
  const fillOk = typeof fill === 'number' && fill <= 5;
  const monoOk = !audioMetrics.longest_monologue_seconds || audioMetrics.longest_monologue_seconds <= 20;
  
  metricsSection.innerHTML = `
    <div class="an-section-label">Metrics</div>
    <div class="metrics-grid">
      <div class="m-card"><div class="m-lbl">Pace</div><div class="m-val">${typeof wpm === 'number' ? wpm : '—'}<span style="font-size:0.7rem;font-weight:600;color:var(--ink-3)"> wpm</span></div><div class="m-note${wpmOk ? ' ok' : ' warn'}">${wpmOk ? 'Optimal range' : 'Aim 140–190'}</div></div>
      <div class="m-card"><div class="m-lbl">Filler words</div><div class="m-val">${fill}</div><div class="m-note${fillOk ? ' ok' : ' warn'}">${fillOk ? 'Clean delivery' : 'Too many fillers'}</div></div>
      <div class="m-card"><div class="m-lbl">Talk ratio</div><div class="m-val">${rep}<span style="font-size:0.7rem;color:var(--ink-3)">%</span></div><div class="m-note${talkOk ? ' ok' : ' warn'}">${talkOk ? 'Good balance' : 'Talking too much'}</div></div>
      <div class="m-card"><div class="m-lbl">Monologue</div><div class="m-val">${mono}</div><div class="m-note${monoOk ? '' : ' warn'}">${monoOk ? 'Short & punchy' : 'Break it up'}</div></div>
    </div>
  `;
}

async function startLensCycling() {
  try {
    const res = await fetch('/lenses.json');
    const { lenses } = await res.json();
    if (!lenses || lenses.length === 0) return;
    
    let currentIdx = 0;
    const lensEl = document.getElementById('lensText');
    if (!lensEl) return;
    
    // Show lenses with fade in/out
    _lensInterval = setInterval(() => {
      if (!lensEl) return;
      
      // Fade out current
      lensEl.textContent = lenses[currentIdx];
      lensEl.style.opacity = '1';
      
      setTimeout(() => {
        currentIdx = (currentIdx + 1) % lenses.length;
        lensEl.style.opacity = '0';
      }, 3000);
    }, 3500);
    
    // Show first lens immediately
    lensEl.textContent = lenses[0];
    lensEl.style.opacity = '1';
  } catch (e) { uiLog('Lens load error: ' + e.message, 'err'); }
}

function populateAnalysisResults(data) {
  if (_lensInterval) clearInterval(_lensInterval);
  
  const score = data.score || 0;
  const bd = data.score_breakdown || {};
  const vMap = { advance: 'Meeting advanced', soft_advance: 'Soft advance', dead: 'No next step', meeting_set: 'Meeting set', deck_requested: 'Deck requested', passed: 'Passed' };
  const mMap = { building: '↗ Building', flat: '→ Flat', declining: '↘ Declining' };
  
  // Update score — use CSS transition (more reliable than animation-fill-mode:forwards)
  const bigNum = document.getElementById('anScoreValue');
  if (bigNum) {
    bigNum.textContent = score;
    bigNum.style.transition = 'none';
    bigNum.style.opacity = '0';
    bigNum.style.transform = 'scale(0.85)';
    void bigNum.offsetWidth; // force reflow so transition is visible
    bigNum.style.transition = 'opacity 0.3s ease, transform 0.4s cubic-bezier(0.34,1.56,0.64,1)';
    bigNum.style.opacity = '1';
    bigNum.style.transform = 'scale(1)';
  }

  // Update metrics with final data (overrides any earlier loading-state dashes)
  if (data.audio_metrics) {
    updateMetricsPanel(data.audio_metrics);
  }
  
  // Show verdict and momentum in the right panel's verdictRow
  const verdictRow = document.getElementById('verdictRow');
  if (verdictRow) {
    verdictRow.innerHTML = '';
    if (data.call_verdict) {
      const vBadge = document.createElement('div');
      vBadge.className = 'verdict-badge ' + data.call_verdict;
      vBadge.textContent = vMap[data.call_verdict] || data.call_verdict;
      verdictRow.appendChild(vBadge);
    }
    if (data.call_momentum) {
      const mBadge = document.createElement('div');
      mBadge.className = 'momentum-badge';
      mBadge.textContent = mMap[data.call_momentum] || data.call_momentum;
      verdictRow.appendChild(mBadge);
    }
  }
  // Replace middle column with headline + next focus
  const middleEl = document.getElementById('anMiddle');
  if (middleEl) {
    const headline = data.headline || '';
    const focus = data.next_session_focus || '';
    middleEl.innerHTML = `
      <div class="an-middle-section">
        ${headline ? `<div style="font-size:0.8rem;font-weight:700;color:var(--ink);line-height:1.5;margin-bottom:16px">${escHtml(headline)}</div>` : ''}
        ${focus ? `<div class="an-middle-label" style="margin-bottom:6px">Next focus</div><div style="font-size:0.72rem;color:var(--ink-2);line-height:1.6">${escHtml(focus)}</div>` : ''}
      </div>
    `;
  }
  
  // Populate sub-scores
  const mode = data.mode || (bd.mode) || _s.mode || 'cold_call';
  const isPitch = mode === 'investor_pitch' || bd.problem_clarity !== undefined || bd.why_now !== undefined;
  const subVals = isPitch
    ? [bd.problem_clarity||0, bd.why_now||0, bd.right_to_win||0, bd.ask_clarity||0]
    : [bd.opening||0, bd.objections||0, bd.talk_ratio||0, bd.clear_ask||0];
  setTimeout(() => {
    subVals.forEach((v, i) => {
      setTimeout(() => {
        const vel = document.getElementById('anv' + (i+1));
        const fel = document.getElementById('anf' + (i+1));
        if (vel) {
          vel.classList.remove('loading');
          vel.textContent = v;
        }
        if (fel) fel.style.width = v + '%';
      }, i * 150);
    });
  }, 200);
}

function renderAnalysisPage(data) {
  if (!data) return;
  // Resolve mode from all available sources before rendering
  const resolvedMode = data.mode || (data.score_breakdown && data.score_breakdown.mode) || _s.mode || 'cold_call';
  if (resolvedMode !== _s.mode) _s.mode = resolvedMode;
  renderTranscriptOnly(data.transcript || [], data.sentiment_timeline || [], resolvedMode);
  renderRightPanelLoading(data.audio_metrics || {}, resolvedMode);
  populateAnalysisResults(data);
}

function sentimentClass(timeline, pct) {
  for (const seg of timeline) {
    if (pct >= seg.start_pct && pct <= seg.end_pct) {
      return seg.sentiment === 'positive' ? 's-g' : seg.sentiment === 'negative' ? 's-r' : 's-a';
    }
  }
  return 's-n';
}

// ---------------------------------------------------------------------------
// Deep Analysis — Screen 3
// ---------------------------------------------------------------------------
let _deepCycleInterval = null;
const _DEEP_CYCLE_TEXTS = [
  'Annotating your transcript...',
  'Finding the moments that mattered...',
  'Building your coaching report...',
  'Reviewing every turn...',
];

function openDeepAnalysis() {
  const rp = document.getElementById('resultsPage');
  if (rp) rp.classList.remove('open');
  const ap = document.getElementById('analysisPage');
  if (ap) ap.classList.add('open');
  _currentStep = 'analysis';

  const basicData = _s.analysis || {};
  const score = basicData.score || 0;

  // Render topbar immediately
  const tb = document.getElementById('anTopbar');
  if (tb) {
    tb.innerHTML = `
      <button class="an-back-btn" onclick="closeDeepAnalysis()" title="Back to results">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9,2 4,7 9,12"/></svg>
      </button>
      <div class="logo" style="margin-left:6px">
        <div class="logo-mark"><svg viewBox="0 0 12 12" fill="none" stroke="white" stroke-width="1.6" stroke-linecap="round"><circle cx="6" cy="6" r="4"/><line x1="6" y1="3" x2="6" y2="6"/><line x1="6" y1="6" x2="8" y2="8"/></svg></div>
        <div class="logo-text">Outround</div>
      </div>
      <div class="top-spacer"></div>
      <div class="an-score-chip">${score}/100</div>
      <button class="an-topbar-icon active" id="btnTranscript" onclick="showDeepView('transcript')" title="Transcript">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><line x1="2" y1="4" x2="14" y2="4"/><line x1="2" y1="8" x2="14" y2="8"/><line x1="2" y1="12" x2="9" y2="12"/></svg>
      </button>
      <button class="an-topbar-icon" id="btnGraph" onclick="showDeepView('graph')" title="Performance graph">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="1" y="9" width="3" height="5" rx="1"/><rect x="6" y="5" width="3" height="9" rx="1"/><rect x="11" y="7" width="3" height="7" rx="1"/></svg>
      </button>`;
  }

  // 2-column layout (no middle)
  const layout = document.querySelector('.an-layout');
  if (layout) layout.classList.add('no-middle');

  // Right panel: immediate score/breakdown from basic result
  renderDeepRightPanel(basicData);

  // Left panel: loading state + survey
  const anLeft = document.getElementById('anLeft');
  if (anLeft) {
    anLeft.innerHTML = `
      <div class="lsv2-eyebrow" style="margin-bottom:18px">Deep analysis in progress</div>
      <div class="lsv2-sparkle" style="font-size:2.2rem;margin-bottom:12px">\u2726</div>
      <div class="lsv2-cycle" id="deepCycleText" style="margin-bottom:32px">Annotating your transcript...</div>
      <div id="deepSurveyPanel"></div>`;
  }

  // Cycle loading texts
  let _dci = 0;
  _deepCycleInterval = setInterval(() => {
    const el = document.getElementById('deepCycleText');
    if (!el) return;
    el.classList.add('fade');
    setTimeout(() => {
      _dci = (_dci + 1) % _DEEP_CYCLE_TEXTS.length;
      el.textContent = _DEEP_CYCLE_TEXTS[_dci];
      el.classList.remove('fade');
    }, 350);
  }, 3000);

  // Start survey in deep panel
  startSurvey('deepSurveyPanel');

  // Trigger deep analysis
  fetch('/api/session/' + _s.sessionId + '/deep-analysis', { method: 'POST' })
    .then(() => _pollDeepAnalysis())
    .catch((err) => { uiLog('Deep analysis trigger error: ' + err.message, 'err'); });
}

function _pollDeepAnalysis() {
  let attempts = 0;
  const check = async () => {
    attempts++;
    if (attempts > 60) return; // 2 min max
    try {
      const res = await fetch('/api/session/' + _s.sessionId + '/deep-status');
      const data = await res.json();
      uiLog('Deep status: ' + data.status, 'info');
      if (data.status === 'complete') {
        _onDeepAnalysisReady(data);
        return;
      }
      if (data.status !== 'error') setTimeout(check, 2000);
    } catch { setTimeout(check, 2000); }
  };
  check();
}

function _onDeepAnalysisReady(deepData) {
  // Stop loading cycle
  if (_deepCycleInterval) { clearInterval(_deepCycleInterval); _deepCycleInterval = null; }

  // Merge deep data with basic result for full view
  const merged = {
    ..._s.analysis,
    transcript: deepData.annotated_transcript || (_s.analysis?.transcript || []),
    coaching_feedback: deepData.coaching_feedback || [],
    sentiment_timeline: deepData.sentiment_timeline || [],
  };
  _s._deepData = merged;

  // Re-render topbar with view toggle active state preserved
  const btnT = document.getElementById('btnTranscript');
  if (btnT) btnT.classList.add('active');
  const btnG = document.getElementById('btnGraph');
  if (btnG) btnG.classList.remove('active');

  renderDeepTranscript(merged.transcript, merged.sentiment_timeline);
  uiLog('Deep analysis ready — ' + (merged.transcript?.length || 0) + ' turns', 'ok');
}

function closeDeepAnalysis() {
  const ap = document.getElementById('analysisPage');
  if (ap) ap.classList.remove('open');
  // Reset layout
  const layout = document.querySelector('.an-layout');
  if (layout) layout.classList.remove('no-middle');
  // Reset topbar
  const tb = document.getElementById('anTopbar');
  if (tb) _resetAnTopbar(tb);
  // Return to results
  const rp = document.getElementById('resultsPage');
  if (rp) rp.classList.add('open');
  _currentStep = 'results';
}

function _resetAnTopbar(tb) {
  tb.innerHTML = `<div class="logo">
    <div class="logo-mark"><svg viewBox="0 0 12 12" fill="none" stroke="white" stroke-width="1.6" stroke-linecap="round"><circle cx="6" cy="6" r="4"/><line x1="6" y1="3" x2="6" y2="6"/><line x1="6" y1="6" x2="8" y2="8"/></svg></div>
    <div class="logo-text">Outround</div>
  </div>
  <div class="top-spacer"></div>
  <button class="an-finish-btn" onclick="finishAnalysis()">Finish</button>`;
}

function renderDeepAnalysisPage(data) {
  if (!data) return;
  const score = data.score || 0;

  // Update topbar
  const tb = document.getElementById('anTopbar');
  if (tb) {
    tb.innerHTML = `
      <button class="an-back-btn" onclick="closeDeepAnalysis()" title="Back to results">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9,2 4,7 9,12"/></svg>
      </button>
      <div class="logo" style="margin-left:6px">
        <div class="logo-mark"><svg viewBox="0 0 12 12" fill="none" stroke="white" stroke-width="1.6" stroke-linecap="round"><circle cx="6" cy="6" r="4"/><line x1="6" y1="3" x2="6" y2="6"/><line x1="6" y1="6" x2="8" y2="8"/></svg></div>
        <div class="logo-text">Outround</div>
      </div>
      <div class="top-spacer"></div>
      <div class="an-score-chip">${score}/100</div>
      <button class="an-topbar-icon active" id="btnTranscript" onclick="showDeepView('transcript')" title="Transcript">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><line x1="2" y1="4" x2="14" y2="4"/><line x1="2" y1="8" x2="14" y2="8"/><line x1="2" y1="12" x2="9" y2="12"/></svg>
      </button>
      <button class="an-topbar-icon" id="btnGraph" onclick="showDeepView('graph')" title="Performance graph">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><rect x="1" y="9" width="3" height="5" rx="1"/><rect x="6" y="5" width="3" height="9" rx="1"/><rect x="11" y="7" width="3" height="7" rx="1"/></svg>
      </button>`;
  }

  // 2-column layout (no middle)
  const layout = document.querySelector('.an-layout');
  if (layout) layout.classList.add('no-middle');

  // Render panels
  renderDeepTranscript(data.transcript || [], data.sentiment_timeline || []);
  renderDeepRightPanel(data);

  // Store for view toggling
  _s._deepData = data;
}

let _deepViewMode = 'transcript';

function showDeepView(mode) {
  _deepViewMode = mode;
  const btnT = document.getElementById('btnTranscript');
  const btnG = document.getElementById('btnGraph');
  if (btnT) btnT.classList.toggle('active', mode === 'transcript');
  if (btnG) btnG.classList.toggle('active', mode === 'graph');
  const data = _s._deepData;
  if (!data) return; // Still loading — view will auto-render when ready
  if (mode === 'transcript') {
    renderDeepTranscript(data.transcript || [], data.sentiment_timeline || []);
  } else {
    renderDeepGraphView(data);
  }
}

function renderDeepTranscript(transcript, timeline) {
  const el = document.getElementById('anLeft');
  if (!el) return;
  if (!transcript || transcript.length === 0) {
    el.innerHTML = '<div class="an-section-label">Annotated transcript</div><div style="padding:40px 0;text-align:center;font-size:0.74rem;color:var(--ink-3)">Transcript not available.</div>';
    return;
  }

  let html = '<div class="an-section-label" style="margin-bottom:16px">Annotated transcript</div>';
  transcript.forEach((t) => {
    const isRep = t.speaker === 'rep';
    let tlClass = isRep
      ? (t.quality === 'good' ? 'tl-good' : t.quality === 'poor' ? 'tl-poor' : t.quality === 'ok' ? 'tl-ok' : 'tl-neutral')
      : 'tl-hendrik';

    const coachText = isRep && t.coaching
      ? (typeof t.coaching === 'string' ? t.coaching : (t.coaching.body || t.coaching.title || ''))
      : '';

    html += `<div class="t-line ${tlClass}">
      <div class="t-spk${isRep ? ' rep' : ''}">${isRep ? 'You' : 'Hendrik'}</div>
      <div class="t-content">
        <div class="t-txt${isRep ? ' rep' : ''}">${escHtml(t.text)}</div>
        ${t.start_ms ? `<div class="t-time">${fmtMs(t.start_ms)}</div>` : ''}
        ${coachText ? `<div class="cn-block"><div class="cn-block-lbl">Coach note</div><div class="cn-block-txt">${escHtml(coachText)}</div></div>` : ''}
      </div>
    </div>`;
  });
  el.innerHTML = html;
}

function renderDeepRightPanel(data) {
  const el = document.getElementById('anRight');
  if (!el) return;
  const score = data.score || 0;
  const bd = data.score_breakdown || {};
  const vMap = { advance: 'Meeting advanced', soft_advance: 'Soft advance', dead: 'No next step' };
  const mMap = { building: '↗ Building', flat: '→ Flat', declining: '↘ Declining' };

  el.innerHTML = `
    <div class="an-right-section" style="text-align:center">
      <div style="font-size:2.6rem;font-weight:800;letter-spacing:-0.05em;line-height:1;margin-bottom:4px">${score}</div>
      <div style="font-size:0.58rem;font-weight:700;color:var(--ink-3);letter-spacing:0.12em;text-transform:uppercase;margin-bottom:10px">/100</div>
      <div class="verdict-row">
        ${data.call_verdict ? `<div class="verdict-badge ${escHtml(data.call_verdict)}">${escHtml(vMap[data.call_verdict] || data.call_verdict)}</div>` : ''}
        ${data.call_momentum ? `<div class="momentum-badge">${escHtml(mMap[data.call_momentum] || data.call_momentum)}</div>` : ''}
      </div>
    </div>
    <div class="an-right-section">
      <div class="an-section-label">Sub-scores</div>
      <div class="subscores">
        <div class="sc-row"><div class="sc-label">Opening</div><div class="sc-bar"><div class="sc-fill" style="width:${bd.opening||0}%"></div></div><div class="sc-val">${bd.opening||0}</div></div>
        <div class="sc-row"><div class="sc-label">Objections</div><div class="sc-bar"><div class="sc-fill" style="width:${bd.objections||0}%"></div></div><div class="sc-val">${bd.objections||0}</div></div>
        <div class="sc-row"><div class="sc-label">Talk ratio</div><div class="sc-bar"><div class="sc-fill" style="width:${bd.talk_ratio||0}%"></div></div><div class="sc-val">${bd.talk_ratio||0}</div></div>
        <div class="sc-row"><div class="sc-label">Clear ask</div><div class="sc-bar"><div class="sc-fill" style="width:${bd.clear_ask||0}%"></div></div><div class="sc-val">${bd.clear_ask||0}</div></div>
      </div>
    </div>
    ${data.next_session_focus ? `<div class="an-right-section"><div class="an-section-label">Next focus</div><div style="font-size:0.74rem;color:var(--ink-2);line-height:1.6">${escHtml(data.next_session_focus)}</div></div>` : ''}
  `;
}

function renderDeepGraphView(data) {
  const el = document.getElementById('anLeft');
  if (!el) return;
  if (!data) { el.innerHTML = '<div style="padding:40px;text-align:center;color:var(--ink-3)">No data.</div>'; return; }

  const am = data.audio_metrics || {};
  const bd = data.score_breakdown || {};
  const wpm = am.wpm || '—';
  const filler = am.filler_words !== undefined ? am.filler_words : '—';
  const talkRep = am.talk_ratio?.rep !== undefined ? am.talk_ratio.rep : '—';
  const mono = am.longest_monologue_seconds ? fmtSecs(am.longest_monologue_seconds) : '—';

  // Build score history from stored history + current
  const hist = _s.history.slice().reverse();
  const rounds = hist.map((h, i) => ({ label: 'R' + (i + 1), score: h.score }));
  rounds.push({ label: 'R' + (rounds.length + 1), score: data.score || 0 });

  el.innerHTML = `<div class="graph-view">
    <div class="an-section-label" style="margin-bottom:14px">Performance metrics</div>
    <div class="graph-stat-row">
      <div class="m-card"><div class="m-lbl">Pace</div><div class="m-val">${typeof wpm === 'number' ? wpm : '—'}<span style="font-size:0.68rem;color:var(--ink-3)"> wpm</span></div></div>
      <div class="m-card"><div class="m-lbl">Filler words</div><div class="m-val">${filler}</div></div>
      <div class="m-card"><div class="m-lbl">Talk ratio</div><div class="m-val">${talkRep}<span style="font-size:0.68rem;color:var(--ink-3)">%</span></div></div>
      <div class="m-card"><div class="m-lbl">Monologue</div><div class="m-val" style="font-size:0.95rem">${mono}</div></div>
    </div>
    <div class="graph-chart-box">
      <div class="an-section-label" style="margin-bottom:12px">Score history</div>
      <div style="position:relative;height:220px"><canvas id="deepScoreChart"></canvas></div>
    </div>
  </div>`;

  const renderChart = () => {
    const ctx = document.getElementById('deepScoreChart');
    if (!ctx) return;
    const labels = rounds.map(r => r.label);
    const lastIdx = rounds.length - 1;
    const mode = data.mode || _s.mode || 'cold_call';
    const isPitch = mode === 'investor_pitch';
    const sub = isPitch
      ? [
          { label: 'Problem clarity', color: '#3b82f6', val: bd.problem_clarity },
          { label: 'Why now',          color: '#f59e0b', val: bd.why_now },
          { label: 'Right to win',     color: '#22c55e', val: bd.right_to_win },
          { label: 'Ask clarity',      color: '#a855f7', val: bd.ask_clarity },
        ]
      : [
          { label: 'Opening',    color: '#3b82f6', val: bd.opening },
          { label: 'Objections', color: '#f59e0b', val: bd.objections },
          { label: 'Clear ask',  color: '#22c55e', val: bd.clear_ask },
          { label: 'Talk ratio', color: '#a855f7', val: bd.talk_ratio },
        ];
    new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          { label: 'Overall', data: rounds.map(r => r.score), borderColor: '#111', backgroundColor: 'rgba(17,17,17,0.05)', tension: 0.35, pointRadius: 4, pointBackgroundColor: '#111' },
          ...sub.map(s => ({ label: s.label, data: rounds.map((_, i) => i === lastIdx ? (s.val||null) : null), borderColor: s.color, backgroundColor: 'transparent', tension: 0.35, pointRadius: 4, spanGaps: false })),
        ],
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        scales: {
          y: { min: 0, max: 100, grid: { color: 'rgba(17,17,17,0.06)' }, ticks: { font: { family: 'Bricolage Grotesque', size: 10 } } },
          x: { grid: { display: false }, ticks: { font: { family: 'Bricolage Grotesque', size: 10 } } },
        },
        plugins: { legend: { position: 'top', labels: { font: { family: 'Bricolage Grotesque', size: 10 }, boxWidth: 10, padding: 12 } } },
      },
    });
  };

  if (typeof Chart !== 'undefined') {
    renderChart();
  } else {
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/chart.js@4/dist/chart.umd.min.js';
    s.onload = renderChart;
    document.head.appendChild(s);
  }
}
