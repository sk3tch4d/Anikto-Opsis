// ==============================
// EXPORTS.JS
// Search Results XLSX Export
// ==============================

import * as XLSX from "https://cdn.sheetjs.com/xlsx-latest/package/xlsx.mjs";

// ==============================
// INIT EXPORT BUTTON
// ==============================
export function initDownloadButton() {
  const btn = document.getElementById("download-search-button");
  if (btn) {
    btn.addEventListener("click", downloadSearch);
  }
}

// ==============================
// EXPORT SEARCH RESULTS
// ==============================
function downloadSearch() {
  const results = window.currentSearchResults || [];
  if (!results.length) {
    alert("No search results to download.");
    return;
  }

  const headers = ["First Name", "Last Name", "Status", "Position", "Years"];
  const rows = results.map(row => [
    row["First Name"] || "",
    row["Last Name"] || "",
    row["Status"] || "",
    row["Position"] || "",
    row["Years"] || ""
  ]);

  const worksheet = XLSX.utils.aoa_to_sheet([
    headers,
    [],  // spacer row
    ...rows
  ]);

  // Column widths
  worksheet["!cols"] = [
    { wch: 16 }, // First Name
    { wch: 18 }, // Last Name
    { wch: 10 }, // Status
    { wch: 30 }, // Position
    { wch: 8 }  // Years
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Search Results");
  XLSX.writeFile(workbook, "Search_Results.xlsx");
}
