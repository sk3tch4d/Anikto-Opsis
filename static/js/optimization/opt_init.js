// ==============================
// OPT_INIT.JS — Optimization UI Bootstrap
// ==============================

import { setupSearch } from "./opt_search.js";
import { setupResults } from "./opt_results.js";
import { setupStats } from "./opt_stats.js";
import { setupHistory } from "./opt_history.js";
import { setupDownloads } from "./opt_downloads.js";

// ==============================
// MAIN INIT FUNCTION
// ==============================
function initOptimizationUI() {
  document.addEventListener("DOMContentLoaded", () => {
    setupSearch();
    setupResults();
    setupStats();
    setupHistory();
    setupDownloads();
  });
}

// Init immediately
initOptimizationUI();
