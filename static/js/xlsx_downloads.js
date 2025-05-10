// ==============================
// XLSX_DOWNLOAD.JS
// Dynamic Opt Excel Exporter
// ==============================

import * as XLSX from "https://cdn.sheetjs.com/xlsx-0.20.2/package/xlsx.mjs";

// ==============================
// COLUMN LAYOUT DEFINITIONS
// ==============================
const COLUMN_LAYOUTS = {
  zwdiseg_clean: [ "Cost_Center", "USL", "Num", "Description", "ROP", "ROQ", "Counted", "Consumed", "Difference", "Changed", "MVT", "Name", "Date", "Time", "Valid" ],
  zwdiseg_search: [ "Num", "Description", "Group", "ROP", "ROQ", "USL", "Date" ],
  zwdiseg_history: [ "Timestamp", "Search Term", "Filter Used", "Matches" ],
  inventory_search: [ "Num", "Description", "USL", "ROP", "ROQ", "Group", "Date" ],
  inventory_saved: ["Num", "Description", "Group", "USL", "ROP", "ROQ", "Cost_Center", "Date"],
  inventory_history: [ "Timestamp", "Search Term", "Filter Used", "Matches" ],
  seniority_search: [ "Years", "First Name", "Last Name", "Status", "Position" ],
  optimization_search: ["Num", "Description", "Group", "USL", "ROP", "ROQ", "Candidate", "Confidence", "Score"],
  optimization_history: ["Timestamp", "Search Term", "Filter Used", "Matches"]
};

// ==============================
// MAIN DOWNLOAD TABLE FUNCTION
// ==============================
export function downloadTable({ data, layout, filename = null }) {
  if (!data?.length) {
    return alert("No data to download.");
  }

  const header = COLUMN_LAYOUTS[layout];
  if (!header) {
    console.error(`❌ Unknown layout: ${layout}`);
    return alert(`Export failed: unknown layout "${layout}"`);
  }

  const isAOA = Array.isArray(data[0]);
  const worksheet = isAOA
    ? XLSX.utils.aoa_to_sheet([header, ...data])
    : XLSX.utils.json_to_sheet(data, { header });

  // ✅ Always autofit
  worksheet["!cols"] = header.map((col, i) => {
    const maxLen = Math.max(
      col.length,
      ...data.map(row =>
        String(isAOA ? row[i] : row[col] || "").length
      )
    );
    return { wch: maxLen + 2 };
  });

  const workbook = XLSX.utils.book_new();
  const sheetName = toTitle(layout);
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  const finalFilename = filename || `${layout}_${getDate()}.xlsx`;
  XLSX.writeFile(workbook, finalFilename);
}

// ==============================
// UTILITIES
// ==============================
function getDate() {
  return new Date().toISOString().split("T")[0];
}

function toTitle(str) {
  return str.replace(/_/g, " ").replace(/\b\w/g, char => char.toUpperCase());
}
