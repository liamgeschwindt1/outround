'use strict';

// ---------------------------------------------------------------------------
// Step renderers
// ---------------------------------------------------------------------------
function renderStep(step, wrap) {
  const templates = {
    onboarding: renderOnboardingStep,
    mode: renderModeStep,
    character: renderCharacterStep,
    persona: renderPersonaStep,
    brief: renderBriefStep,
    pitchprep: renderPitchPrepStep,
    call: renderCallStep,
    loading: renderLoadingStep,
    finish: renderFinishStep,
    tooshort: renderTooShortStep,
  };
  if (templates[step]) wrap.innerHTML = templates[step]();
}

function renderOnboardingStep() {
  return `<div class="card-step">
    <div class="ob-ey">Quick setup</div>
    <div class="ob-title">Welcome. Let's get you ready.</div>
    <div class="ob-sub">Two things and you're in. No credit card, no commitment.</div>
    <div class="f-row">
      <div class="f-group"><div class="f-label">First name</div><input class="f-input" type="text" placeholder="Liam" id="ob-fn"></div>
      <div class="f-group"><div class="f-label">Last name</div><input class="f-input" type="text" placeholder="G." id="ob-ln"></div>
    </div>
    <div class="f-group"><div class="f-label">Work email</div><input class="f-input" type="email" placeholder="you@company.com" id="ob-email"></div>
    <div class="f-group"><div class="f-label">Your role</div>
      <input class="f-input" type="text" placeholder="e.g. Account Executive" id="ob-role">
    </div>
    <button class="ob-btn" onclick="completeOnboarding()">Start practicing</button>
    <div class="ob-skip" onclick="skipOnboarding()">Skip — try the demo</div>
  </div>`;
}

function renderModeStep() {
  const isCold = _s.mode === 'cold_call';
  const isPitch = _s.mode === 'investor_pitch';
  return `<div class="card-step">
    <div class="step-eyebrow">Practice mode</div>
    <div class="ob-title" style="margin-bottom:4px;font-size:1.2rem">What are you preparing for?</div>
    <div class="ob-sub" style="margin-bottom:16px">Two modes live. More dropping soon.</div>
    <div class="mode-grid">
      <div class="mode-card${isCold ? ' mode-active' : ''}" onclick="selectMode('cold_call')">
        <div class="mode-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.36 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg></div>
        <div class="mode-name">Cold Calls</div>
        <div class="mode-desc">Live AI conversation, 3–5 min. SDR &amp; AE world.</div>
      </div>
      <div class="mode-card${isPitch ? ' mode-active' : ''}" onclick="selectMode('investor_pitch')">
        <div class="mode-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg></div>
        <div class="mode-name">Investor Pitch</div>
        <div class="mode-desc">60 seconds to pitch. Then Natalie asks the hard question.</div>
      </div>
      <div class="mode-card mode-locked">
        <div class="mode-lock">Soon</div>
        <div class="mode-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg></div>
        <div class="mode-name">Customer Discovery</div>
        <div class="mode-desc">Founders, PMs &amp; consultants running discovery calls.</div>
      </div>
      <div class="mode-card mode-locked">
        <div class="mode-lock">Soon</div>
        <div class="mode-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="M7 21h10"/><path d="M12 3v18"/><path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/></svg></div>
        <div class="mode-name">Negotiations</div>
        <div class="mode-desc">High-value, one-shot deals where preparation is everything.</div>
      </div>
    </div>
  </div>`;
}

