// ==============================
// PANELS MODULE
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
// LOCK / UNLOCK BODY SCROLL
// ==============================
function enableBodyLock() {
  document.body.classList.add('lock-scroll');
}
function disableBodyLock() {
  document.body.classList.remove('lock-scroll');
}


// ==============================
// OPEN PANEL (panelID)
// ==============================
export function openPanelById(panelId) {
  const panel = document.getElementById(panelId);
  if (!panel) {
    console.warn(`Panel not found: ${panelId}`);
    return;
  }

  const header = panel.querySelector('.panel-header');
  const body = panel.querySelector('.panel-body');
  
  // Always collapse others first
  collapseAllPanels();
  
  // Always remove 'panel-closed' to show
  panel.classList.remove("panel-closed");
  
  panel.classList.add("open");
  header?.classList.add("open");
  body?.classList.add("open");
  
   // Scroll into view
  panel.scrollIntoView({ behavior: "smooth", block: "start" });
}

// ==============================
// GLOBAL PANEL TOGGLE FUNCTION
// ==============================
export function togglePanel(header) {
  const panel = header.closest('.panel');
  const body = header.nextElementSibling;
  const panelId = panel.id;

  // Collapse all other panels
  document.querySelectorAll('.panel').forEach(p => {
    if (p !== panel) {
      p.classList.remove('open');
      const otherBody = p.querySelector('.panel-body');
      if (otherBody) otherBody.classList.remove('open');
    }
  });

  const isOpen = panel.classList.contains('open');

  if (isOpen) {
    disableBodyLock();
    closePanel();
  } else {
    enableBodyLock();
    openPanel();
  }

  // ==============================
  // HELPER: OPEN PANEL
  // ==============================
  function openPanel() {
    panel.classList.add('open');
    header.classList.add('open');
    body.classList.add('open');

    // Bounce effect
    header.classList.remove('bounce');
    void header.offsetWidth;
    header.classList.add('bounce');

    // Smooth scroll into view
    setTimeout(() => {
      requestAnimationFrame(() => {
        const yOffset = -14;
        const y = header.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({ top: y, behavior: 'smooth' });
      });
    }, 250);

    // Auto-close on tap inside body
    if (!nonClosablePanels.includes(panelId)) {
      const closePanelOnTouch = (event) => {
        const target = event.target;
        const isInsideHeader = header.contains(target);
        const isDateInput = panelId === 'scheduled' &&
          (target.closest('#working-date') || target.closest('.custom-date-display'));
        const isInteractive = nonClosableElements.includes(target.tagName);
        const isIgnoredClass = target.closest('.downloads') || target.closest('.file-action');
        const isIgnoredElement = target.closest('[panel-ignore-close]');


        if (!isInsideHeader && !isDateInput && !isInteractive && !isIgnoredClass && !isIgnoredElement) {
          closePanel();
          body.removeEventListener('click', closePanelOnTouch);
        }
      };

      body.addEventListener('click', closePanelOnTouch);

      // ==============================
      // Touch scroll close (smart scroll-aware)
      // ==============================
      let startY = null;
      const scrollable = body.querySelector('.scrollable-fill') || body;

      body.addEventListener('touchstart', (e) => {
        if (scrollable.scrollTop === 0) {
          startY = e.touches[0].clientY;
        }
      }, { passive: true });

      body.addEventListener('touchmove', (e) => {
        if (startY !== null) {
          const currentY = e.touches[0].clientY;
          const deltaY = currentY - startY;

          if (deltaY > 40 && scrollable.scrollTop === 0) {
            closePanel();
            startY = null;
          }
        }
      }, { passive: true });

      body.addEventListener('touchend', () => {
        startY = null;
      });
    }
  }

  // ==============================
  // Helper: CLOSE PANEL
  // ==============================
  function closePanel() {
    panel.classList.remove('open');
    header.classList.remove('open');
    body.classList.remove('open');

    setTimeout(() => {
      const resetTarget = document.getElementById('mobile-focus-reset');
      if (resetTarget) {
        resetTarget.focus();
      }
    }, 10);
  }
}

// ==============================
// COLLAPSE ALL PANELS
// Optional: Exclude container(s) by selector(s)
// ==============================
export function collapseAllPanels({ excludeSelector = null } = {}) {
  const exclusions = Array.isArray(excludeSelector)
    ? excludeSelector
    : excludeSelector
    ? [excludeSelector]
    : [];

  document.querySelectorAll('.panel-body').forEach(body => {
    const panel = body.closest('.panel');

    if (exclusions.some(sel => panel?.matches(sel))) return;

    if (initDebugToggle()) {
      console.log(`[DEBUG] Collapsing panel: ${panel?.id}`);
    }

    body.classList.remove('open');
    panel?.classList.remove('open');
  });
}
