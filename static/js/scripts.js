// ==============================
// HEADER TYPEWRITER
// ==============================
import { initTypewriter } from './header.js';
if (document.querySelector("#typed-header")) {
  initTypewriter();
}

// ==============================
// PANEL MODULE
// ==============================
import { togglePanel, collapseAllPanels } from './panels.js';
if (document.querySelector(".panel")) {
  window.togglePanel = togglePanel;
  collapseAllPanels();
}

// ==============================
// DROPZONE MODULE
// ==============================
import { initDropzone } from './dropzone.js';
if (document.querySelector(".drop-zone")) {
  initDropzone();
}

// ==============================
// QUOTES MODULE
// ==============================
import { initQuotes } from './quotes.js';
if (document.querySelector("#quote")) {
  document.addEventListener("DOMContentLoaded", initQuotes);
}

// ==============================
// SCHEDULE MODULE
// ==============================
import { initScheduleUI } from './schedule.js';
document.addEventListener("DOMContentLoaded", () => {
  if (document.querySelector("#working-date")) {
    initScheduleUI();
  }
});

// ==============================
// ADMIN MODULE
// ==============================
import {
  initAdminLogin,
  initJsonUploadForm,
  initFileUploadDisplay
} from './admin.js';

if (document.querySelector("#admin-login")) {
  initAdminLogin();
}
if (document.querySelector("#json-upload")) {
  initJsonUploadForm();
}
if (document.querySelector("#file-upload-group")) {
  initFileUploadDisplay();
}
