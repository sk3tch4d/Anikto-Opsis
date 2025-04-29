// ==============================
// HELPERS.JS
// ==============================


// ==============================
// SET VISIBILITY: ELEMENTID
// Smart: Remember Element Value
// ==============================
export function setVisibility(elementId, show) {
  const element = document.getElementById(elementId);
  if (!element) return;

  if (show) {
    // Restore the original display if we stored it
    element.style.display = element.dataset.originalDisplay || 'block';
  } else {
    // Store the original display only the first time
    if (!element.dataset.originalDisplay) {
      element.dataset.originalDisplay = window.getComputedStyle(element).display;
    }
    element.style.display = 'none';
  }
}

// ==============================
// REMOVE FOCUS: element, selector, or event
// ==============================
export function removeFocus(target) {
  if (!target) return;

  setTimeout(() => {
    if (typeof target === 'string') {
      const el = document.querySelector(target);
      if (el && typeof el.blur === 'function') el.blur();
    } else if (target instanceof Event && target.currentTarget) {
      if (typeof target.currentTarget.blur === 'function') target.currentTarget.blur();
    } else if (typeof target.blur === 'function') {
      target.blur();
    }
  }, 0); // Run blur AFTER the click/touch finishes

  console.log('Trying to blur:', target);
}
