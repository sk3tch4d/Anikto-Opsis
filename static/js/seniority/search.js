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
  if (!input) return;

  const debouncedSearch = debounce(doSenioritySearch, 300);

  // Live search with debounce
  input.addEventListener("input", debouncedSearch);

  // Clear Results on Select
  input.addEventListener("focus", () => {
    input.value = "";
    doSenioritySearch();
  });

  // Optional: Enter key manually triggers search (fallback for older browsers or UX)
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      doSenioritySearch();
      input.blur();
    }
  });

  // Optional: pre-fill and search on load
  input.value = "";
  doSenioritySearch();
  populateGlobalStats();
  populatePositionList();
}

// ==============================
// DEBOUNCE HELPER
// ==============================
function debounce(func, delay = 300) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => func.apply(this, args), delay);
  };
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

  const eqMatch = normalized.match(/(?:^=|years\s*[:=])\s*(\d+)/);
  const gteMatch = normalized.match(/(?:^>=|years\s*>=)\s*(\d+)/);
  const lteMatch = normalized.match(/(?:^<=|years\s*<=|under|max)\s*(\d+)/);
  const plusMatch = normalized.match(/(\d+)\+/);
  const minusMatch = normalized.match(/(\d+)-/);
  const rangeMatch = normalized.match(/(\d+)\s*-\s*(\d+)/);
  const shorthandMatch = normalized.match(/(\d+)(\+|-)/);

  const exactYears = eqMatch ? parseFloat(eqMatch[1]) : null;
  const minYears = rangeMatch
    ? parseFloat(rangeMatch[1])
    : gteMatch
    ? parseFloat(gteMatch[1])
    : plusMatch
    ? parseFloat(plusMatch[1])
    : shorthandMatch?.[2] === '+'
    ? parseFloat(shorthandMatch[1])
    : null;

  const maxYears = rangeMatch
    ? parseFloat(rangeMatch[2])
    : lteMatch
    ? parseFloat(lteMatch[1])
    : minusMatch
    ? parseFloat(minusMatch[1])
    : shorthandMatch?.[2] === '-'
    ? parseFloat(shorthandMatch[1])
    : null;

  const keywordGroups = normalized
    .replace(/\d+\s*-\s*\d+/g, "")
    .replace(/\b(under|max|years\s*[:=<>]*)\s*\d+\b/g, "")
    .replace(/^\s*\d+[\+\-]?\s*$/, "")
    .split(/\s*\bor\b\s*/i)
    .map(group =>
      group
        .trim()
        .split(/\s+/)
        .filter(Boolean)
    )
    .filter(g => g.length);

  return data.filter(row => {
    const years = parseFloat(row["Years"] || 0);
    const text = Object.values(row).join(" ").toLowerCase();
    const fullName = `${row["First Name"]} ${row["Last Name"]}`.toLowerCase();
  
    if (normalized && fullName.includes(normalized)) return true;
  
    let match = true;
  
    if (exactYears !== null) match = match && years === exactYears;
    if (minYears !== null) match = match && years >= minYears;
    if (maxYears !== null) match = match && years <= maxYears;
  
    if (keywordGroups.length) {
      const orMatch = keywordGroups.some(group =>
        group.every(word => text.includes(word))
      );
      if (!orMatch) match = false;
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
    renderResults(data);
    populateStats(data);
    window.originalSearchResults = data;
    window.currentSearchResults = data;
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
window.doSenioritySearch = doSenioritySearch;
window.parseSeniorityQuery = parseSeniorityQuery;
