// ==============================
// OPT_DOWNLOADS.JS
// Export & Download Logic — Optimization
// ==============================

import { exportDataToExcel } from "../xlsx_downloads.js";
import { getSearchMeta } from "../helpers.js";

// ==============================
// DOWNLOAD SEARCH RESULTS
// ==============================
export function setupOptimizationDownloadSearch() {
  const btn = document.getElementById("optimization-search-download");
  if (!btn) return;

  btn.addEventListener("click", () => {
    const data = window.optimizationSearchResults;
    if (!Array.isArray(data) || !data.length) return;

    const { timestamp, filenameBase } = getSearchMeta("Optimization_Search");
    exportDataToExcel(data, `${filenameBase}_Search_${timestamp}.xlsx`);
  });
}

// ==============================
// DOWNLOAD SAVED RESULTS
// ==============================
export function setupOptimizationDownloadSaved() {
  const btn = document.getElementById("optimization-saved-download");
  if (!btn) return;

  btn.addEventListener("click", () => {
    const data = JSON.parse(localStorage.getItem("optimizationSaved") || "[]");
    if (!Array.isArray(data) || !data.length) return;

    const { timestamp, filenameBase } = getSearchMeta("Optimization_Saved");
    exportDataToExcel(data, `${filenameBase}_Saved_${timestamp}.xlsx`);
  });
}

// ==============================
// DOWNLOAD HISTORY RESULTS
// ==============================
export function setupOptimizationDownloadHistory() {
  const btn = document.getElementById("optimization-history-download");
  if (!btn) return;

  btn.addEventListener("click", () => {
    const data = JSON.parse(localStorage.getItem("optimizationHistory") || "[]");
    if (!Array.isArray(data) || !data.length) return;

    const { timestamp, filenameBase } = getSearchMeta("Optimization_History");
    exportDataToExcel(data, `${filenameBase}_History_${timestamp}.xlsx`);
  });
}
