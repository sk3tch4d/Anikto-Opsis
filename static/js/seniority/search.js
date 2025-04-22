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

  // Match specific filters
  const eqMatch = normalized.match(/(?:years\s*=?|^=)\s*(\d+)/);
  const gteMatch = normalized.match(/(?:years\s*>=|>=|\b)(\d+)\+?/);
  const lteMatch = normalized.match(/(?:years\s*<=|<=|-|under|max)\s*(\d+)/);
  
  // Parse values
  const exactYears = eqMatch ? parseFloat(eqMatch[1]) : null;
  const minYears = gteMatch ? parseFloat(gteMatch[1]) : null;
  const maxYears = lteMatch ? parseFloat(lteMatch[1]) : null;

  // Extract individual keywords
  const keywords = normalized
    .replace(/(?:>=|<=|=|\+|under|max|years\s*[:=]?\s*\d+|\d+\+?)/g, "")
    .split(/\s+/)
    .filter(Boolean); // Remove empty strings

  return data.filter(row => {
    const years = parseFloat(row["Years"] || 0);
    const status = String(row["Status"] || "").toLowerCase();
    const position = String(row["Position"] || "").toLowerCase();

    let match = true;

    // Years filtering
    if (exactYears !== null) match = match && years === exactYears;
    if (minYears !== null) match = match && years >= minYears;
    if (maxYears !== null) match = match && years <= maxYears;

    // Text keyword filtering
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
