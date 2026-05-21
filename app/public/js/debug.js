'use strict';
// ---------------------------------------------------------------------------
// Debug logger
// ---------------------------------------------------------------------------
var _dbgLogs = [];
var _dbgCollapsed = false;

function uiLog(msg, type) {
  const t = type || 'info';
  const now = new Date();
  const ts = now.toTimeString().slice(0, 8);
  _dbgLogs.push({ ts, msg, t });
  const empty = document.getElementById('dbg-empty');
  if (empty) empty.remove();
  const body = document.getElementById('dbg-body');
  const el = document.createElement('div');
  el.className = 'dbg-entry';
  el.innerHTML = '<span class="dbg-ts">' + ts + '</span>'
    + '<span class="dbg-msg ' + t + '">' + escHtml(String(msg)) + '</span>';
  body.appendChild(el);
  body.scrollTop = body.scrollHeight;
  const cnt = document.getElementById('dbg-count');
  if (cnt) cnt.textContent = _dbgLogs.length;
  if (t === 'err') console.error('[DBG]', msg);
  else console.log('[DBG]', msg);
}

function dbgToggle() {
  _dbgCollapsed = !_dbgCollapsed;
  const w = document.getElementById('dbg-widget');
  const tog = document.getElementById('dbg-tog');
  w.classList.toggle('collapsed', _dbgCollapsed);
  if (tog) tog.textContent = _dbgCollapsed ? '+' : '−';
}

function dbgCopy(btn) {
  const text = _dbgLogs.map(l => l.ts + '  ' + l.msg).join('\n');
  navigator.clipboard.writeText(text).then(() => {
    const orig = btn.textContent;
    btn.textContent = 'Copied!';
    setTimeout(() => { btn.textContent = orig; }, 1200);
  }).catch(() => {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;opacity:0;top:0;left:0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    const orig = btn.textContent;
    btn.textContent = 'Copied!';
    setTimeout(() => { btn.textContent = orig; }, 1200);
  });
}

function dbgClear() {
  _dbgLogs = [];
  const body = document.getElementById('dbg-body');
  body.innerHTML = '<div class="dbg-empty" id="dbg-empty">No logs yet.</div>';
  const cnt = document.getElementById('dbg-count');
  if (cnt) cnt.textContent = '0';
}
