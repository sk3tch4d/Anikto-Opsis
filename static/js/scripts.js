// ==============================
// SCRIPTS.JS — APP BOOTSTRAP 🛠
// ==============================

// ----- Debugging -----
import { initDebugToggle } from './debugging.js';
// ----- Dev Mode -----
import { renderDevPanel, initDropzoneIfNotDev } from './drop_dev.js';
// ----- Theme -----
import { initThemeToggle } from './theme.js';
// ----- Typed -----
import { initTypewriter } from './typing.js';
// ----- Panels -----
import { togglePanel, collapseAllPanels, openPanelById, initPanelScrollBars } from './panels.js';
// ----- Sticky Bars -----
import { initStickyBars } from './sticky.js';
// ----- Dropzone -----
import { renderDropzoneUI } from './dropzone.js';
// ----- Drop Utils -----
import { refreshDropUI, initUpTexts } from './drop_utils.js';
// ----- Quotes -----
import { initQuotes } from './quotes.js';
// ----- Schedule -----
import { initScheduleUI } from './schedule/working_date.js';
// ----- Search-Utils -----
import { setupParseStats, searchFromStat } from './search-utils.js';
// ----- Admin -----
import { initAdminLogin, initJsonUploadForm, initFileUploadDisplay, loadAdminPage } from './admin.js';
// ----- Seniority -----
import { initializeSeniorityApp } from './seniority/sen_init.js';
// ----- Inventory -----
import { initializeInventoryApp } from './inventory/inv_init.js';
// ----- Zwdiseg -----
import { initializeZwdisegApp } from './zwdiseg/zw_init.js';
// ----- Optimization -----
import { initializeOptimizationApp } from './optimization/opt_init.js';

// ==============================
// DOM-READY INITIALIZATION
// ==============================
document.addEventListener("DOMContentLoaded", () => {
  // ----- Debug Toggle -----
  if (document.querySelector("#debug-toggle")) initDebugToggle();

  // ----- Theme -----
  initThemeToggle();

  // ----- Typed Text -----
  if (document.querySelector(".typed-text")) initTypewriter();

  // ----- Panels -----
  if (document.querySelector(".panel")) {
    window.togglePanel = togglePanel;
    collapseAllPanels({ excludeSelector: "#login-panel" });
    initPanelScrollBars();
  }

  // ----- Sticky Bars -----
  if (document.querySelector(".sticky-bar")) initStickyBars();

  // ----- Admin Forms -----
  if (document.querySelector("#adpw")) initAdminLogin();
  if (document.querySelector("#json-upload")) initJsonUploadForm();
  if (document.querySelector("#file-upload-group")) initFileUploadDisplay();

  // ----- App Modules -----
  if (document.querySelector("#seniority-search")) initializeSeniorityApp();
  if (document.querySelector("#inventory-search")) initializeInventoryApp();
  if (document.querySelector("#zwdiseg-search")) initializeZwdisegApp();
  if (document.querySelector("#optimization-search")) initializeOptimizationApp();

  // ----- Dev Mode + Dropzone -----
  const form = document.querySelector("form");
  if (form) {
    initDropzoneIfNotDev();
  }

});

// ==============================
// POST-LOAD INITIALIZATION (SAFE FOR LAYOUT)
// ==============================
window.addEventListener("load", () => {
  // ----- Quotes -----
  if (document.querySelector("#quote")) initQuotes();

  // ----- Schedule UI -----
  if (document.querySelector("#working-date")) initScheduleUI();

  // ----- Admin Post Load -----
  if (document.querySelector("h1")) loadAdminPage();
});
