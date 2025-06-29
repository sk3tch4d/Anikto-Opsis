// ==============================
// SCRIPTS.JS — APP BOOTSTRAP 🛠
// ==============================

// ----- Core -----
import { initDebugToggle } from './debugging.js';
import { initThemeToggle } from './theme.js';
import { initTypewriter } from './typing.js';
import { togglePanel, collapseAllPanels } from './panels/panels_core.js';
import { initPanelScrollBars } from './panels/panels_scrollbar.js';
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
  // ----- ADMIN
  if (document.body.dataset.page === "panel") {
    import('./admin.js').then(m => {
      if (document.querySelector("#adpw")) m.initAdminLogin();
      if (document.querySelector("#json-upload")) m.initJsonUploadForm();
      if (document.querySelector("#file-upload-group")) m.initFileUploadDisplay();
      if (document.querySelector("#log-viewer-panel")) m.initLogViewer();
    });
  }
  // ----- ARG -----
  if (document.body.dataset.page === "arg") {
    import('./schedule/arg_search_date.js').then(m => m.initScheduleUI());
    import('./schedule/arg_stats.js').then(m => {
      m.initStatDropdown();
      m.fetchStatsData();
    });
    import('./schedule/arg_lookup.js').then(m => m.initLookupUI());
    import('./schedule/arg_helpers.js').then(m => {
      m.setupDeltaToLookup();
    });
    import('./schedule/arg_info.js').then(m => {
      m.populateDropdownInfo();
    });
  }
  // ----- INFO -----
  if (document.body.dataset.page === "info") {
    import('./info.js').then(m => {
      if (document.querySelector("#info-features-panel")) m.loadInfoFeatures();
      if (document.querySelector("#info-updates-panel")) m.loadInfoUpdates();
      if (document.querySelector("#info-tips-panel")) m.loadInfoTips();
    });
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
