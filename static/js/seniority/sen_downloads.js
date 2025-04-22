// ==============================
// DOWNLOADS.JS
// Basic XLSX Export (No Styling)
// ==============================
import * as XLSX from "https://cdn.sheetjs.com/xlsx-latest/package/xlsx.mjs";

// ==============================
// INIT BUTTON
// ==============================
export function setupSeniorityDownloadButton() {
  const btn = document.getElementById("seniority-search-download");
  if (btn) {
    btn.addEventListener("click", downloadSearch);
  }
}

// ==============================
// DOWNLOAD XLSX WITH AUTOFIT
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

  // Create sheet
  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);

  // Autofit column widths based on max content + padding
  worksheet["!cols"] = headers.map((header, i) => {
    const maxLen = Math.max(
      header.length,
      ...rows.map(row => String(row[i] || "").length)
    );
    return { wch: maxLen + 2 }; // Add small padding
  });

  // Increase header row height
  worksheet["!rows"] = [{ hpt: 20 }];

  // Create and download workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Search Results");
  XLSX.writeFile(workbook, "Search_Results.xlsx");
}
