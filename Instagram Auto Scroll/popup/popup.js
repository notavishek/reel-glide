/**
 * Reel Glide – Popup Script
 * Reads/writes settings from chrome.storage and notifies content scripts.
 */

const enabledToggle = document.getElementById('enabledToggle');
const loopToggle    = document.getElementById('loopToggle');
const delaySlider   = document.getElementById('delaySlider');
const delayValue    = document.getElementById('delayValue');
const statusBadge   = document.getElementById('statusBadge');
const statusDot     = document.getElementById('statusDot');
const statusText    = document.getElementById('statusText');
const infoText      = document.getElementById('infoText');

// ─── Format delay label ───────────────────────────────────────────────────────
function formatDelay(ms) {
  if (ms === 0) return 'Off';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

// ─── Update UI to reflect enabled state ──────────────────────────────────────
function applyEnabledState(enabled) {
  if (enabled) {
    statusBadge.className = 'status-badge active';
    statusText.textContent = 'Active';
    document.body.classList.remove('disabled');
  } else {
    statusBadge.className = 'status-badge inactive';
    statusText.textContent = 'Paused';
    document.body.classList.add('disabled');
  }
}

// ─── Update range slider fill (gradient effect) ───────────────────────────────
function updateSliderFill(slider) {
  const min = Number(slider.min);
  const max = Number(slider.max);
  const val = Number(slider.value);
  const pct = ((val - min) / (max - min)) * 100;
  slider.style.background = `linear-gradient(to right, #B06EFF ${pct}%, #1e1e2a ${pct}%)`;
}

// ─── Notify content scripts of change ────────────────────────────────────────
function broadcastSettings(patch) {
  chrome.runtime.sendMessage({ type: 'SETTINGS_UPDATE', ...patch });
}

// ─── Load settings and initialise UI ─────────────────────────────────────────
chrome.storage.sync.get(['enabled', 'delay', 'loop'], (data) => {
  const enabled = data.enabled !== false;  // default true
  const delay   = typeof data.delay === 'number' ? data.delay : 500;
  const loop    = !!data.loop;

  enabledToggle.checked = enabled;
  loopToggle.checked    = loop;
  delaySlider.value     = delay;
  delayValue.textContent = formatDelay(delay);

  applyEnabledState(enabled);
  updateSliderFill(delaySlider);

  // Check if user is currently on Instagram
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const url = tabs[0]?.url || '';
    if (url.includes('instagram.com/reels') || url.includes('instagram.com/reel/')) {
      infoText.innerHTML = '🎬 Watching Reels — auto scroll is <strong>on the job!</strong>';
    } else if (url.includes('instagram.com')) {
      infoText.innerHTML = 'Head to <strong>instagram.com/reels</strong> to activate.';
    } else {
      infoText.innerHTML = 'Open <strong>instagram.com/reels</strong> to get started.';
    }
  });
});

// ─── Event listeners ──────────────────────────────────────────────────────────
enabledToggle.addEventListener('change', () => {
  const enabled = enabledToggle.checked;
  chrome.storage.sync.set({ enabled });
  applyEnabledState(enabled);
  broadcastSettings({ enabled });
});

loopToggle.addEventListener('change', () => {
  const loop = loopToggle.checked;
  chrome.storage.sync.set({ loop });
  broadcastSettings({ loop });
});

delaySlider.addEventListener('input', () => {
  const delay = Number(delaySlider.value);
  delayValue.textContent = formatDelay(delay);
  updateSliderFill(delaySlider);
  // Debounce storage write slightly for smoother dragging
  clearTimeout(delaySlider._t);
  delaySlider._t = setTimeout(() => {
    chrome.storage.sync.set({ delay });
    broadcastSettings({ delay });
  }, 200);
});
