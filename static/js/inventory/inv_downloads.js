// ==============================
// INV_DOWNLOAD.JS
// Inventory Search Results Exporter
// ==============================

import * as XLSX from "https://cdn.sheetjs.com/xlsx-latest/package/xlsx.mjs";

// ==============================
// INIT DOWNLOAD BUTTON
// ==============================
export function setupInventoryDownloadButton() {
  const btn = document.getElementById("download-inventory-button");
  if (btn) {
    btn.addEventListener("click", downloadInventorySearch);
  }
}

// ==============================
// DOWNLOAD INVENTORY SEARCH RESULTS
// ==============================
export function downloadInventorySearch() {
  const results = window.currentSearchResults || [];
  if (!results.length) {
    alert("No inventory results to download.");
    return;
  }

  const headers = ["Num", "Old", "Description", "QTY", "UOM", "USL", "Bin", "Cost", "Cost_Center", "Group"];
  const rows = results.map(row => [
    row["Num"] || "",
    row["Old"] || "",
    row["Description"] || "",
    row["QTY"] || "",
    row["UOM"] || "",
    row["USL"] || "",
    row["Bin"] || "",
    row["Cost"] || "",
    row["Cost_Center"] || "",
    row["Group"] || ""
  ]);

  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);

  worksheet["!cols"] = headers.map((header, i) => {
    const maxLen = Math.max(
      header.length,
      ...rows.map(row => String(row[i] || "").length)
    );
    return { wch: maxLen + 2 };
  });

  worksheet["!rows"] = [{ hpt: 20 }];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Inventory Results");
  XLSX.writeFile(workbook, "Inventory_Results.xlsx");
}
