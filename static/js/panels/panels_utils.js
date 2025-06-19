// ==============================
// PANELS_UTILS.JS
// ==============================

import { DEBUG_MODE } from './panels_config.js';

// ==============================
// BODY SCROLL LOCK
// ==============================
export function setBodyLock(lock = true) {
  const value = lock ? 'hidden' : '';
  document.documentElement.style.overflow = value;
  document.body.style.overflow = value;
}

// ==============================
// SCROLL PANEL BODY
// ==============================
export function scrollPanelBody(panelId = null, behavior = 'smooth') {
  let panel;

  if (panelId) {
    panel = document.getElementById(panelId);
  } else {
    panel = document.querySelector('.panel.open');
  }

  const body = panel?.querySelector('.panel-body.scrollable-panel');
  if (body) {
    body.scrollTo({ top: 0, behavior });
    DEBUG_MODE && console.log(`[DEBUG] Smooth scrolled ${panel?.id || '(unknown panel)'} body to top`);
  }
}
