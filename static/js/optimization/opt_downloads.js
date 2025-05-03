// ==============================
// OPT_DOWNLOADS.JS — Optimization Data Exporter
// ==============================

import * as XLSX from "https://cdn.sheetjs.com/xlsx-0.20.2/package/xlsx.mjs";

// ==============================
// SETUP: DOWNLOAD FOR SEARCH
// ==============================
export function setupOptimizationDownloadSearch() {
  const downloadButton = document.getElementById("optimization-search-download");
  if (!downloadButton) return;

  downloadButton.addEventListener("click", () => {
    if (!window.optimizationSearchResults || !window.optimizationSearchResults.length) {
      return alert("No search results to download.");
    }

    const worksheet = XLSX.utils.json_to_sheet(window.optimizationSearchResults);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Optimization Search");

    XLSX.writeFile(workbook, "optimization_search.xlsx");
  });
}

// ==============================
// SETUP: DOWNLOAD FOR HISTORY
// ==============================
export function setupOptimizationDownloadHistory() {
  const downloadButton = document.getElementById("optimization-history-download");
  if (!downloadButton) return;

  downloadButton.addEventListener("click", () => {
    if (!window.optimizationSearchHistory || !window.optimizationSearchHistory.length) {
      return alert("No search history to download.");
    }

    const formattedHistory = window.optimizationSearchHistory.map(entry => ({
      "Timestamp": entry.timestamp,
      "Search Term": entry.search,
      "Filter Used": entry.filter,
      "Matches": entry.matches
    }));

    const worksheet = XLSX.utils.json_to_sheet(formattedHistory);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Search History");

    XLSX.writeFile(workbook, "optimization_history.xlsx");
  });
}
