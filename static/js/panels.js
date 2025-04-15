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
    closePanel();
  } else {
    openPanel();
  }

  // ==============================
  // Helper: OPEN PANEL
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

     //  Lock scroll AFTER scrolling completes
     //  setTimeout(() => {
       //  document.body.classList.add('lock-scroll');
       //}, 300);
      });
    }, 250);

    // Auto-close on tap inside body
    if (panelId !== 'downloads') {
      const closePanelOnTouch = (event) => {
        const target = event.target;
        const isInsideHeader = header.contains(target);
        const isDateInput = panelId === 'scheduled' &&
          (target.closest('#working-date') || target.closest('.custom-date-display'));
        const isInteractive = ['BUTTON', 'INPUT', 'SELECT', 'A'].includes(target.tagName);
        const isIgnoredClass = target.closest('.downloads') || target.closest('.file-action');

        if (!isInsideHeader && !isDateInput && !isInteractive && !isIgnoredClass) {
          closePanel();
          body.removeEventListener('click', closePanelOnTouch);
        }
      };

      body.addEventListener('click', closePanelOnTouch);

      // Pull-to-close when at top
      let startY = null;
      body.addEventListener('touchstart', (e) => {
        if (body.scrollTop === 0) {
          startY = e.touches[0].clientY;
        }
      }, { passive: true });

      body.addEventListener('touchmove', (e) => {
        if (startY !== null) {
          const currentY = e.touches[0].clientY;
          const deltaY = currentY - startY;

          if (deltaY > 40 && body.scrollTop === 0) {
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
    // document.body.classList.remove('lock-scroll');

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
