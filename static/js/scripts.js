// ==============================
// SCRIPTS.JS — APP BOOTSTRAP 🛠
// ==============================

// ----- Core -----
import { initDebugToggle } from './debugging.js';
import { initThemeToggle } from './theme.js';
import { initTypewriter } from './typing.js';
import { togglePanel, collapseAllPanels, initPanelScrollBars } from './panels.js';
import { initStickyBars } from './sticky.js';

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

  // ==============================
  // INDEX
  // ==============================
  if (document.body.dataset.page === "index") {

    // ----- Quotes -----
    import('./quotes.js').then(m => m.initQuotes());

    // ----- Dropzone -----
    import('./index/index_dropzone.js').then(m => m.renderDropzoneUI());

    // ----- Drop Utils -----
    import('./index/index_utils.js').then(m => {
      m.refreshDropUI();
      m.initUpTexts();
    });

    // ----- Admin Features -----
    import('./admin.js').then(m => {
      if (document.querySelector("#adpw")) m.initAdminLogin();
      if (document.querySelector("#json-upload")) m.initJsonUploadForm();
      if (document.querySelector("#file-upload-group")) m.initFileUploadDisplay();
      if (document.querySelector("#log-viewer-panel")) m.initLogViewer();
      if (document.querySelector("h1")) m.loadAdminPage();
    });

    // ----- Dev Panel -----
    if (document.querySelector("form")) {
      import('./index/index_dev.js').then(m => m.initDropzoneIfNotDev());
    }
  }

  // ==============================
  // FEATURE MODULES
  // ==============================
  // ----- ARG -----
  if (document.body.dataset.page === "arg") {
    import('./schedule/arg_search_date.js').then(m => m.initScheduleUI());
  }
  // ----- INFO -----
  if (document.body.dataset.page === "info") {
    import('./info.js').then(m => m.loadInfoUpdates());
  }
  // ----- SENIORITY -----
  if (document.querySelector("#seniority-search")) {
    import('./seniority/sen_init.js').then(m => m.initializeSeniorityApp());
  }
  // ----- INVENTORY -----  
  if (document.querySelector("#inventory-search")) {
    import('./inventory/inv_init.js').then(m => m.initializeInventoryApp());
  }
  // ----- ZWDISEG -----
  if (document.querySelector("#zwdiseg-search")) {
    import('./zwdiseg/zw_init.js').then(m => m.initializeZwdisegApp());
  }
  // ----- OPTIMIZATION -----
  if (document.querySelector("#optimization-search")) {
    import('./optimization/opt_init.js').then(m => m.initializeOptimizationApp());
  }

});
