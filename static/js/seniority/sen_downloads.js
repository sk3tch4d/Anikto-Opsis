// ==============================
// DOWNLOADS.JS
// Seniority XLSX Export
// ==============================

import { downloadTable } from "../xlsx_downloads.js";

// ==============================
// DOWNLOAD SENIORTY SEARCH
// ==============================
export function setupSeniorityDownloadSearch() {
  const btn = document.getElementById("seniority-search-download");
  if (!btn) return;

  btn.addEventListener("click", () => {
    const results = window.currentSearchResults || [];
    if (!results.length) {
      return alert("No search results to download.");
    }

    const rows = results.map(row => [
      parseFloat(row["Years"] || 0).toFixed(2),
      row["First Name"] || "",
      row["Last Name"] || "",
      row["Status"] || "",
      row["Position"] || ""
    ]);

    downloadTable({
      data: rows, // AOA format
      layout: "seniority_search"
    });
  });
}
