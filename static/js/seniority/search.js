// ==============================
// SEARCH.JS
// Core Search + Filter Utilities
// ==============================
import { renderResults } from './results.js';
import { populateStats, populateGlobalStats } from './stats.js';
import { populatePositionList } from './positions.js';
import { searchFromStat } from '../search-utils.js'; // centralized function


// ==============================
// INIT LOGIC
// ==============================
export function initSenioritySearch() {
  const input = document.getElementById("seniority-search");
  const button = document.getElementById("seniority-search-button");
  if (!input || !button) return;

  // Hide search button by default
  button.style.display = "none";

  // Show on focus
  input.addEventListener("focus", () => {
    button.style.display = "block";
    input.value = "";
  });

  // Hide on blur
  input.addEventListener("blur", () => {
    setTimeout(() => {
      button.style.display = "none";
    }, 100);
  });

  // Live search on input
  input.addEventListener("input", () => {
    doSenioritySearch();
  });

  // Manual fallback (optional)
  button.addEventListener("click", () => {
    doSenioritySearch();
    input.blur();
  });

  // Enter key (optional)
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      doSenioritySearch();
      input.blur();
    }
  });

  // Default behavior
  input.value = "Supply Assistant";
  doSenioritySearch();
  populateGlobalStats();
  populatePositionList();
}


// ==============================
// NORMALIZATION HELPERS
// ==============================
export function normalize(str) {
  return String(str || "")
    .toLowerCase()
    .replace(/[-_]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function isMobile() {
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}


// ==============================
// SEARCH TRIGGER FROM STATS
// ==============================
export function searchFromGlobalStat(query) {
  // Delegate to smart input handler
  searchFromStat("seniority-search", query);
}


// ==============================
// SMART SEARCH - FUZZY MATCHING
// ==============================
function parseSeniorityQuery(query, data) {
  const normalized = query.toLowerCase().trim();

  // ===== Extract Year-Based Filters =====
  const exactMatch = normalized.match(/(?:years\s*=?|^=)\s*(\d+)/);
  const gteMatch = normalized.match(/(?:years\s*>=|>=)\s*(\d+)/);
  const lteMatch = normalized.match(/(?:years\s*<=|<=|under|max)\s*(\d+)/);
  const plusMatch = normalized.match(/(\d+)\s*\+/);
  const betweenMatch = normalized.match(/(?:between)\s*(\d+)\s*(?:and|-)\s*(\d+)/);

  let exactYears = exactMatch ? parseFloat(exactMatch[1]) : null;
  let minYears = gteMatch ? parseFloat(gteMatch[1]) : plusMatch ? parseFloat(plusMatch[1]) : null;
  let maxYears = lteMatch ? parseFloat(lteMatch[1]) : null;

  // Range override (if "between" is used)
  if (betweenMatch) {
    minYears = parseFloat(betweenMatch[1]);
    maxYears = parseFloat(betweenMatch[2]);
    exactYears = null; // Don't combine with exact match
  }

  // ===== Extract Keywords (remove all filters first) =====
  const keywords = normalized
    .replace(/(?:between\s*\d+\s*(?:and|-)\s*\d+)|(?:[<>]=?|=)?\s*\d+\+?|(?:years\s*[<>=:]?\s*\d+)|under|max/gi, "")
    .split(/\s+/)
    .filter(Boolean);

  // ===== Filter Dataset =====
  return data.filter(row => {
    const years = parseFloat(row["Years"] || 0);
    const status = String(row["Status"] || "").toLowerCase();
    const position = String(row["Position"] || "").toLowerCase();

    let match = true;

    if (exactYears !== null) match = match && years === exactYears;
    if (minYears !== null) match = match && years >= minYears;
    if (maxYears !== null) match = match && years <= maxYears;

    for (const keyword of keywords) {
      if (!status.includes(keyword) && !position.includes(keyword)) {
        match = false;
        break;
      }
    }

    return match;
  });
}



// ==============================
// MAIN SEARCH FUNCTION
// ==============================
export function doSenioritySearch() {
  const input = document.getElementById("seniority-search");
  const queryRaw = input.value.trim();
  const data = window.seniorityData || [];

  if (!queryRaw) {
    renderResults([]);
    populateStats([]);
    window.currentSearchResults = [];
    return;
  }

  const matches = parseSeniorityQuery(queryRaw, data);

  renderResults(matches);
  populateStats(matches);
  window.originalSearchResults = matches;
  window.currentSearchResults = matches;
}


// ==============================
// GLOBAL EXPORT FOR INLINE HTML CALLS
// ==============================
window.searchFromGlobalStat = searchFromGlobalStat;
