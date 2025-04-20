// ==============================
// FILTERS.JS
// Search Filter Controls
// ==============================
import { renderResults } from './results.js';
import { populateStats } from './stats.js';


// ==============================
// INIT FILTERS PANEL
// ==============================
export function initSeniorityFilters() {
  const minSlider = document.getElementById("sen-years-min");
  const maxSlider = document.getElementById("sen-years-max");
  const statusSelect = document.getElementById("sen-status-filter");
  const positionSelect = document.getElementById("sen-position-filter");

  if (!minSlider || !maxSlider || !statusSelect || !positionSelect) return;

  [minSlider, maxSlider, statusSelect, positionSelect].forEach(el => {
    el.addEventListener("input", applyFilters);
  });

  applyFilters(); // Initial call
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

  const filtered = data.filter(row => {
    const y = parseFloat(row["Years"] || 0);
    const s = (row["Status"] || "").toLowerCase();
    const p = (row["Position"] || "").toLowerCase();

    const matchesYears = y >= min && y <= max;
    const matchesStatus = status === "any" || s.includes(status);
    const matchesPosition = position === "any" || p.includes(position);

    return matchesYears && matchesStatus && matchesPosition;
  });

  window.currentSearchResults = filtered;
  renderResults(filtered);
  populateStats(filtered);
}
