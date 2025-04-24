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
// LOCK
function enableBodyLock() {
  document.documentElement.style.overflow = 'hidden';
  document.body.style.overflow = 'hidden';
}
// UNLOCK
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

  collapseAllPanels();
  panel.classList.remove("panel-closed");
  panel.classList.add("open");
  header?.classList.add("open");
  body?.classList.add("open");

  if (!wasOpen) {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const yOffset = -14;
        const y = header.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({ top: y, behavior: 'smooth' });
        setTimeout(() => enableBodyLock(), 500); // Delay to let scroll finish
      });
    });
  } else {
    enableBodyLock();
  }

  if (!nonClosablePanels.includes(panelId)) {
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
}

// Wrapper for compatibility
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
    disableBodyLock();
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
