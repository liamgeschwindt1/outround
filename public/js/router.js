'use strict';

// ---------------------------------------------------------------------------
// Progress dots
// Session steps: mode=0, character=1, persona=2, brief=3, call=4, loading=5, finish=6 (total 7)
// Pitch steps:   mode=0, character=1, pitchprep=2, call=3, loading=4, finish=5 (total 6)
// ---------------------------------------------------------------------------
const STEP_DOT_IDX = { mode: 0, character: 1, persona: 2, brief: 3, pitchprep: 2, call: 4, loading: 5, finish: 6 };

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
