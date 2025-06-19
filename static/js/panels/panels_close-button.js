// ==============================
// PANELS_CLOSE-BUTTON.JS
// ==============================

import { closePanel } from '../panels.js'
import { disableBodyLock } from './panels_utils.js'
import { DEBUG_MODE, nonButtonPanels } from './panels_config.js';

// ==============================
// FLOATING CLOSE BUTTON
// ==============================
export function appendFloatingCloseButton(panel, panelId) {
  if (!panel) return;

  const scrollable = panel.querySelector('.scrollable-panel');
  if (!scrollable) return;

  // Remove any existing close button and spacer
  panel.querySelector('.close-button')?.remove();
  scrollable.querySelector('.panel-bottom-spacer')?.remove();

  const button = document.createElement('div');
  button.className = 'close-button';
  button.innerHTML = '✕';
  button.title = 'Close panel';
  button.setAttribute('aria-label', 'Close panel');
  button.setAttribute('role', 'button');
  button.tabIndex = 0;

  button.addEventListener('click', () => {
    closePanel(panel);
    disableBodyLock();
    button.remove();
    scrollable.querySelector('.panel-bottom-spacer')?.remove();
  });

  panel.appendChild(button);

  const MIN_PANEL_HEIGHT = 260;
  const resizeObs = new ResizeObserver(() => {
    const shouldShow = panel.offsetHeight >= MIN_PANEL_HEIGHT;
    button.style.display = shouldShow ? 'flex' : 'none';

    // Add or remove spacer based on visibility
    const existingSpacer = scrollable.querySelector('.panel-bottom-spacer');
    if (shouldShow) {
      if (!existingSpacer) {
        const spacer = document.createElement('div');
        spacer.className = 'panel-bottom-spacer';
        scrollable.appendChild(spacer);
      }
    } else {
      existingSpacer?.remove();
    }
  });
  resizeObs.observe(panel);
}
