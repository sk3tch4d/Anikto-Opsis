// ==============================
// INIT.JS
// Entry Point to Initialize
// ==============================

// ==============================
// IMPORT 
// ==============================
import { initSenioritySearch } from "./search.js";
import { initComparisonPanel } from "./compare.js";
import { populateStats, populateGlobalStats, refineSearchFromStat } from './stats.js';
import { populatePositionList } from "./positions.js";
import { setupDownloadButton } from "./downloads.js";
import { fixMobileDatalist } from "./datalist.js";


// ==============================
// EXPORT 
// ==============================
export function initializeSeniorityApp() {
  initSenioritySearch();
  initComparisonPanel();
  populateGlobalStats();
  populatePositionList();
  setupDownloadButton();
  fixMobileDatalist();
}
