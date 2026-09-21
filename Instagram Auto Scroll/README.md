# Reel Glide - Instagram Auto Scroll Extension

A Manifest V3 Chrome/Edge browser extension that automatically scrolls to the next Instagram Reel when the current one finishes playing.

## Features
- Auto-scrolls to the next Reel the moment the current one ends
- Configurable delay (0ms to 3 seconds) before advancing
- Loop toggle - restart from the top when the feed ends
- Beautiful popup UI with dark theme and gradient accents
- Lightweight - no external dependencies, pure vanilla JS

## Installation (Developer Mode)
1. Clone or download this repo
2. Open chrome://extensions in Chrome/Edge
3. Enable Developer mode (top-right toggle)
4. Click Load unpacked and select this folder
5. Navigate to instagram.com/reels and enjoy!

## How It Works
1. A MutationObserver watches for video elements as Instagram's React SPA re-renders
2. Each video gets an ended event listener + a timeupdate fallback
3. On trigger - waits your configured delay - clicks Instagram's native Next button, or falls back to an ArrowDown keyboard event
4. Intercepts history.pushState so listeners re-attach on SPA navigation

## Project Structure
- manifest.json
- icons/ (icon16, icon48, icon128)
- background/service_worker.js
- content/content.js
- popup/ (popup.html, popup.css, popup.js)

## License
MIT
