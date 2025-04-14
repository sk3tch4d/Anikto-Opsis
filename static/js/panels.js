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

  // Bounce only when opening
  if (isOpen) {
    header.classList.remove('bounce');
    void header.offsetWidth;
    header.classList.add('bounce');

    // Scroll after layout is stable
    setTimeout(() => {
      requestAnimationFrame(() => {
        const yOffset = -14; // adjust for sticky header
        const y = header.getBoundingClientRect().top + window.pageYOffset + yOffset;
        window.scrollTo({ top: y, behavior: 'smooth' });
      });
    }, 250);

    // Auto-close when tapping inside the panel body (with exclusions)
    if (panelId !== 'downloads') {
      const closePanelOnTouch = (event) => {
        const target = event.target;

        const isInsideHeader = header.contains(target);
        const isDateInput = panelId === 'scheduled' &&
          (target.closest('#working-date') || target.closest('.custom-date-display'));

        if (!isInsideHeader && !isDateInput) {
          panel.classList.remove('open');
          header.classList.remove('open');
          body.classList.remove('open');
          body.removeEventListener('click', closePanelOnTouch);
        }
      };

      body.addEventListener('click', closePanelOnTouch);
    }
  }

  // Mobile focus reset
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
// Optional: Exclude container by 
// selector "#exclusion-name"
// ==============================
export function collapseAllPanels({ excludeSelector = null } = {}) {
  document.querySelectorAll('.panel-body').forEach(body => {
    if (excludeSelector && body.closest(excludeSelector)) return;
    body.classList.remove('open');
  });
}
