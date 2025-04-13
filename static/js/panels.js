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

  // Only bounce when opening
  if (isOpen) {
    header.classList.remove('bounce');
    void header.offsetWidth;
    header.classList.add('bounce');
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
// INIT: COLLAPSE ALL ON LOAD
// ==============================
export function collapseAllPanels() {
  document.querySelectorAll('.panel-body').forEach(e => {
    e.classList.remove('open');
  });
}
