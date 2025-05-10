// ==============================
// ZW_DOWNLOAD.JS
// Zwdiseg Data Exporter
// ==============================

import * as XLSX from "https://cdn.sheetjs.com/xlsx-0.20.2/package/xlsx.mjs";

// ==============================
// COLUMN DEFINITIONS (GLOBAL)
// ==============================
const CLEANED_COLUMN_ORDER = [
  "Cost_Center", "USL", "Num", "Description", "ROP", "ROQ",
  "Counted", "Consumed", "Difference", "Changed", "MVT",
  "Name", "Date", "Time", "Valid"
];

const SEARCH_COLUMN_ORDER = [
  "Num", "Description", "Group", "ROP", "ROQ", "USL", "Date"
];

const HISTORY_COLUMN_ORDER = [
  "Timestamp", "Search Term", "Filter Used", "Matches"
];


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

    const worksheet = XLSX.utils.json_to_sheet(window.zwdisegCleanedData, {
      header: CLEANED_COLUMN_ORDER
    });

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Cleaned Zwdiseg");

    const today = new Date().toISOString().split("T")[0];
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

    const worksheet = XLSX.utils.json_to_sheet(window.zwdisegSearchResults, {
      header: SEARCH_COLUMN_ORDER
    });
    
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

    const worksheet = XLSX.utils.json_to_sheet(formattedHistory, {
      header: HISTORY_COLUMN_ORDER
    });

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Search History");

    XLSX.writeFile(workbook, "search_history.xlsx");
  });
}
