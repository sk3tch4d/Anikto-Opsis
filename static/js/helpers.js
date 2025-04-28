// ==============================
// HELPERS.JS
// ==============================

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
}
