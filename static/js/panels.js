// ==============================
// PANELS.JS — UI Panel Handling
// ==============================

import { initDebugToggle } from './debugging.js';

const nonClosablePanels = [
  "downloads",
  "seniority-search-panel",
  "inventory-search-panel",
  "scheduled-search-panel"
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
// OPEN PANEL
// ==============================
export function openPanel(panelId) {
  const panel = document.getElementById(panelId);
  if (!panel) return console.warn(`Panel not found: ${panelId}`);

  const header = panel.querySelector('.panel-header');
  const body = panel.querySelector('.panel-body');

  const wasOpen = panel.classList.contains('open');

  // Step 1: Collapse others
  collapseAllPanels({ excludeSelector: `#${panelId}` });

  // Step 2: Delay open so collapse DOM settles first
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
          const yOffset = -14;
          const headerRect = header.getBoundingClientRect();
          const scrollTarget = headerRect.top + window.pageYOffset + yOffset;
    
          console.log('[DEBUG] headerRect.top:', headerRect.top);
          console.log('[DEBUG] pageYOffset:', window.pageYOffset);
          console.log('[DEBUG] Final Scroll Target (y):', scrollTarget);
    
          window.scrollTo({ top: scrollTarget, behavior: 'smooth' });

          // Delay lock just enough to let scroll visually apply
          setTimeout(() => {
            enableBodyLock();
          }, 250);

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
  const panel = header.closest('.panel');
  if (!panel) return;

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

  setTimeout(() => {
    document.getElementById('mobile-focus-reset')?.focus();
  }, 10);
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
  });
}

// ==============================
// TOUCH LISTENER SETUP
// ==============================
function setupTouchListeners(body, panelId, panel, header) {
  if (nonClosablePanels.includes(panelId)) return;

  const closePanelOnTouch = (event) => {
    const target = event.target;
    const isInteractive = nonClosableElements.includes(target.tagName);
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
