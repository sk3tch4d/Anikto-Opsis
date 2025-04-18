// ==============================
// INIT.JS
// Entry Point to Initialize
// ==============================

import { initSenioritySearch } from "./search.js";
import { initComparisonPanel } from "./compare.js";
import { populateGlobalStats, populateStats } from "./stats.js";
import { populatePositionList } from "./positions.js";
import { setupDownloadButton } from "./downloads.js";
import { fixMobileDatalist } from "./datalist.js";

export function initializeSeniorityApp() {
  initSenioritySearch();
  initComparisonPanel();
  populateGlobalStats();
  populatePositionList();
  setupDownloadButton();
  fixMobileDatalist();
}
