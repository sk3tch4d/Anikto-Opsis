// ==============================
// PANELS.JS — UI Panel Handling
// ==============================


// ==============================
// GLOBAL CONFIG
// ==============================

const DEBUG_MODE = localStorage.getItem("DEBUG_MODE") === "true";

// Panel IDs that should never close automatically
const nonClosablePanels = [
  "downloads",
  "seniority-search-panel",
  "inventory-search-panel",
  "zwdiseg-search-panel",
  "scheduled-search-panel",
  "search-history-panel",
  "inventory-saved-panel"
];

// Tag names that shouldn't trigger panel close
const nonClosableElements = [
  "BUTTON",
  "INPUT",
  "SELECT",
  "TEXTAREA",
  "LABEL",
  "A"
];

// Selectors for attributes or classes to ignore
const nonClosableSelectors = [
  "[panel-ignore-close]",
  ".downloads",
  ".file-action"
];

// Class-based ignores (not inside clickable container)
const nonClosableClasses = [
  "panel-delta",
  "compare-delta",
  "compare-card"
];

// Conditional rules like: ignore `.panel-delta` unless inside `.clickable-stat`
const conditionalIgnoreRules = [
  { base: ".panel-delta", unlessWithin: ".clickable-stat" }
];

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

function isDateInput(target, panelId) {
  return panelId === "scheduled" && (
    target.closest("#working-date") || target.closest(".custom-date-display")
  );
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
export function scrollPanelBody(panelId = null) {
  let panel;

  if (panelId) {
    panel = document.getElementById(panelId);
  } else {
    panel = document.querySelector('.panel.open');
  }

  const body = panel?.querySelector('.panel-body.scrollable-panel');
  if (body) {
    body.scrollTop = 0;
    DEBUG_MODE && console.log(`[DEBUG] Scrolled ${panel?.id || '(unknown panel)'} body to top`);
  }
}


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
          setTimeout(enableBodyLock, 500);
        });
      };
      body.addEventListener('transitionend', onTransitionEnd);
    } else {
      enableBodyLock();
    }

    setupTouchListeners(body, panelId, panel, header);
  });
}

export function openPanelById(panelId) {
  openPanel(panelId);
}

export function togglePanel(header) {
  const panel = header.closest('.panel');
  if (!panel?.id) return;

  const isOpen = panel.classList.contains('open');
  if (isOpen) {
    closePanel(panel);
    if (!document.querySelector('.panel.open')) disableBodyLock();
  } else {
    openPanel(panel.id);
  }
}

function closePanel(panel) {
  const header = panel.querySelector('.panel-header');
  const body = panel.querySelector('.panel-body');

  panel.classList.remove('open');
  header?.classList.remove('open');
  body?.classList.remove('open');

  setTimeout(() => {
    document.getElementById('typed-header')?.focus();
  }, 100);
}

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
    if (!shouldIgnorePanelClose(target) && !header.contains(target) && !isDateInput(target, panelId)) {
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
