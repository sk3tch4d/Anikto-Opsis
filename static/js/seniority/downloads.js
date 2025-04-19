// ==============================
// DOWNLOADS.JS
// Basic XLSX Export (No Styling)
// ==============================

import * as XLSX from "https://cdn.sheetjs.com/xlsx-latest/package/xlsx.mjs";

// ==============================
// INIT BUTTON
// ==============================
export function setupDownloadButton() {
  const btn = document.getElementById("download-search-button");
  if (btn) {
    btn.addEventListener("click", downloadSearch);
  }
}

// ==============================
// BASIC EXPORT FUNCTION
// ==============================
export function downloadSearch() {
  const results = window.currentSearchResults || [];
  if (!results.length) {
    alert("No search results to download.");
    return;
  }

  const headers = ["Years", "First Name", "Last Name", "Status", "Position"];
  const rows = results.map(row => [
    parseFloat(row["Years"] || 0).toFixed(2),
    row["First Name"] || "",
    row["Last Name"] || "",
    row["Status"] || "",
    row["Position"] || ""
  ]);

  const worksheet = XLSX.utils.aoa_to_sheet([
  ["Years", "First Name", "Last Name", "Status", "Position"],
  ...rows
]);

worksheet["!rows"] = [{ hpt: 24 }]; // Increase header row height

const workbook = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(workbook, worksheet, "Search Results");
XLSX.writeFile(workbook, "Search_Results.xlsx");
}
