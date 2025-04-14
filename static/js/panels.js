// ==============================
// PANELS MODULE
// ==============================

// ==============================
// GLOBAL PANEL TOGGLE FUNCTION
// ==============================
export function togglePanel(header) {
  const panel = header.closest('.panel');
  const body = header.nextElementSibling;
  const panelId = panel.id;

  // Collapse other panels
  document.querySelectorAll('.panel').forEach(p => {
    if (p !== panel) {
      p.classList.remove('open');
      const otherBody = p.querySelector('.panel-body');
      if (otherBody) otherBody.classList.remove('open');
    }
  });

  const isOpen = panel.classList.toggle('open');
  header.classList.toggle('open', isOpen);
  if (body) body.classList.toggle('open', isOpen);

  // ==============================
  // Bounce animation + auto scroll
  // ==============================
  if (isOpen) {
    header.classList.remove('bounce');
    void header.offsetWidth;
    header.classList.add('bounce');

    setTimeout(() => {
      requestAnimationFrame(() => {
        const yOffset = -14;
        const y = header.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({ top: y, behavior: 'smooth' });
      });
    }, 250);

    // ==============================
    // Auto-close on click inside body (with exclusions)
    // ==============================
    if (panelId !== 'downloads') {
      const closePanelOnTouch = (event) => {
        const target = event.target;

        // === Exclude clicks inside header
        const isInsideHeader = header.contains(target);

        // === Exclude clicks on scheduled date input/display
        const isDateInput = panelId === 'scheduled' &&
          (target.closest('#working-date') || target.closest('.custom-date-display'));

        // === Exclude based on tag type
        const isInteractive = ['BUTTON', 'INPUT', 'SELECT', 'A']
          .includes(target.tagName);

        // === Exclude based on class
        const isIgnoredClass = target.closest('.downloads');

        if (!isInsideHeader && !isDateInput && !isInteractive && !isIgnoredClass) {
          panel.classList.remove('open');
          header.classList.remove('open');
          body.classList.remove('open');
          body.removeEventListener('click', closePanelOnTouch);
        }
      };

      body.addEventListener('click', closePanelOnTouch);
    }
  }

  // ==============================
  // Mobile focus reset
  // ==============================
  if (!isOpen) {
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
// Optional: Exclude container by selector
// ==============================
export function collapseAllPanels({ excludeSelector = null } = {}) {
  document.querySelectorAll('.panel-body').forEach(body => {
    if (excludeSelector && body.closest(excludeSelector)) return;
    body.classList.remove('open');
  });
}
