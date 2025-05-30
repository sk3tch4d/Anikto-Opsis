// ==============================
// ZW_DOWNLOAD.JS
// Zwdiseg Data Exporter
// ==============================

import { downloadTable } from "../xlsx_downloads.js";

// ==============================
// SETUP: DOWNLOAD CLEANED DATA
// ==============================
export function setupZwdisegDownloadCleaned() {
  const button = document.getElementById("zwdiseg-cleaned-download");
  if (!button) return;

  button.addEventListener("click", () => {
    downloadTable({
      data: window.zwdisegCleanedData,
      layout: "zwdiseg_clean"
    });
  });
}

// ==============================
// SETUP: DOWNLOAD FOR SEARCH
// ==============================
export function setupZwdisegDownloadSearch() {
  const button = document.getElementById("zwdiseg-search-download");
  if (!button) return;

  button.addEventListener("click", () => {
    downloadTable({
      data: window.zwdisegSearchResults,
      layout: "zwdiseg_search"
    });
  });
}

// ==============================
// SETUP: DOWNLOAD FOR HISTORY
// ==============================
export function setupZwdisegDownloadHistory() {
  const button = document.getElementById("zwdiseg-history-download");
  if (!button) return;

  button.addEventListener("click", () => {
    const formattedHistory = window.zwdisegSearchHistory.map(entry => ({
      "Timestamp": entry.timestamp,
      "Search Term": entry.search,
      "Filter Used": entry.filter,
      "Matches": entry.matches
    }));

    downloadTable({
      data: formattedHistory,
      layout: "zwdiseg_history"
    });
  });
}
