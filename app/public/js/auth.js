'use strict';

// ---------------------------------------------------------------------------
// Client-side auth helpers
//
// The backend handles all Supabase interactions and sets an httpOnly cookie.
// The frontend just calls /auth/* endpoints and /auth/me to check state.
// ---------------------------------------------------------------------------

let _authEnabled = null; // null = unknown, true/false after first check

/**
 * Check if the current user is authenticated.
 * Populates _s.authUser and _s.user on success.
 * Returns true if authenticated, false if not.
 */
async function checkAuth() {
  try {
    const res = await fetch('/auth/me', { credentials: 'include' });

    if (res.status === 503) {
      // Auth not configured — dev/demo mode, skip auth entirely
      _authEnabled = false;
      return true;
    }

    if (res.status === 401) {
      _authEnabled = true;
      return false;
    }

    if (res.ok) {
      _authEnabled = true;
      const user = await res.json();
      _s.authUser = user;
      _s.user = {
        name: user.name || '',
        email: user.email || '',
        role: user.role || '',
        id: user.id,
      };
      _s.onboardingDone = user.onboarding_complete;
      updateUserUI();
      return true;
    }

    return false;
  } catch {
    // Network error — assume dev mode with no auth configured
    _authEnabled = false;
    return true;
  }
}

function isAuthEnabled() {
  return _authEnabled === true;
}

/**
 * Sign in with Google → redirect to backend OAuth flow.
 */
function signInWithGoogle() {
  window.location.href = '/auth/google';
}

/**
 * Sign in with email + password.
 * Returns { ok: true } or { error: string }.
 */
async function signInWithEmail(email, password) {
  try {
    const res = await fetch('/auth/login', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) return { error: data.error || 'Sign in failed' };
    return { ok: true };
  } catch {
    return { error: 'Network error — please try again' };
  }
}

/**
 * Sign up with email + password.
 * Returns { ok: true } or { error: string }.
 */
async function signUpWithEmail(email, password, name) {
  try {
    const res = await fetch('/auth/signup', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name }),
    });
    const data = await res.json();
    if (!res.ok) return { error: data.error || 'Sign up failed' };
    return { ok: true };
  } catch {
    return { error: 'Network error — please try again' };
  }
}

/**
 * Sign out — clears the backend cookie and reloads the login page.
 */
async function signOut() {
  try {
    await fetch('/auth/logout', { method: 'POST', credentials: 'include' });
  } catch { /* ignore */ }
  window.location.reload();
}

/**
 * Show the login page overlay.
 */
function showLoginPage() {
  document.getElementById('loginPage').style.display = 'flex';
  document.getElementById('loginPage').classList.add('open');
}

/**
 * Hide the login page overlay.
 */
function hideLoginPage() {
  document.getElementById('loginPage').classList.remove('open');
  setTimeout(() => { document.getElementById('loginPage').style.display = 'none'; }, 300);
}

// ---------------------------------------------------------------------------
// Login page UI handlers
// ---------------------------------------------------------------------------

function loginTabSwitch(tab) {
  const signinTab = document.getElementById('loginTabSignin');
  const signupTab = document.getElementById('loginTabSignup');
  const signinForm = document.getElementById('loginFormSignin');
  const signupForm = document.getElementById('loginFormSignup');

  if (tab === 'signin') {
    signinTab.classList.add('active');
    signupTab.classList.remove('active');
    signinForm.style.display = 'block';
    signupForm.style.display = 'none';
  } else {
    signinTab.classList.remove('active');
    signupTab.classList.add('active');
    signinForm.style.display = 'none';
    signupForm.style.display = 'block';
  }
}

async function handleLoginSubmit(e) {
  e.preventDefault();
  const btn = document.getElementById('loginSubmitBtn');
  const errEl = document.getElementById('loginError');
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;

  errEl.textContent = '';
  btn.disabled = true;
  btn.textContent = 'Signing in…';

  const result = await signInWithEmail(email, password);

  if (result.error) {
    errEl.textContent = result.error;
    btn.disabled = false;
    btn.textContent = 'Sign in';
    return;
  }

  // Re-check auth to populate user state
  const ok = await checkAuth();
  if (ok) {
    hideLoginPage();
    initAfterAuth();
  }
}

async function handleSignupSubmit(e) {
  e.preventDefault();
  const btn = document.getElementById('signupSubmitBtn');
  const errEl = document.getElementById('signupError');
  const name = document.getElementById('signupName').value.trim();
  const email = document.getElementById('signupEmail').value.trim();
  const password = document.getElementById('signupPassword').value;

  errEl.textContent = '';
  btn.disabled = true;
  btn.textContent = 'Creating account…';

  const result = await signUpWithEmail(email, password, name);

  if (result.error) {
    errEl.textContent = result.error;
    btn.disabled = false;
    btn.textContent = 'Create account';
    return;
  }

  // Re-check auth
  const ok = await checkAuth();
  if (ok) {
    hideLoginPage();
    initAfterAuth();
  }
}

// ---------------------------------------------------------------------------
// Onboarding completion helpers
// ---------------------------------------------------------------------------

async function completeOnboardingStep3(coachId) {
  // Select the coach
  try {
    await fetch('/api/coaches/select', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ coach_id: coachId }),
    });
  } catch { /* non-fatal */ }

  // Mark onboarding complete
  try {
    await fetch('/auth/onboarding/complete', {
      method: 'POST',
      credentials: 'include',
    });
  } catch { /* non-fatal */ }

  if (_s.authUser) _s.authUser.onboarding_complete = true;
  _s.onboardingDone = true;

  // Close the focus overlay and go to the app
  const overlay = document.getElementById('focusOverlay');
  overlay.classList.remove('open');
  _currentStep = null;
  loadLeaderboard();
}
