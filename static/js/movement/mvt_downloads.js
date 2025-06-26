// ==============================
// MVT_DOWNLOADS.JS
// Movements Data Exporter
// ==============================

import { downloadTable } from "../xlsx_downloads.js";

// ==============================
// SETUP: DOWNLOAD FOR SEARCH
// ==============================
export function setupMovementsDownloadSearch() {
  const button = document.getElementById("mvt-search-download");
  if (!button) return;

  button.addEventListener("click", () => {
    downloadTable({
      data: window.movementSearchResults,
      layout: "movement_search"
    });
  });
}

// ==============================
// SETUP: DOWNLOAD FOR SAVED
// ==============================
export function setupMovementsDownloadSaved() {
  const button = document.getElementById("mvt-saved-download");
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
      layout: "movement_saved"
    });
  });
}

// ==============================
// SETUP: DOWNLOAD FOR HISTORY
// ==============================
export function setupMovementsDownloadHistory() {
  const button = document.getElementById("mvt-history-download");
  if (!button) return;

  button.addEventListener("click", () => {
    const formattedHistory = window.movementSearchHistory.map(entry => ({
      "Timestamp": entry.timestamp,
      "Search Term": entry.search,
      "Filter Used": entry.filter,
      "Matches": entry.matches
    }));

    downloadTable({
      data: formattedHistory,
      layout: "movement_history"
    });
  });
}

// ==============================
// SETUP: DOWNLOAD FOR PRINTABLE
// ==============================
export function setupMovementsDownloadPrint() {
  const button = document.getElementById("mvt-printable-download");
  if (!button) return;

  button.addEventListener("click", () => {
    downloadTable({
      data: window.movementPrintableFull,
      layout: "movement_printable"
    });
  });
}

// ==============================
// SETUP: DOWNLOAD FOR COMPLETE
// ==============================
export function setupMovementsDownloadComplete() {
  const button = document.getElementById("mvt-complete-download");
  if (!button) return;

  button.addEventListener("click", () => {
    downloadTable({
      data: window.movementCompleteFull,
      layout: "movement_complete"
    });
  });
}