function renderCharacterStep() {
  if (_s.mode === 'investor_pitch') return renderPitchCharacterStep();
  return `<div class="card-step">
    <div class="step-eyebrow">Your prospect</div>
    <div class="ob-title" style="margin-bottom:16px;font-size:1.2rem">Who are you calling?</div>
    <div class="char-grid">
      <div class="char-card" onclick="goToStep('persona')">
        <div class="char-flag" style="width:52px;height:52px;border-radius:50%;overflow:hidden;border:1px solid var(--border);flex-shrink:0;margin-bottom:8px">
          <img src="/hendrik.jpg" alt="Hendrik van der Berg" style="width:100%;height:100%;object-fit:cover" onerror="this.style.display='none';this.parentElement.innerHTML='<span style=\'font-size:1.4rem\'>🇳🇱</span>'">
        </div>
        <div style="display:flex;align-items:center;gap:5px;margin-bottom:2px">
          <span style="font-size:0.9rem">🇳🇱</span>
          <div class="char-name" style="margin-bottom:0">Hendrik van der Berg</div>
        </div>
        <div class="char-role">CFO · Vandermeer Logistics</div>
        <div class="char-tags"><div class="tag">Skeptical</div><div class="tag">Hard</div></div>
      </div>
      <div class="char-card char-locked">
        <div class="char-flag" style="width:52px;height:52px;border-radius:50%;overflow:hidden;border:1px solid var(--border);flex-shrink:0;margin-bottom:8px;display:flex;align-items:center;justify-content:center;font-size:1.4rem">🇬🇧</div>
        <div style="display:flex;align-items:center;gap:5px;margin-bottom:2px">
          <span style="font-size:0.9rem">🇬🇧</span>
          <div class="char-name" style="margin-bottom:0">Sarah Whitmore</div>
        </div>
        <div class="char-role">VP Ops · Kellerton Group</div>
        <div class="char-tags"><div class="tag">Formal</div></div>
        <div class="char-lock-cover"><div class="char-lock-lbl">Coming soon</div></div>
      </div>
      <div class="char-card char-locked">
        <div class="char-flag" style="width:52px;height:52px;border-radius:50%;overflow:hidden;border:1px solid var(--border);flex-shrink:0;margin-bottom:8px;display:flex;align-items:center;justify-content:center;font-size:1.4rem">🇺🇸</div>
        <div style="display:flex;align-items:center;gap:5px;margin-bottom:2px">
          <span style="font-size:0.9rem">🇺🇸</span>
          <div class="char-name" style="margin-bottom:0">Marcus Webb</div>
        </div>
        <div class="char-role">Head of Sales · Arion Co.</div>
        <div class="char-tags"><div class="tag">Aggressive</div></div>
        <div class="char-lock-cover"><div class="char-lock-lbl">Coming soon</div></div>
      </div>
      <div class="char-card char-locked">
        <div class="char-flag" style="width:52px;height:52px;border-radius:50%;overflow:hidden;border:1px solid var(--border);flex-shrink:0;margin-bottom:8px;display:flex;align-items:center;justify-content:center;font-size:1.4rem">🇩🇪</div>
        <div style="display:flex;align-items:center;gap:5px;margin-bottom:2px">
          <span style="font-size:0.9rem">🇩🇪</span>
          <div class="char-name" style="margin-bottom:0">Petra Hoffman</div>
        </div>
        <div class="char-role">CTO · Neumann Systems</div>
        <div class="char-tags"><div class="tag">Technical</div></div>
        <div class="char-lock-cover"><div class="char-lock-lbl">Coming soon</div></div>
      </div>
    </div>
  </div>`;
}

