// ==============================
// FILTERS.JS
// Search Filter Controls
// ==============================

import { renderResults } from './sen_results.js';
import { populateStats } from './sen_stats.js';

// ==============================
// INIT FILTERS PANEL
// ==============================
export function initSeniorityFilters() {
  const minSlider = document.getElementById("sen-years-min");
  const maxSlider = document.getElementById("sen-years-max");
  const statusSelect = document.getElementById("sen-status-filter");
  const positionSelect = document.getElementById("sen-position-filter");
  const searchBox = document.getElementById("seniority-search");

  if (!minSlider || !maxSlider || !statusSelect || !positionSelect || !searchBox) return;

  populatePositionOptions();

  [minSlider, maxSlider, statusSelect, positionSelect, searchBox].forEach(el => {
    el.addEventListener("input", applyFilters);
  });

  applyFilters(); // Initial run
}


// ==============================
// POPULATE POSITION OPTIONS
// ==============================
function populatePositionOptions() {
  const select = document.getElementById("sen-position-filter");
  const data = window.originalSearchResults || [];
  if (!select || !data.length) return;

  const seen = new Set();
  const positions = [];

  data.forEach(row => {
    const raw = row["Position"] || "";
    const clean = raw.split("-")[0].replace(/\b(PT|FT|CAS|CASUAL)\b/gi, "").trim();
    const label = clean.charAt(0).toUpperCase() + clean.slice(1).toLowerCase();

    if (clean && !seen.has(label)) {
      seen.add(label);
      positions.push(label);
    }
  });

  positions.sort((a, b) => a.localeCompare(b));

  select.innerHTML = `<option value="any">Any</option>` +
    positions.map(pos =>
      `<option value="${pos.toLowerCase()}">${pos}</option>`
    ).join("");
}


// ==============================
// APPLY FILTER LOGIC
// ==============================
function applyFilters() {
  const data = window.originalSearchResults || [];
  if (!data.length) return;

  const min = parseFloat(document.getElementById("sen-years-min")?.value) || 0;
  const max = parseFloat(document.getElementById("sen-years-max")?.value) || 50;
  const status = document.getElementById("sen-status-filter")?.value?.toLowerCase() || "any";
  const position = document.getElementById("sen-position-filter")?.value?.toLowerCase() || "any";
  const query = document.getElementById("seniority-search")?.value?.toLowerCase() || "";

  const filtered = data.filter(row =>
    matchesYears(row, min, max) &&
    matchesStatus(row, status) &&
    matchesPosition(row, position) &&
    matchesQuery(row, query)
  );

  window.currentSearchResults = filtered;
  renderResults(filtered);
  populateStats(filtered);
}


// ==============================
// INDIVIDUAL MATCH CHECKS
// ==============================
function matchesYears(row, min, max) {
  const years = parseFloat(row["Years"] || 0);
  return years >= min && years <= max;
}

function matchesStatus(row, filter) {
  if (filter === "any") return true;
  const status = (row["Status"] || "").toLowerCase();
  return status.includes(filter);
}

function matchesPosition(row, filter) {
  if (filter === "any") return true;
  const position = (row["Position"] || "").toLowerCase();
  return position.includes(filter);
}

function matchesQuery(row, query) {
  if (query === "") return true;
  return Object.values(row).some(val =>
    (val || "").toString().toLowerCase().includes(query)
  );
}


// ==============================
// FILTER TOGGLE BUTTON
// ==============================
document.addEventListener("DOMContentLoaded", () => {
  const toggleBtn = document.getElementById("filter-toggle-btn");
  const container = document.getElementById("filter-container");

  if (!toggleBtn || !container) return;

  toggleBtn.addEventListener("click", () => {
    container.classList.toggle("visible");
  });
});
