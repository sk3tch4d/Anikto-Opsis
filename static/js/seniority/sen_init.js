// ==============================
// INIT.JS
// Entry Point to Initialize
// ==============================

// ==============================
// IMPORT 
// ==============================
import { initSenioritySearch } from "./search.js";
import { initComparisonPanel } from "./compare.js";
import { populateStats, populateGlobalStats } from './stats.js';
import { populatePositionList } from "./positions.js";
import { setupSeniorityDownloadCleaned, setupSeniorityDownloadSearch } from "./sen_downloads.js";
import { fixMobileDatalist } from "./datalist.js";
import { initSeniorityFilters } from "./filters.js";

// ==============================
// EXPORT 
// ==============================
export function initializeSeniorityApp() {
  initSenioritySearch();
  initSeniorityFilters();
  initComparisonPanel();
  populateGlobalStats();
  populatePositionList();
  setupSeniorityDownloadCleaned();
  setupSeniorityDownloadSearch();
  fixMobileDatalist();
}
