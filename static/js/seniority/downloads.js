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
    [],         // Blank row under header
    ...rows
  ]);

  worksheet['!cols'] = [
    { wch: 16 }, // First Name
    { wch: 16 }, // Last Name
    { wch: 14 }, // Status
    { wch: 30 }, // Position
    { wch: 10 }  // Years
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Search Results");
  XLSX.writeFile(workbook, "Search_Results.xlsx");
}

// ==============================
// BUTTON ATTACHMENT
// ==============================
document.getElementById("download-search-button")?.addEventListener("click", downloadSearch);
