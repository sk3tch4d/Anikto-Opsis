// ==============================
// PANELS MODULE
// ==============================

// ==============================
// GLOBAL PANEL TOGGLE FUNCTION
// ==============================
export function togglePanel(header) {
  const panel = header.closest('.panel');
  const body = header.nextElementSibling;

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

    // Scroll to the panel header
    setTimeout(() => {
      header.scrollIntoView({ behavior: 'smooth', block: 'start' });
      window.scrollBy(0, -20); // offset for header
    }, 200); // slight delay for smooth animation sync
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