function renderPitchCharacterStep() {
  return `<div class="card-step">
    <div class="step-eyebrow">Your investor</div>
    <div class="ob-title" style="margin-bottom:16px;font-size:1.2rem">Who are you pitching to?</div>
    <div class="char-grid">
      <div class="char-card" onclick="beginPitchSession()">
        <div class="char-flag" style="width:52px;height:52px;border-radius:50%;overflow:hidden;border:1px solid var(--border);flex-shrink:0;margin-bottom:8px"><img src="/natalie.jpg" alt="Natalie Pemberton" style="width:100%;height:100%;object-fit:cover"></div>
        <div style="display:flex;align-items:center;gap:5px;margin-bottom:2px">
          <span style="font-size:0.9rem">🇬🇧</span>
          <div class="char-name" style="margin-bottom:0">Natalie Pemberton</div>
        </div>
        <div class="char-role">Partner · Baobab Capital</div>
        <div class="char-tags"><div class="tag">Precision</div><div class="tag">Hard</div></div>
      </div>
      <div class="char-card char-locked">
        <div class="char-flag" style="width:52px;height:52px;border-radius:50%;overflow:hidden;border:1px solid var(--border);flex-shrink:0;margin-bottom:8px"><img src="/natalie.jpg" alt="Klaus Brandt" style="width:100%;height:100%;object-fit:cover;opacity:0.4"></div>
        <div style="display:flex;align-items:center;gap:5px;margin-bottom:2px">
          <span style="font-size:0.9rem">🇩🇪</span>
          <div class="char-name" style="margin-bottom:0">Klaus Brandt</div>
        </div>
        <div class="char-role">GP · Meridian Ventures</div>
        <div class="char-tags"><div class="tag">Deep tech</div></div>
        <div class="char-lock-cover"><div class="char-lock-lbl">Coming soon</div></div>
      </div>
    </div>
  </div>`;
}

function renderPitchPrepStep() {
  return `<div class="call-step" style="padding:36px 28px 32px">
    <div class="cv-avatar" style="width:72px;height:72px;border-radius:50%;overflow:hidden;border:2px solid var(--border);flex-shrink:0;margin-bottom:14px"><img src="/natalie.jpg" alt="Natalie Pemberton" style="width:100%;height:100%;object-fit:cover"></div>
    <div class="cv-name">Natalie Pemberton</div>
    <div class="cv-role" style="margin-bottom:28px"><span style="margin-right:4px">🇬🇧</span>Partner — Baobab Capital</div>
    <div style="text-align:center;margin-bottom:8px">
      <div style="font-size:0.62rem;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;color:var(--ink-3);margin-bottom:6px">Your pitch window</div>
      <div style="font-size:3.2rem;font-weight:800;letter-spacing:-0.06em;line-height:1" id="pitchPrepCountdown">0:05</div>
    </div>
    <div style="font-size:0.72rem;color:var(--ink-2);text-align:center;margin-bottom:28px;line-height:1.6;max-width:260px">
      60 seconds to cover: problem, why now, your right to win, and the ask.
    </div>
    <button class="ob-btn" style="margin:0" onclick="skipPitchPrep()">Start now</button>
    <div style="margin-top:10px;font-size:0.7rem;color:var(--ink-3);cursor:pointer" onclick="runTestSession()">or use sample winning transcript →</div>
  </div>`;
}

function renderPersonaStep() {
  return `<div class="card-step">
    <div class="step-eyebrow">Your prospect</div>
    <div class="persona-showcase">
      <div class="persona-avatar" style="overflow:hidden;padding:0;border:1px solid var(--border)">
        <img src="/hendrik.jpg" alt="Hendrik van der Berg" style="width:100%;height:100%;object-fit:cover" onerror="this.style.display='none';this.parentElement.innerHTML='<span style=\'font-size:1.4rem\'>🇳🇱</span>';this.parentElement.style.display='flex';this.parentElement.style.alignItems='center';this.parentElement.style.justifyContent='center'">
      </div>
      <div>
        <div class="persona-name" style="display:flex;align-items:center;gap:7px"><span>🇳🇱</span> Hendrik van der Berg</div>
        <div class="persona-role">CFO — Vandermeer Logistics — Amsterdam</div>
        <div class="persona-tags">
          <div class="tag">B2B Enterprise</div><div class="tag">Skeptical</div><div class="tag">Hard</div>
        </div>
      </div>
    </div>
    <div class="persona-context">Hendrik runs finance for a fast-growing Dutch logistics company. He has seen hundreds of vendors and cuts calls short without hesitation. He values precision over enthusiasm — lead with data, not energy.</div>
    <button class="ob-btn" onclick="beginSession()">Start session</button>
    <div class="step-note">You have 30 seconds to read the brief.</div>
  </div>`;
}

