// ==============================
// OPT_DOWNLOADS.JS
// Optimization Data Exporter
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
// SETUP: DOWNLOAD FOR SAVED
// ==============================
export function setupOptimizationDownloadSaved() {
  const button = document.getElementById("optimization-saved-download");
  if (!button) return;

    button.addEventListener("click", () => {
    const saved = Array.from(window.savedItems?.values() || []);
    if (!saved.length) return alert("No saved items to export.");

    const sheets = saved
      .filter(entry => Array.isArray(entry.data) && entry.data.length > 0)
      .map(entry => ({
        sheetName: `${entry.data[0]?.Num || "Unknown"}`,
        data: entry.data.map(row => ({ ...row, Note: entry.note || "" }))
      }));

    if (!sheets.length) {
      return alert("Saved items found, but no valid data arrays for export.");
    }

    downloadTable({
      data: sheets,
      layout: "optimization_saved"
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

// ==============================
// SETUP: DOWNLOAD FOR PRINTABLE
// ==============================
export function setupOptimizationDownloadPrint() {
  const button = document.getElementById("optimization-printable-download");
  if (!button) return;

  button.addEventListener("click", () => {
    downloadTable({
      data: window.optimizationPrintableFull,
      layout: "optimization_printable"
    });
  });
}

// ==============================
// SETUP: DOWNLOAD FOR COMPLETE
// ==============================
export function setupOptimizationDownloadComplete() {
  const button = document.getElementById("optimization-complete-download");
  if (!button) return;

  button.addEventListener("click", () => {
    downloadTable({
      data: window.optimizationCompleteFull,
      layout: "optimization_complete"
    });
  });
}
