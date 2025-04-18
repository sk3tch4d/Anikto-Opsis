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
  const rows = results.map(row => ({
    "Years": Math.round(row["Years"] || 0),
    "First Name": row["First Name"] || "",
    "Last Name": row["Last Name"] || "",
    "Status": row["Status"] || "",
    "Position": row["Position"] || ""
  }));

  // === Autofit column widths ===
  const autoFitColumns = (data, headers) => {
    return headers.map(header => {
      const maxLength = Math.max(
        header.length,
        ...data.map(row => String(row[header] || "").length)
      );
      return { wch: maxLength + 1 };
    });
  };

  const worksheet = XLSX.utils.json_to_sheet(rows, { header: headers });
  worksheet["!cols"] = autoFitColumns(rows, headers);
  worksheet["!rows"] = [{ hpt: 20 }]; // Only apply to header

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Search Results");
  XLSX.writeFile(workbook, "Search_Results.xlsx");
}