function renderBriefStep() {
  return `<div class="card-step">
    <div class="step-eyebrow">Your brief</div>
    <div class="brief-scenario">
      <div class="brief-flag" style="overflow:hidden;padding:0"><img src="/hendrik.jpg" alt="Hendrik van der Berg" style="width:100%;height:100%;object-fit:cover"/></div>
      <div>
        <div class="brief-p-name" style="display:flex;align-items:center;gap:6px"><span>🇳🇱</span> Hendrik van der Berg</div>
        <div class="brief-p-role">CFO — Vandermeer Logistics</div>
      </div>
      <div class="brief-tags"><div class="tag">Skeptical</div><div class="tag">Time-poor</div></div>
    </div>
    <div class="brief-content">
      You are selling <strong>B2B spend analytics software</strong>. Hendrik's company grew 40% last year and is still reconciling expenses in spreadsheets. He is time-poor and skeptical of vendors. You have <strong>one shot</strong> to earn the next conversation.
    </div>
    <div class="brief-timer-wrap">
      <div class="brief-timer-label"><div class="blk"></div>Call starts in</div>
      <div style="display:flex;align-items:center;gap:12px">
        <div class="brief-countdown" id="briefCountdown">0:30</div>
        <button class="ob-btn" style="padding:6px 14px;font-size:0.72rem;margin:0" onclick="skipBrief()">Start now</button>
      </div>
      <div style="margin-top:10px;font-size:0.7rem;color:var(--ink-3);cursor:pointer;text-align:center" onclick="runTestSession()">or use sample winning transcript →</div>
    </div>
  </div>`;
}

function renderCallStep() {
  if (_s.mode === 'investor_pitch') {
    return `<div class="call-step">
      <div class="cv-avatar"><img src="/natalie.jpg" alt="Natalie Pemberton" style="width:100%;height:100%;object-fit:cover"/><div class="cv-ring" id="cvRing"></div></div>
      <div class="cv-name">Natalie Pemberton</div>
      <div class="cv-role"><span style="margin-right:4px">🇬🇧</span>Partner — Baobab Capital</div>
      <div class="wf idle" id="wf">
        <div class="bar"></div><div class="bar"></div><div class="bar"></div><div class="bar"></div>
        <div class="bar"></div><div class="bar"></div><div class="bar"></div><div class="bar"></div>
        <div class="bar"></div><div class="bar"></div><div class="bar"></div><div class="bar"></div>
      </div>
      <div class="cv-st" id="cst">Connecting…</div>
      <div id="pitchPhaseBar" style="font-size:0.62rem;font-weight:800;letter-spacing:0.1em;text-transform:uppercase;color:var(--ink-3);min-height:14px;margin-bottom:2px"></div>
      <div class="cv-timer" id="cvTimer"></div>
    </div>`;
  }
  return `<div class="call-step">
    <div class="cv-avatar"><img src="/hendrik.jpg" alt="Hendrik van der Berg" style="width:100%;height:100%;object-fit:cover"/><div class="cv-ring" id="cvRing"></div></div>
    <div class="cv-name">Hendrik van der Berg</div>
    <div class="cv-role"><span style="margin-right:4px">🇳🇱</span>CFO — Vandermeer Logistics</div>
    <div class="wf idle" id="wf">
      <div class="bar"></div><div class="bar"></div><div class="bar"></div><div class="bar"></div>
      <div class="bar"></div><div class="bar"></div><div class="bar"></div><div class="bar"></div>
      <div class="bar"></div><div class="bar"></div><div class="bar"></div><div class="bar"></div>
    </div>
    <div class="cv-st" id="cst">Connecting…</div>
    <div class="cv-timer" id="cvTimer"></div>
    <button class="end-btn" id="eb" onclick="endCall()" title="End call" style="display:none">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" transform="rotate(135 12 12)"/></svg>
    </button>
  </div>`;
}

