'use strict';

// ---------------------------------------------------------------------------
// Progress dots
// Session steps: mode=0, character=1, persona=2, brief=3, call=4, loading=5, finish=6 (total 7)
// Pitch steps:   mode=0, character=1, pitchprep=2, call=3, loading=4, finish=5 (total 6)
// ---------------------------------------------------------------------------
const STEP_DOT_IDX = {
  mode: 0,
  character: 1,
  persona: 2,
  brief: 3,
  pitchprep: 2,
  call: 4,
  loading: 5,
  finish: 6,
};

function renderDots(activeIdx, total) {
  const el = document.getElementById('progressDots');
  if (!el) return;
  let html = '';
  for (let i = 0; i < total; i++) {
    const cls = i < activeIdx ? 'pd done' : i === activeIdx ? 'pd active' : 'pd';
    html += '<div class="' + cls + '"></div>';
  }
  el.innerHTML = html;
}

function renderOnboardingDots() {
  const el = document.getElementById('progressDots');
  if (el) el.innerHTML = '<div class="pd done"></div><div class="pd active"></div>';
}

// ---------------------------------------------------------------------------
// Handle OAuth redirect returns (Pipedrive / GCal callback → /onboarding?x=y)
// Called during init to auto-advance the onboarding step.
// ---------------------------------------------------------------------------
// ---------------------------------------------------------------------------
// Sidebar navigation
// ---------------------------------------------------------------------------
function sbNav(view) {
  // Set active icon
  const icons = { sessions: 'sbSessions', leaderboard: 'sbLeaderboard', practice: 'sbPractice' };
  document.querySelectorAll('.sidebar .sb-icon').forEach((el) => el.classList.remove('active'));
  if (icons[view]) {
    const el = document.getElementById(icons[view]);
    if (el) el.classList.add('active');
  }

  const leftCol = document.getElementById('leftCol');
  const rightCol = document.querySelector('.right-col');

  if (view === 'sessions') {
    // Show history + stats, hide meetings panel
    if (leftCol) leftCol.style.display = '';
    if (rightCol) rightCol.style.display = 'none';
  } else if (view === 'leaderboard') {
    // Show leaderboard panel only
    if (leftCol) leftCol.style.display = 'none';
    if (rightCol) {
      rightCol.style.display = '';
    }
  } else {
    // Default: show everything
    if (leftCol) leftCol.style.display = '';
    if (rightCol) rightCol.style.display = '';
  }
}

function handleOAuthRedirectParams() {
  const params = new URLSearchParams(window.location.search);
  const pipedriveConnected = params.get('pipedrive') === 'connected';
  const gcalConnected = params.get('gcal') === 'connected';

  if (pipedriveConnected || gcalConnected) {
    // Update integration status in authUser state if available
    if (_s.authUser) {
      if (pipedriveConnected)
        _s.authUser.integrations = { ...(_s.authUser.integrations || {}), pipedrive: true };
      if (gcalConnected)
        _s.authUser.integrations = { ...(_s.authUser.integrations || {}), gcal: true };
    }

    // Determine which onboarding sub-step to resume at
    if (pipedriveConnected) {
      _s._onboardingSubStep = 2; // Advance past Pipedrive to Google Calendar
    } else if (gcalConnected) {
      _s._onboardingSubStep = 3; // Advance past Calendar to Coach selection
    }

    // Clean the URL without triggering a reload
    window.history.replaceState({}, '', window.location.pathname);
    return true;
  }

  return false;
}

// ---------------------------------------------------------------------------
// Focus overlay + step transitions
// ---------------------------------------------------------------------------
var _currentStep = null;

function selectMode(mode) {
  _s.mode = mode;
  goToStep('character');
}

async function goToStep(step) {
  const overlay = document.getElementById('focusOverlay');
  const wrap = document.getElementById('cardStepWrap');

  if (step === 'analysis') {
    overlay.classList.remove('open');
    await delay(210);
    document.getElementById('analysisPage').classList.add('open');
    renderAnalysisPage(_s.analysis);
    _currentStep = 'analysis';
    return;
  }

  const isPitch = _s.mode === 'investor_pitch';
  const totalDots = isPitch ? 6 : 7;
  const isOpen = overlay.classList.contains('open');
  if (!isOpen) {
    renderStep(step, wrap);
    if (step === 'onboarding') renderOnboardingDots();
    else renderDots(STEP_DOT_IDX[step] ?? 0, totalDots);
    overlay.classList.add('open');
    _currentStep = step;
    return;
  }

  wrap.classList.add('fading');
  await delay(200);
  renderStep(step, wrap);
  if (step === 'onboarding') renderOnboardingDots();
  else renderDots(STEP_DOT_IDX[step] ?? 0, totalDots);
  wrap.classList.remove('fading');
  _currentStep = step;
}
