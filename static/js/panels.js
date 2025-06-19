// ==============================
// PANELS.JS
// ==============================

import {
  DEBUG_MODE,
  conditionalIgnoreRules,
  nonButtonPanels,
  nonClosableClasses,
  nonClosableElements,
  nonClosablePanels,
  nonClosableSelectors
} from './panels/panels_config.js';
import { setBodyLock } from './panels/panels_utils.js'
import { appendCloseButton } from './panels/panels_close-button.js'

// ==============================
// HELPERS
// ==============================
function shouldIgnorePanelClose(target) {
  if (nonClosableElements.includes(target.tagName)) return true;

  if (nonClosableSelectors.some(sel => target.closest(sel))) return true;

  if (nonClosableClasses.some(cls => target.closest(`.${cls}`) && !target.closest(".clickable-stat"))) return true;

  for (const { base, unlessWithin } of conditionalIgnoreRules) {
    if (target.closest(base) && !target.closest(unlessWithin)) return true;
  }

  return false;
}

// ==============================
// PANEL SCROLL BAR
// ==============================
export function initPanelScrollBars() {
  document.querySelectorAll('.panel').forEach(panel => {
    const scrollable = panel.querySelector('.scrollable-panel');
    const bar = panel.querySelector('.panel-scroll-bar');

    if (scrollable && bar) {
      scrollable.addEventListener('scroll', () => {
        const percent = scrollable.scrollTop / (scrollable.scrollHeight - scrollable.clientHeight);
        bar.style.width = `${percent * 100}%`;
      });
    }
  });
}

// ==============================
// SCROLL PANEL BODY
// ==============================
export function scrollPanelBody(panelId = null, behavior = 'smooth') {
  let panel;

  if (panelId) {
    panel = document.getElementById(panelId);
  } else {
    panel = document.querySelector('.panel.open');
  }

  const body = panel?.querySelector('.panel-body.scrollable-panel');
  if (body) {
    body.scrollTo({ top: 0, behavior });
    DEBUG_MODE && console.log(`[DEBUG] Smooth scrolled ${panel?.id || '(unknown panel)'} body to top`);
  }
}

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
// OPEN PANEL BY ID
// ==============================
export function openPanelById(panelId) {
  openPanel(panelId);
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
// TOUCH HANDLING
// ==============================
function setupTouchListeners(body, panelId, panel, header) {
  if (nonClosablePanels.includes(panelId)) return;

  const closePanelOnTouch = (event) => {
    const target = event.target;
    if (!shouldIgnorePanelClose(target) && !header.contains(target)) {
      closePanel(panel);
      body.removeEventListener('click', closePanelOnTouch);
    }
  };

  body.addEventListener('click', closePanelOnTouch);

  let startY = null;
  const scrollable = body.querySelector('.scrollable-fill') || body;

  body.addEventListener('touchstart', (e) => {
    if (scrollable.scrollTop === 0) startY = e.touches[0].clientY;
  }, { passive: true });

  body.addEventListener('touchmove', (e) => {
    if (startY !== null) {
      const deltaY = e.touches[0].clientY - startY;
      if (deltaY > 40 && scrollable.scrollTop === 0) {
        closePanel(panel);
        startY = null;
      }
    }
  }, { passive: true });

  body.addEventListener('touchend', () => {
    startY = null;
  });
}

// ==============================
// GLOBAL WINDOW ATTACHMENTS
// ==============================
window.togglePanel = togglePanel;
window.scrollPanel = scrollPanel;
