// ==============================
// DOWNLOADS.JS
// Downloads for Search Results
// ==============================

import * as XLSX from "https://cdn.sheetjs.com/xlsx-latest/package/xlsx.mjs";

// ==============================
// DOWNLOADS XLSX
// ==============================
export function downloadSearch() {
  const results = window.currentSearchResults || [];
  if (!results.length) {
    alert("No search results to download.");
    return;
  }

  const headers = ["Years", "First Name", "Last Name", "Status", "Position"];
  const rows = results.map(row => [
    row["Years"] || "",
    row["First Name"] || "",
    row["Last Name"] || "",
    row["Status"] || "",
    row["Position"] || ""
  ]);

  const worksheet = XLSX.utils.aoa_to_sheet([
    headers,
    [],         // Blank row under header
    ...rows
  ]);

  worksheet['!cols'] = [
    { wch: 9 },  // Years
    { wch: 12 }, // First Name
    { wch: 14 }, // Last Name
    { wch: 10 }, // Status
    { wch: 32 }  // Position
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Search Results");
  XLSX.writeFile(workbook, "Search_Results.xlsx");
}

// ==============================
// BUTTON ATTACHMENT
// ==============================
document.getElementById("download-search-button")?.addEventListener("click", downloadSearch);
