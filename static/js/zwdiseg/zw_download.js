// ==============================
// ZW_DOWNLOAD.JS
// Zwdiseg Data Exporter
// ==============================

import * as XLSX from "https://cdn.sheetjs.com/xlsx-0.20.2/package/xlsx.mjs";

// ==============================
// SETUP: DOWNLOAD CLEANED DATA
// ==============================
export function setupZwdisegDownloadCleaned() {
  const downloadButton = document.getElementById("zwdiseg-cleaned-download");
  if (!downloadButton) return;

  downloadButton.addEventListener("click", () => {
    if (!window.zwdisegCleanedData || !window.zwdisegCleanedData.length) {
      return alert("No cleaned data to download.");
    }

    // PRESERVE PY COL ORDER
    const columnOrder = Object.keys(window.zwdisegCleanedData[0]);

    const worksheet = XLSX.utils.json_to_sheet(window.zwdisegCleanedData, {
      header: columnOrder
    });
    
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Cleaned Zwdiseg");

    const today = new Date().toISOString().split("T")[0]; // e.g., 2025-05-10
    XLSX.writeFile(workbook, `cleaned_zwdiseg_${today}.xlsx`);
  });
}


// ==============================
// SETUP: DOWNLOAD FOR SEARCH
// ==============================
export function setupZwdisegDownloadSearch() {
  const downloadButton = document.getElementById("zwdiseg-search-download");
  if (!downloadButton) return;

  downloadButton.addEventListener("click", () => {
    if (!window.zwdisegSearchResults || !window.zwdisegSearchResults.length) {
      return alert("No search results to download.");
    }

    const worksheet = XLSX.utils.json_to_sheet(window.zwdisegSearchResults);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Search Results");

    XLSX.writeFile(workbook, "search_results.xlsx");
  });
}

// ==============================
// SETUP: DOWNLOAD FOR HISTORY
// ==============================
export function setupZwdisegDownloadHistory() {
  const downloadButton = document.getElementById("zwdiseg-history-download");
  if (!downloadButton) return;

  downloadButton.addEventListener("click", () => {
    if (!window.zwdisegSearchHistory || !window.zwdisegSearchHistory.length) {
      return alert("No search history to download.");
    }

    const formattedHistory = window.zwdisegSearchHistory.map(entry => ({
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
