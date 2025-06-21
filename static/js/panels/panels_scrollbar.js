// ==============================
// PANELS_SCROLLBAR.JS
// ==============================

import { DEBUG_MODE } from './panels_config.js';

// ==============================
// PANEL SCROLL BAR
// ==============================
export function initPanelScrollBars() {
  document.querySelectorAll('.panel').forEach(panel => {
    const scrollable = panel.querySelector('.scrollable-panel');
    const bar = panel.querySelector('.panel-scroll-bar');

    if (scrollable && bar) {
      scrollable.addEventListener('scroll', () => {
        const maxScroll = scrollable.scrollHeight - scrollable.clientHeight;
        const isAtBottom = scrollable.scrollTop >= maxScroll - 1;

        // Update scroll bar width
        const percent = scrollable.scrollTop / maxScroll;
        bar.style.width = `${percent * 100}%`;

        // Debug output for scroll percent
        DEBUG_MODE && console.log(`[DEBUG] Scroll percent: ${(percent * 100).toFixed(1)}%`);

        // Focus close button at bottom
        if (isAtBottom) {
          const closeButton = panel.querySelector('.close-button');
          closeButton?.focus();
          DEBUG_MODE && console.log('[DEBUG] Focused close button at bottom');
        }
      });
    }
  });
}
