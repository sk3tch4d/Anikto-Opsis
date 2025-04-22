// ==============================
// INV_DOWNLOAD.JS
// Inventory Search Results Exporter
// ==============================

import * as XLSX from "https://cdn.sheetjs.com/xlsx-latest/package/xlsx.mjs";

// ==============================
// INIT DOWNLOAD BUTTON
// ==============================
export function setupInventoryDownloadSearch() {
  const btn = document.getElementById("inventory-search-download");
  if (btn) {
    btn.addEventListener("click", downloadInventorySearch);
  }
}

// ==============================
// DOWNLOAD INVENTORY SEARCH RESULTS
// ==============================
export function downloadInventorySearch() {
  const results = window.inventorySearchResults || [];
  if (!results.length) {
    alert("No inventory results to download.");
    return;
  }

  const headers = ["Number", "USL", "Bin", "Quantity", "Description", "Cost Center", "Cost", "UOM", "Old", "Group"];
  const rows = results.map(row => [
    row["Num"] || "",
    row["USL"] || "",
    row["Bin"] || "",
    row["QTY"] || "",
    row["Description"] || "",
    row["Cost_Center"] || "",
    row["Cost"] || "",
    row["UOM"] || "",
    row["Old"] || "",
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
