// ==============================
// PANELS.JS — UI Panel Handling
// ==============================

import { initDebugToggle } from './debugging.js';

// ==============================

const nonClosablePanels = [
  "downloads",
  "seniority-search-panel",
  "inventory-search-panel",
  "scheduled-search-panel",
  "search-history-panel",
  "inventory-saved-panel"
];
const nonClosableElements = [
  "BUTTON",
  "INPUT",
  "SELECT",
  "TEXTAREA",
  "LABEL",
  "A"
];

// ==============================
// SCROLL LOCK
// ==============================
function enableBodyLock() {
  document.documentElement.style.overflow = 'hidden';
  document.body.style.overflow = 'hidden';
}

function disableBodyLock() {
  document.documentElement.style.overflow = '';
  document.body.style.overflow = '';
}

// ==============================
// SCROLL TO HEADER
// ==============================
export function scrollPanel(header = null, yOffset = -14, delay = 10) {
  if (!header) {
    console.warn('scrollPanel: No header found to scroll. Defaulted');
    const openPanel = document.querySelector('.panel.open');
    header = openPanel?.querySelector('.panel-header');
  }

  if (!header) return;

  const headerRect = header.getBoundingClientRect();
  const scrollTarget = headerRect.top + window.pageYOffset + yOffset;

  setTimeout(() => {
    window.scrollTo({ top: scrollTarget, behavior: 'smooth' });
  }, delay);
}

// ==============================
// OPEN PANEL
// ==============================
export function openPanel(panelId) {
  const panel = document.getElementById(panelId);
  if (!panel) return console.warn(`Panel not found: ${panelId}`);

  const header = panel.querySelector('.panel-header');
  const body = panel.querySelector('.panel-body');

  const wasOpen = panel.classList.contains('open');

  collapseAllPanels({ excludeSelector: `#${panelId}` });

  requestAnimationFrame(() => {
    panel.classList.remove("panel-closed");
    panel.classList.add("open");
    header?.classList.add("open");
    body?.classList.add("open");

    panel.setAttribute("aria-expanded", "true");

    if (!wasOpen) {
      const onTransitionEnd = (e) => {
        if (e.propertyName !== 'max-height') return;
        body.removeEventListener('transitionend', onTransitionEnd);
        requestAnimationFrame(() => {
          scrollPanel(header);
          const computedStyle = window.getComputedStyle(body);
          const duration = parseFloat(computedStyle.transitionDuration) * 1000;
          setTimeout(() => {
            enableBodyLock();
          }, duration);
        });
      };
      body.addEventListener('transitionend', onTransitionEnd);
    } else {
      enableBodyLock();
    }

    setupTouchListeners(body, panelId, panel, header);
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
  if (!header) {
    console.warn('togglePanel: No header provided');
    return;
  }
  const panel = header.closest('.panel');
  if (!panel) {
    console.warn('togglePanel: Header not inside a .panel');
    return;
  }

  const isOpen = panel.classList.contains('open');
  if (isOpen) {
    closePanel(panel);
    const stillOpen = document.querySelector('.panel.open');
    if (!stillOpen) disableBodyLock();
  } else {
    openPanel(panel.id);
  }
}

// ==============================
// CLOSE PANEL
// ==============================
function closePanel(panel) {
  const header = panel.querySelector('.panel-header');
  const body = panel.querySelector('.panel-body');

  panel.classList.remove('open');
  header?.classList.remove('open');
  body?.classList.remove('open');
  panel.setAttribute("aria-expanded", "false");

  setTimeout(() => {
    document.getElementById('typed-header')?.focus();
  }, 100);
}

// ==============================
// COLLAPSE PANELS
// ==============================
export function collapseAllPanels({ excludeSelector = null } = {}) {
  const exclusions = Array.isArray(excludeSelector) ? excludeSelector : excludeSelector ? [excludeSelector] : [];

  document.querySelectorAll('.panel-body').forEach(body => {
    const panel = body.closest('.panel');
    if (exclusions.some(sel => panel?.matches(sel))) return;

    body.classList.remove('open');
    panel?.classList.remove('open');
    panel?.setAttribute("aria-expanded", "false");
  });
}

// ==============================
// TOUCH LISTENER SETUP
// ==============================
function setupTouchListeners(body, panelId, panel, header) {
  if (nonClosablePanels.includes(panelId)) return;

  body.removeEventListener('click', body.__panelClickListener || (() => {}));

  const closePanelOnTouch = (event) => {
    const target = event.target;
    const isInteractive = nonClosableElements.includes(target.tagName) || target.hasAttribute('contenteditable');
    const isIgnored = target.closest('[panel-ignore-close], .downloads, .file-action');
    const isInsideHeader = header.contains(target);
    const isDateInput = panelId === 'scheduled' && (
      target.closest('#working-date') || target.closest('.custom-date-display')
    );

    if (!isInteractive && !isInsideHeader && !isIgnored && !isDateInput) {
      closePanel(panel);
      body.removeEventListener('click', closePanelOnTouch);
    }
  };

  body.addEventListener('click', closePanelOnTouch);
  body.__panelClickListener = closePanelOnTouch;

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
