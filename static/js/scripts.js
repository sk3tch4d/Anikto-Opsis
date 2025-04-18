// ==============================
// IMPORTS
// ==============================

// ----- Header -----
import { initTypewriter } from './header.js';
// ----- Panels -----
import { togglePanel, collapseAllPanels } from './panels.js';
// ----- Dropzone -----
import { initDropzone } from './dropzone.js';
// ----- Quotes -----
import { initQuotes } from './quotes.js';
// ----- Schedule -----
import { initScheduleUI } from './schedule.js';
// ----- Admin -----
import {
  initAdminLogin,
  initJsonUploadForm,
  initFileUploadDisplay
} from './admin.js';
// ----- Seniority  -----
import { initializeSeniorityApp } from './seniority/init.js';


// ==============================
// DOM-READY INITIALIZATION
// ==============================
document.addEventListener("DOMContentLoaded", () => {

  // ----- Header -----
  if (document.querySelector("#typed-header")) initTypewriter();

  // ----- Panels -----
  if (document.querySelector(".panel")) {
    window.togglePanel = togglePanel;
    collapseAllPanels();
  }

  // ----- Dropzone -----
  if (document.querySelector(".drop-zone")) initDropzone();

  // ----- Quotes -----
  if (document.querySelector("#quote")) initQuotes();

  // ----- Schedule -----
  if (document.querySelector("#working-date")) initScheduleUI();

  // ----- Admin -----
  if (document.querySelector("#admin-login")) initAdminLogin();
  if (document.querySelector("#json-upload")) initJsonUploadForm();
  if (document.querySelector("#file-upload-group")) initFileUploadDisplay();

  // ----- Seniority -----
  if (document.querySelector("#seniority-search")) initializeSeniorityApp();

});  
