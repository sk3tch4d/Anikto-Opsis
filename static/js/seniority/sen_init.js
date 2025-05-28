// ==============================
// INIT.JS
// Entry Point to Initialize
// ==============================

// ==============================
// IMPORT 
// ==============================
import { initSenioritySearch } from "./sen_search.js";
import { initComparisonPanel } from "./sen_compare.js";
import { populateStats, populateGlobalStats } from './sen_stats.js';
import { populatePositionList } from "./sen_positions.js";
import { setupSeniorityDownloadCleaned, setupSeniorityDownloadSearch } from "./sen_downloads.js";
import { fixMobileDatalist } from "./sen_datalist.js";
import { initSeniorityFilters } from "./sen_filters.js";

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
