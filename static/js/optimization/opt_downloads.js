// ==============================
// OPT_DOWNLOADS.JS
// Optimization Data Exporter
// ==============================

import { downloadTable } from "../xlsx_downloads.js";

// ==============================
// SETUP: DOWNLOAD FOR SEARCH
// ==============================
export function setupOptimizationDownloadSearch() {
  const button = document.getElementById("optimization-search-download");
  if (!button) return;

  button.addEventListener("click", () => {
    downloadTable({
      data: window.optimizationSearchResults,
      layout: "optimization_search"
    });
  });
}

// ==============================
// SETUP: DOWNLOAD FOR SAVED
// ==============================
export function setupOptimizationDownloadSaved() {
  const button = document.getElementById("optimization-saved-download");
  if (!button) return;

    button.addEventListener("click", () => {
    const saved = Array.from(window.savedItems?.values() || []);
    if (!saved.length) return alert("No saved items to export.");

    const sheets = saved
      .filter(entry => Array.isArray(entry.data) && entry.data.length > 0)
      .map(entry => ({
        sheetName: `${entry.data[0]?.Num || "Unknown"}`,
        data: entry.data.map(row => ({ ...row, Note: entry.note || "" }))
      }));

    if (!sheets.length) {
      return alert("Saved items found, but no valid data arrays for export.");
    }

    downloadTable({
      data: sheets,
      layout: "optimization_saved"
    });
  });
}

// ==============================
// SETUP: DOWNLOAD FOR HISTORY
// ==============================
export function setupOptimizationDownloadHistory() {
  const button = document.getElementById("optimization-history-download");
  if (!button) return;

  button.addEventListener("click", () => {
    const formattedHistory = window.optimizationSearchHistory.map(entry => ({
      "Timestamp": entry.timestamp,
      "Search Term": entry.search,
      "Filter Used": entry.filter,
      "Matches": entry.matches
    }));

    downloadTable({
      data: formattedHistory,
      layout: "optimization_history"
    });
  });
}

// ==============================
// SETUP: DOWNLOAD FOR PRINTABLE
// ==============================
export function setupOptimizationDownloadPrintable() {
  console.log("🧪 setupOptimizationDownloadPrintable called");

  const button = document.getElementById("optimization-printable-download");
  if (!button) {
    console.warn("❌ Printable download button not found");
    return;
  }

  console.log("✅ Found printable download button");

  button.addEventListener("click", () => {
    console.log("📥 Printable button clicked");

    const link = document.createElement("a");
    link.href = "/download/printable";
    link.download = "";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });
}

// ==============================
// SETUP: DOWNLOAD FOR HEURISTIC
// ==============================
export function setupOptimizationDownloadHeuristic() {
  console.log("🧪 setupOptimizationDownloadHeuristic called");

  const button = document.getElementById("optimization-heuristic-download");
  if (!button) {
    console.warn("❌ Heuristic Download Button - Not found");
    return;
  }

  console.log("✅ Found Heuristic Download Button");

  button.addEventListener("click", () => {
    console.log("📥 Heuristic Button Clicked");

    const link = document.createElement("a");
    link.href = "/download/heuristic";
    link.download = "";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });
}

// ==============================
// SETUP: DOWNLOAD FOR COMPLETE
// ==============================
export function setupOptimizationDownloadCompleted() {
  const button = document.getElementById("optimization-completed-download");
  if (!button) return;

  button.addEventListener("click", () => {
    downloadTable({
      data: window.optimizationCompletedFull,
      layout: "optimization_completde"
    });
  });
}
