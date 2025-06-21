// ==============================
// PANELS_SCROLLBAR.JS
// ==============================

import { DEBUG_MODE } from './panels_config.js';

// ==============================
// PANEL SCROLL BAR
// ==============================
scrollable.addEventListener('scroll', () => {
  const maxScroll = scrollable.scrollHeight - scrollable.clientHeight;
  const scrollTop = scrollable.scrollTop;
  const scrollPercent = scrollTop / maxScroll;
  bar.style.width = `${scrollPercent * 100}%`;

  DEBUG_MODE && console.log(`[DEBUG] Scroll percent: ${(scrollPercent * 100).toFixed(1)}%`);

  const closeButton = panel.querySelector('.close-button');
  if (!closeButton) return;

  if (scrollPercent >= 0.95) {
    if (document.activeElement !== closeButton) {
      closeButton.focus();
      DEBUG_MODE && console.log('[DEBUG] Focused close button (>= 95%)');
    }
  } else {
    if (document.activeElement === closeButton) {
      closeButton.blur();
      DEBUG_MODE && console.log('[DEBUG] Blurred close button (< 95%)');
    }
  }
});
