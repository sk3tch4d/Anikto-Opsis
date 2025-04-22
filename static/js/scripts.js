// ==============================
// SCRIPTS.JS — APP BOOTSTRAP
// ==============================

// ----- Debugging -----
import { initDebugToggle } from './debugging.js';
// ----- Header -----
import { initTypewriter } from './header.js';
// ----- Panels -----
import { togglePanel, collapseAllPanels, openPanelById } from './panels.js';
// ----- Dropzone -----
import { initDropzone } from './dropzone.js';
// ----- Quotes -----
import { initQuotes } from './quotes.js';
// ----- Schedule -----
import { initScheduleUI } from './schedule.js';
// ----- Search-Utils -----
import { setupParseStats, searchFromStat } from './search-utils.js';
// ----- Admin -----
import { initAdminLogin, initJsonUploadForm, initFileUploadDisplay } from './admin.js';
// ----- Seniority -----
import { initializeSeniorityApp } from './seniority/init.js';
// ----- Inventory -----
import { initializeInventoryApp } from './inventory.js';

// ==============================
// DOM-READY INITIALIZATION
// ==============================
document.addEventListener("DOMContentLoaded", () => {
  // ----- Debug Toggle -----
  if (document.querySelector("#debug-toggle")) initDebugToggle();
  // ----- Header -----
  if (document.querySelector("#typed-header")) initTypewriter();
  // ----- Panels -----
  if (document.querySelector(".panel")) {
    window.togglePanel = togglePanel;
    collapseAllPanels({ excludeSelector: "#login-panel" });
  }
  // ----- Dropzone -----
  if (document.querySelector(".drop-zone")) initDropzone();
  // ----- Quotes -----
  if (document.querySelector("#quote")) initQuotes();
  // ----- Schedule -----
  if (document.querySelector("#working-date")) initScheduleUI();
  // ----- Admin -----
  if (document.querySelector("#adpw")) initAdminLogin();
  if (document.querySelector("#json-upload")) initJsonUploadForm();
  if (document.querySelector("#file-upload-group")) initFileUploadDisplay();
  // ----- Seniority -----
  if (document.querySelector("#seniority-search")) initializeSeniorityApp();
  // ----- Inventory -----
  if (document.querySelector("#inventory-search")) initializeInventoryApp();
});
