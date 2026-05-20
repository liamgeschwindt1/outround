'use strict';
// ---------------------------------------------------------------------------
// State — single shared object, mutated in place (never reassigned)
// ---------------------------------------------------------------------------
var _s = {
  user: { name: '', email: '', role: '' },
  sessionId: null,
  conversation: null,
  callStart: null,
  callDuration: 0,
  analysis: null,
  muted: false,
  callTimerInterval: null,
  onboardingDone: false,
  history: [],
  _finishLb: null,
  _callEnding: false,
  mode: 'cold_call',
  _pitchPhase: null,
  _pitchTimerInterval: null,
};
