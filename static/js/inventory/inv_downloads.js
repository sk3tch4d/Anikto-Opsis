// ==============================
// INV_DOWNLOAD.JS
// Inventory Search Results Exporter
// ==============================

import * as XLSX from "https://cdn.sheetjs.com/xlsx-0.20.2/package/xlsx.mjs"; // or wherever you're importing SheetJS from

// ==============================
// Setup Download for Search Results
// ==============================
export function setupInventoryDownloadSearch() {
  const downloadButton = document.getElementById("inventory-search-download");
  if (!downloadButton) return;

  downloadButton.addEventListener("click", () => {
    if (!window.inventorySearchResults || !window.inventorySearchResults.length) {
      return alert("No search results to download.");
    }

    const worksheet = XLSX.utils.json_to_sheet(window.inventorySearchResults);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Search Results");

    XLSX.writeFile(workbook, "search_results.xlsx");
  });
}

// ==============================
// Setup Download for Search History
// ==============================
export function setupInventoryDownloadHistory() {
  const downloadButton = document.getElementById("inventory-history-download");
  if (!downloadButton) return;

  downloadButton.addEventListener("click", () => {
    if (!window.inventorySearchHistory || !window.inventorySearchHistory.length) {
      return alert("No search history to download.");
    }

    // Format history cleanly
    const formattedHistory = window.inventorySearchHistory.map(entry => ({
      "Timestamp": entry.timestamp,
      "Search Term": entry.search,
      "Filter Used": entry.filter,
      "Matches": entry.matches
    }));

    const worksheet = XLSX.utils.json_to_sheet(formattedHistory);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Search History");

    XLSX.writeFile(workbook, "search_history.xlsx");
  });
}