function renderTooShortStep() {
  return `<div class="card-step" style="text-align:center;padding:48px 32px">
    <div style="font-size:2rem;margin-bottom:16px">📵</div>
    <div style="font-size:1rem;font-weight:800;letter-spacing:-0.02em;margin-bottom:8px">Call too short to analyse</div>
    <div style="font-size:0.78rem;color:var(--ink-2);line-height:1.6;margin-bottom:28px">The call needs to be at least 15 seconds long for a score to be generated. ${_s.mode === 'investor_pitch' ? 'Try to keep Natalie engaged next time.' : 'Try to keep Hendrik on the line next time.'}</div>
    <button class="ob-btn" onclick="goAgain()">Try again</button>
    <div class="step-note" style="margin-top:10px"><span onclick="dismissFinish()" style="cursor:pointer">Back to dashboard</span></div>
  </div>`;
}

function renderLoadingStep() {
  return `<div class="loading-step-v2">
    <div class="lsv2-left" style="border-right:none;flex:1;padding:40px 32px">
      <div class="lsv2-eyebrow">Analysis in progress</div>
      <div class="lsv2-sparkle">✦</div>
      <div class="lsv2-cycle" id="loadCycleText">Reading between the lines...</div>
    </div>
  </div>`;
}

function renderFinishStep() {
  const data = _s.analysis || {};
  const verdictMap = { advance: 'Meeting advanced', soft_advance: 'Soft advance', dead: 'No next step', meeting_set: 'Meeting set', deck_requested: 'Deck requested', passed: 'Passed' };
  const verdict = data.headline || verdictMap[data.call_verdict] || 'Session complete.';
  return `<div class="finish-step">
    <div class="finish-verdict">${escHtml(verdict)}</div>
    <div class="finish-lb-title">Leaderboard — This week</div>
    <div id="finishLbRows">${buildFinishLbRows(_s._finishLb, data.score || 0)}</div>
    <div class="finish-actions">
      <button class="fin-btn light" onclick="shareLI()">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
        Share on LinkedIn
      </button>
      <button class="fin-btn dark" onclick="goAgain()">Go again</button>
      <button class="fin-btn light" onclick="dismissFinish()" style="font-size:0.72rem;color:var(--ink-3)">Back to dashboard</button>
    </div>
  </div>`;
}

function buildFinishLbRows(lbEntries, userScore) {
  const userName = _s.user.name || 'You';
  const userIni = userName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) || 'ME';
  const fallback = [
    { name: 'Sophie R.', score: 91, ini: 'SR' },
    { name: 'Marcus T.', score: 88, ini: 'MT' },
    { name: 'Lena K.', score: 85, ini: 'LK' },
    { name: 'Ana M.', score: 74, ini: 'AM' },
  ];
  const base = lbEntries && lbEntries.length > 0
    ? lbEntries.map(e => ({ name: e.name, score: e.score, ini: (e.name || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2) }))
    : fallback;

  const rows = [...base, { name: userName, score: userScore, ini: userIni, isYou: true }];
  rows.sort((a, b) => b.score - a.score);
  return rows.slice(0, 5).map((e, i) => {
    const rank = i + 1;
    const isYou = !!e.isYou;
    return `<div class="flb-row${isYou ? ' you' : ''}">
      <div class="flb-rank${rank <= 3 ? ' top' : ''}">${rank}</div>
      <div class="flb-av"${isYou ? ' style="background:var(--ink);color:white"' : ''}>${escHtml(e.ini)}</div>
      <div class="flb-info"><div class="flb-name">${escHtml(e.name)}${isYou ? ' (you)' : ''}</div></div>
      <div class="flb-sc">${e.score}</div>
    </div>`;
  }).join('');
}
