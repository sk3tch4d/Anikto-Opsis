// ==============================
// PANELS_CONFIG.JS
// ==============================


// ==============================
// DEBUG MODE
// ==============================
export const DEBUG_MODE = localStorage.getItem("DEBUG_MODE") === "true";

// ==============================
// NON CLOSABLE PANELS (ID)
// ==============================
export const nonClosablePanels = [
  "arg-date-search-panel",
// ==============================
  "info-features-panel",
  "info-updates-panel",
  "info-tips-panel",
// ==============================
  "inventory-search-panel",
  "inventory-stats-panel",
  "inventory-saved-panel",
  "inventory-history-panel",
// ==============================
  "optimization-search-panel",
  "optimization-stats-panel",
  "optimization-saved-panel",
  "optimization-history-panel",
// ==============================
  "seniority-search-panel",
// ==============================
  "zwdiseg-search-panel",
  "zwdiseg-history-panel",
  "zwdiseg-saved-panel",
// ==============================
  "downloads"
];

// ==============================
// NON CLOSEABLE ELEMENTS
// ==============================
export const nonClosableElements = [
  "BUTTON",
  "INPUT",
  "SELECT",
  "OPTION",
  "TEXTAREA",
  "LABEL",
  "PRE",
  "A"
];

// ==============================
// NON CLOSEABLE SELECTORS
// ==============================
export const nonClosableSelectors = [
  "[panel-ignore-close]",
  ".downloads",
  ".file-action",
  "#working-date",
  ".custom-date-display"
];

// ==============================
// NON CLOSEABLE CLASSES
// ==============================
export const nonClosableClasses = [
  "panel-delta",
  "compare-delta",
  "compare-card",
  "custom-select-display"
];

// ==============================
// CONDITIONAL IGNORE RULES
// IE: `.panel-delta` unless inside `.clickable-stat`
// ==============================
export const conditionalIgnoreRules = [
  { base: ".panel-delta", unlessWithin: ".clickable-stat" }
];

// ==============================
// NON CLOSE BUTTON PANELS
// ==============================
export const nonButtonPanels = [
  "downloads",
  "inventory-downloads-panel",
  "optimization-downloads-panel",
  "zwdiseg-downloads-panel",
  "seniority-downloads-panel",
  "arg-downloads-panel"
];
