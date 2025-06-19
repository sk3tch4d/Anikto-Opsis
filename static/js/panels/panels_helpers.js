// ==============================
// PANELS_HELPERS.JS
// ==============================

import {
  conditionalIgnoreRules,
  nonClosableClasses,
  nonClosableElements,
  nonClosableSelectors
} from './panels_config.js';

// ==============================
// PANEL CLOSABLE CHECK
// ==============================
export function isClosablePanel(target) {
  return !(
    nonClosableElements.includes(target.tagName) ||
    nonClosableSelectors.some(sel => target.closest(sel)) ||
    nonClosableClasses.some(cls => target.closest(`.${cls}`) && !target.closest(".clickable-stat")) ||
    conditionalIgnoreRules.some(({ base, unlessWithin }) =>
      target.closest(base) && !target.closest(unlessWithin)
    )
  );
}
