// ==============================
// XLSX_DOWNLOAD.JS
// Dynamic XLSX Exporter
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
  inventory_saved: ["Num", "USL", "Bin", "QTY", "ROP", "ROQ", "Description", "Cost_Center", "Group", "Old", "Cost", "UOM"],  
  inventory_history: [ "Timestamp", "Search Term", "Filter Used", "Matches" ],
  seniority_clean: [ "Years", "First Name", "Last Name", "Status", "Position", "Department", "Note", "Union" ],
  seniority_search: [ "Years", "First Name", "Last Name", "Status", "Position", "Department", "Note", "Union" ],
  optimization_search: ["Num", "Description", "Group", "USL", "ROP", "ROQ", "Candidate", "Confidence", "Score"],
  optimization_history: ["Timestamp", "Search Term", "Filter Used", "Matches"]
};

// ==============================
// MAIN DOWNLOAD FUNCTION
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

  const workbook = XLSX.utils.book_new();

  const isMultiSheet = typeof data[0] === "object" && "sheetName" in data[0] && "data" in data[0];

  function filterData(dataSet) {
    return dataSet.map(row => {
      const filtered = {};
      header.forEach(col => {
        filtered[col] = row[col] ?? "";
      });
      return filtered;
    });
  }

  if (isMultiSheet) {
    data.forEach(({ sheetName, data: rows }) => {
      const filtered = filterData(rows);
      const worksheet = XLSX.utils.json_to_sheet(filtered, { header });
      worksheet["!cols"] = header.map((col, i) => {
        const maxLen = Math.max(col.length, ...filtered.map(row => String(row[col] || "").length));
        return { wch: maxLen + 2 };
      });
      
      worksheet["!rows"] = [{ hpt: 22 }];  // Set Header to 22 points
      XLSX.utils.book_append_sheet(workbook, worksheet, sanitizeSheetName(sheetName));
    });
  } else {
    const isAOA = Array.isArray(data[0]);
    const filtered = isAOA ? data : filterData(data);
    const worksheet = isAOA
      ? XLSX.utils.aoa_to_sheet([header, ...filtered])
      : XLSX.utils.json_to_sheet(filtered, { header });

    worksheet["!cols"] = header.map((col, i) => {
      const maxLen = Math.max(
        col.length,
        ...filtered.map(row => String(isAOA ? row[i] : row[col] || "").length)
      );
      return { wch: maxLen + 2 };
    });

    worksheet["!rows"] = [{ hpt: 22 }];  // Set Header to 22 points
    XLSX.utils.book_append_sheet(workbook, worksheet, toTitle(layout));
  }

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

function sanitizeSheetName(name) {
  return name.replace(/[\\/?*[\]]+/g, "").slice(0, 31); // Excel sheet name rules
}
