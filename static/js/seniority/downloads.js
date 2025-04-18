// ==============================
// DOWNLOADS.JS
// Downloads for Search Results
// ==============================

import * as XLSX from "https://cdn.sheetjs.com/xlsx-latest/package/xlsx.mjs";


// ==============================
// INIT BUTTON DOWNLOAD
// ==============================
export function setupDownloadButton() {
  const btn = document.getElementById("download-search-button");
  if (btn) {
    btn.addEventListener("click", downloadSearch);
  }
}


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
    Math.round(row["Years"] || 0),
    row["First Name"] || "",
    row["Last Name"] || "",
    row["Status"] || "",
    row["Position"] || ""
  ]);
  
  const worksheet = XLSX.utils.aoa_to_sheet([
    headers,
    [], // Blank row for spacing
    ...rows
  ]);
  
  worksheet["!cols"] = headers.map((_, i) => {
    const columnData = rows.map(r => String(r[i] || ""));
    const maxLen = Math.max(headers[i].length, ...columnData.map(c => c.length));
    return { wch: maxLen + 2 }; // +2 for breathing room
  });
  
  worksheet["!rows"] = [{ hpt: 20 }]; // Row height for header

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Search Results");
  XLSX.writeFile(workbook, "Search_Results.xlsx");
}
