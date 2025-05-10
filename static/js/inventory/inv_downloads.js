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
