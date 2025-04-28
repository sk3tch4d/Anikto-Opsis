// ==============================
// HELPERS.JS
// ==============================

// ==============================
// REMOVE FOCUS: element, selector, or event
// ==============================
export function removeFocus(target) {
  if (!target) return;

  if (typeof target === 'string') {
    // Assume it's a selector or ID
    const el = document.querySelector(target);
    if (el && typeof el.blur === 'function') el.blur();
  } else if (target instanceof Event && target.currentTarget) {
    // Handle event object
    if (typeof target.currentTarget.blur === 'function') target.currentTarget.blur();
  } else if (typeof target.blur === 'function') {
    // Handle element directly
    target.blur();
  }
}
