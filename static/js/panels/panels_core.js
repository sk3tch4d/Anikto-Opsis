// ==============================
// PANELS_CORE.JS
// ==============================

import { DEBUG_MODE, nonButtonPanels } from './panels_config.js';
import { setBodyLock } from './panels_utils.js';
import { appendCloseButton } from './panels_close-button.js'
import { setupTouchListeners } from './panels_touch.js'

// ==============================
// SCROLL TO HEADER
// ==============================
export function scrollPanel(header = null, yOffset = -14, delay = 10) {
  if (!header) {
    const openPanel = document.querySelector('.panel.open');
    header = openPanel?.querySelector('.panel-header');
  }

  if (!header) return;

  const headerRect = header.getBoundingClientRect();
  const scrollTarget = headerRect.top + window.pageYOffset + yOffset;

  DEBUG_MODE && console.log('[DEBUG] Scroll target:', scrollTarget);

  setTimeout(() => {
    window.scrollTo({ top: scrollTarget, behavior: 'smooth' });
  }, delay);
}

// ==============================
// PANEL CORE
// ==============================
export function openPanel(panelId) {
  DEBUG_MODE && console.log('[DEBUG] Opening panel:', panelId);

  const panel = document.getElementById(panelId);
  if (!panel) return console.warn(`[DEBUG] Panel not found: ${panelId}`);

  const header = panel.querySelector('.panel-header');
  const body = panel.querySelector('.panel-body');
  const wasOpen = panel.classList.contains('open');

  collapseAllPanels({ excludeSelector: `#${panelId}` });

  requestAnimationFrame(() => {
    panel.classList.remove("panel-closed");
    panel.classList.add("open");
    header?.classList.add("open");
    body?.classList.add("open");

    if (!wasOpen) {
      const onTransitionEnd = (e) => {
        if (e.propertyName !== 'max-height') return;
        body.removeEventListener('transitionend', onTransitionEnd);

        requestAnimationFrame(() => {
          scrollPanel(header);
          setTimeout(() => setBodyLock(true), 500);
          setupTouchListeners(body, panelId, panel, header);

          // Only append the close button + spacer if panel supports it
          if (!nonButtonPanels.includes(panelId)) {
            appendCloseButton(panel, panelId);
          }
        });
      };
      body.addEventListener('transitionend', onTransitionEnd);
    } else {
      setBodyLock(true);
    }
  });
}

// ==============================
// TOGGLE PANEL
// ==============================
export function togglePanel(header) {
  const panel = header.closest('.panel');
  if (!panel?.id) return;

  const isOpen = panel.classList.contains('open');
  if (isOpen) {
    closePanel(panel);
    if (!document.querySelector('.panel.open')) setBodyLock(false);
  } else {
    openPanel(panel.id);
  }
}

// ==============================
// CLOSE PANEL
// ==============================
export function closePanel(panel) {
  const header = panel.querySelector('.panel-header');
  const body = panel.querySelector('.panel-body');

  panel.classList.remove('open');
  header?.classList.remove('open');
  body?.classList.remove('open');

  document.querySelector('.close-button')?.remove();

  setTimeout(() => {
    document.getElementById('typed-header')?.focus();
  }, 100);
}

// ==============================
// COLLAPSE ALL PANELS
// ==============================
export function collapseAllPanels({ excludeSelector = null } = {}) {
  const exclusions = Array.isArray(excludeSelector) ? excludeSelector : excludeSelector ? [excludeSelector] : [];

  document.querySelectorAll('.panel-body').forEach(body => {
    const panel = body.closest('.panel');
    if (exclusions.some(sel => panel?.matches(sel))) return;

    body.classList.remove('open');
    panel?.classList.remove('open');
  });
}

// ==============================
// GLOBAL WINDOW ATTACHMENTS
// ==============================
window.togglePanel = togglePanel;
window.scrollPanel = scrollPanel;
