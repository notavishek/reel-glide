/**
 * Reel Glide – Content Script
 * Detects when an Instagram Reel ends and auto-scrolls to the next one.
 */

(function () {
  'use strict';

  // ─── State ──────────────────────────────────────────────────────────────────
  let enabled = true;
  let delayMs = 500;          // Configurable delay before scrolling
  let loopReels = false;      // Whether to loop back to first reel at the end
  let scrollTimeout = null;
  let attachedVideos = new WeakSet();
  let observer = null;
  let isScrolling = false;

  // ─── Load settings from storage ─────────────────────────────────────────────
  chrome.storage.sync.get(['enabled', 'delay', 'loop'], (data) => {
    if (typeof data.enabled !== 'undefined') enabled = data.enabled;
    if (typeof data.delay   !== 'undefined') delayMs   = data.delay;
    if (typeof data.loop    !== 'undefined') loopReels = data.loop;
  });

  // ─── Listen for settings changes from popup ──────────────────────────────────
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === 'SETTINGS_UPDATE') {
      if (typeof msg.enabled !== 'undefined') enabled = msg.enabled;
      if (typeof msg.delay   !== 'undefined') delayMs   = msg.delay;
      if (typeof msg.loop    !== 'undefined') loopReels = msg.loop;
    }
  });

  // ─── Check if we're on a Reels page ─────────────────────────────────────────
  function isReelsPage() {
    return window.location.pathname.startsWith('/reels') ||
           window.location.pathname.includes('/reel/');
  }

  // ─── Scroll to next reel ─────────────────────────────────────────────────────
  function scrollToNextReel() {
    if (!enabled || isScrolling) return;

    isScrolling = true;

    // Strategy 1: Click the "Next" chevron button Instagram provides
    const nextButtons = document.querySelectorAll([
      'button[aria-label="Next"]',
      'button[aria-label="next"]',
      '[role="button"][aria-label*="Next"]',
      '[role="button"][aria-label*="next"]',
      // Chevron / arrow-down SVG buttons in the reel nav
      'svg[aria-label="Next"] closest button',
    ].join(','));

    let clicked = false;
    for (const btn of nextButtons) {
      if (btn && btn.offsetParent !== null) {
        btn.click();
        clicked = true;
        break;
      }
    }

    if (!clicked) {
      // Strategy 2: Simulate ArrowDown keypress (Instagram's own shortcut)
      const keyDown = new KeyboardEvent('keydown', {
        key:        'ArrowDown',
        code:       'ArrowDown',
        keyCode:    40,
        which:      40,
        bubbles:    true,
        cancelable: true,
      });
      document.dispatchEvent(keyDown);
    }

    // Reset scrolling lock after a short delay
    setTimeout(() => { isScrolling = false; }, 1500);
  }

  // ─── Attach "ended" listener to a video element ──────────────────────────────
  function attachToVideo(video) {
    if (attachedVideos.has(video)) return;
    attachedVideos.add(video);

    video.addEventListener('ended', () => {
      if (!enabled) return;
      if (!isReelsPage() && !isInReelsFeed()) return;

      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(scrollToNextReel, delayMs);
    });

    // Also watch for when duration nearly ends (within 0.3s) as a fallback
    // because some Instagram reels loop by default and don't fire 'ended'
    video.addEventListener('timeupdate', () => {
      if (!enabled) return;
      if (!isInReelsFeed()) return;
      const remaining = video.duration - video.currentTime;
      if (!isNaN(remaining) && remaining > 0 && remaining < 0.3 && !video.loop) {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(scrollToNextReel, delayMs + 300);
      }
    });
  }

  // ─── Check if currently in a reels-style feed (vertical scroll) ─────────────
  function isInReelsFeed() {
    // Instagram reels live inside an <article> or specific section
    // Check URL as primary signal
    const path = window.location.pathname;
    return path.startsWith('/reels') || path.includes('/reel/');
  }

  // ─── Scan DOM for video elements and attach listeners ───────────────────────
  function scanAndAttach() {
    const videos = document.querySelectorAll('video');
    videos.forEach(attachToVideo);
  }

  // ─── Observe DOM mutations to catch dynamically added videos ────────────────
  function startObserving() {
    if (observer) observer.disconnect();

    observer = new MutationObserver((mutations) => {
      let shouldScan = false;
      for (const mutation of mutations) {
        if (mutation.addedNodes.length > 0) {
          shouldScan = true;
          break;
        }
      }
      if (shouldScan) scanAndAttach();
    });

    observer.observe(document.body, {
      childList: true,
      subtree:   true,
    });
  }

  // ─── Watch for Instagram SPA navigation (URL changes) ───────────────────────
  let lastPathname = window.location.pathname;

  function onNavigate() {
    const current = window.location.pathname;
    if (current !== lastPathname) {
      lastPathname = current;
      // Small delay to let Instagram finish rendering the new view
      setTimeout(scanAndAttach, 800);
    }
  }

  // Instagram uses pushState/replaceState for navigation
  const originalPushState    = history.pushState.bind(history);
  const originalReplaceState = history.replaceState.bind(history);

  history.pushState = function (...args) {
    originalPushState(...args);
    onNavigate();
  };

  history.replaceState = function (...args) {
    originalReplaceState(...args);
    onNavigate();
  };

  window.addEventListener('popstate', onNavigate);

  // ─── Boot ────────────────────────────────────────────────────────────────────
  scanAndAttach();
  startObserving();

  // Also do a delayed scan because Instagram loads content asynchronously
  setTimeout(scanAndAttach, 1500);
  setTimeout(scanAndAttach, 3000);

})();
