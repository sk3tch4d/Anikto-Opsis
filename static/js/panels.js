// ==============================
// PANELS.JS — UI Panel Handling
// ==============================


// ==============================
// GLOBAL CONST
// ==============================

const DEBUG_MODE = localStorage.getItem("DEBUG_MODE") === "true";

const nonClosablePanels = [
  "downloads",
  "seniority-search-panel",
  "inventory-search-panel",
  "zwdiseg-search-panel",
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

  DEBUG_MODE && console.log('[DEBUG] headerRect.top: ', headerRect.top);
  DEBUG_MODE && console.log('[DEBUG] pageYOffset: ', window.pageYOffset);
  DEBUG_MODE && console.log('[DEBUG] Final Scroll Target (y): ', scrollTarget);

  setTimeout(() => {
    window.scrollTo({ top: scrollTarget, behavior: 'smooth' });
  }, delay);
}


// ==============================
// OPEN PANEL
// ==============================
export function openPanel(panelId) {
  DEBUG_MODE && console.log('[DEBUG] Attempting to open panel with ID: ', panelId);
  
  const panel = document.getElementById(panelId);
  if (!panel) return console.warn(`[DEBUG] Panel not found for ID: ${panelId}`);

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

          // Delay lock enough to let scroll visually apply
          setTimeout(() => {
            enableBodyLock();
          }, 500);
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
  DEBUG_MODE && console.log('[DEBUG] Attempting toggle panel with header: ', header);
  
  const panel = header.closest('.panel');
  if (!panel.id) {
    DEBUG_MODE && console.warn('[DEBUG] togglePanel called on panel with no ID:', panel);
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

  DEBUG_MODE && console.log('[DEBUG] Closing panel:', panel.id || panel);
  
  panel.classList.remove('open');
  header?.classList.remove('open');
  body?.classList.remove('open');
  
  // FOCUS HEADER
  setTimeout(() => {
    document.getElementById('typed-header')?.focus();
  }, 100);
}

// ==============================
// COLLAPSE PANELS
// ==============================
export function collapseAllPanels({ excludeSelector = null } = {}) {
  const exclusions = Array.isArray(excludeSelector) ? excludeSelector : excludeSelector ? [excludeSelector] : [];

  DEBUG_MODE && console.log('[DEBUG] Collapsing panels, excluding:', exclusions);
  
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
