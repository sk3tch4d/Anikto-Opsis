// ==============================
// OPT_DOWNLOADS.JS — Optimization Data Exporter
// ==============================

import { downloadTable } from "../xlsx_downloads.js";

// ==============================
// SETUP: DOWNLOAD FOR SEARCH
// ==============================
export function setupOptimizationDownloadSearch() {
  const button = document.getElementById("optimization-search-download");
  if (!button) return;

  button.addEventListener("click", () => {
    downloadTable({
      data: window.optimizationSearchResults,
      layout: "optimization_search"
    });
  });
}

// ==============================
// SETUP: DOWNLOAD FOR HISTORY
// ==============================
export function setupOptimizationDownloadHistory() {
  const button = document.getElementById("optimization-history-download");
  if (!button) return;

  button.addEventListener("click", () => {
    const formattedHistory = window.optimizationSearchHistory.map(entry => ({
      "Timestamp": entry.timestamp,
      "Search Term": entry.search,
      "Filter Used": entry.filter,
      "Matches": entry.matches
    }));

    downloadTable({
      data: formattedHistory,
      layout: "optimization_history"
    });
  });
}
