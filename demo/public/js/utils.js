'use strict';
// ---------------------------------------------------------------------------
// Helpers — pure utilities, no DOM dependency except showToast
// ---------------------------------------------------------------------------
function escHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
function fmtSecs(s) { const m = Math.floor(s / 60); return m + ':' + String(s % 60).padStart(2, '0'); }
function fmtMs(ms) { return fmtSecs(Math.floor(ms / 1000)); }
function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

// ---------------------------------------------------------------------------
// Audio helpers
// ---------------------------------------------------------------------------
function playSound(src) {
  try { const a = new Audio(src); a.play().catch(() => {}); return a; } catch { return null; }
}

function playSoundAndWait(src) {
  return new Promise((resolve) => {
    try {
      const a = new Audio(src);
      a.addEventListener('ended', resolve);
      a.addEventListener('error', resolve); // don't block if file missing
      a.play().catch(resolve);              // don't block if autoplay denied
    } catch { resolve(); }
  });
}

// ---------------------------------------------------------------------------
// Toast
// ---------------------------------------------------------------------------
function showToast(msg) {
  const el = document.getElementById('toastEl');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 2200);
}
