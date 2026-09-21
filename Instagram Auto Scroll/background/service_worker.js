/**
 * Reel Glide – Background Service Worker
 * Manages extension state across tabs.
 */

chrome.runtime.onInstalled.addListener(() => {
  // Set sensible defaults on install
  chrome.storage.sync.set({
    enabled: true,
    delay:   500,
    loop:    false,
  });
});

// Forward messages from popup to active Instagram tab
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'SETTINGS_UPDATE') {
    // Broadcast to all Instagram tabs
    chrome.tabs.query({ url: 'https://www.instagram.com/*' }, (tabs) => {
      for (const tab of tabs) {
        chrome.tabs.sendMessage(tab.id, msg).catch(() => {});
      }
    });
  }
  sendResponse({ ok: true });
  return true;
});
