// ==============================
// INV_DOWNLOAD.JS
// Inventory Data Exporter
// ==============================

import { downloadTable } from "../xlsx_downloads.js";

// ==============================
// SETUP: DOWNLOAD FOR SEARCH
// ==============================
export function setupInventoryDownloadSearch() {
  const button = document.getElementById("inventory-search-download");
  if (!button) return;

  button.addEventListener("click", () => {
    downloadTable({
      data: window.inventorySearchResults,
      layout: "inventory_search"
    });
  });
}

// ==============================
// SETUP: DOWNLOAD FOR SAVED
// ==============================
export function setupInventoryDownloadSaved() {
  const button = document.getElementById("inventory-saved-download");
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
      layout: "inventory_saved"
    });
  });
}

// ==============================
// SETUP: DOWNLOAD FOR HISTORY
// ==============================
export function setupInventoryDownloadHistory() {
  const button = document.getElementById("inventory-history-download");
  if (!button) return;

  button.addEventListener("click", () => {
    const formattedHistory = window.inventorySearchHistory.map(entry => ({
      "Timestamp": entry.timestamp,
      "Search Term": entry.search,
      "Filter Used": entry.filter,
      "Matches": entry.matches
    }));

    downloadTable({
      data: formattedHistory,
      layout: "inventory_history"
    });
  });
}
