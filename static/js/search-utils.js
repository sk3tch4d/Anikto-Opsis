// ==============================
// SHARED SEARCH UTILITIES
// ==============================

import { openPanelById } from "./panels.js";

// ==============================
// TRIGGER SEARCH FROM STAT
// ==============================
export function searchFromStat(inputId, value) {
  const input = document.getElementById(inputId);
  if (input) {
    input.value = value;
    input.dispatchEvent(new Event("input"));

    const panelId = `${inputId}-panel`;
    openPanelById(panelId);
  }
}

// ==============================
// PARSE TO SEARCH MODULE (Upgraded with Event Delegation)
// ==============================
export function setupParseStats() {
  document.addEventListener("click", function(e) {
    const target = e.target.closest(".clickable-match, .clickable-stat");

    if (!target) return;

    const searchInput = document.getElementById("inventory-search");
    const uslFilter = document.getElementById("usl-filter");

    const searchValue = target.getAttribute("data-search");
    const filterValue = target.getAttribute("data-filter");

    if (filterValue && uslFilter) {
      uslFilter.value = filterValue;
      uslFilter.dispatchEvent(new Event("change"));
    }

    if (searchValue && searchInput) {
      searchInput.value = searchValue;
      searchInput.dispatchEvent(new Event("input"));
    }
  });
}

// ==============================
// MATCH HIGHLIGHTING
// ==============================
export function highlightMatch(text, term) {
  if (!term) return text;
  const safeTerm = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${safeTerm})`, "ig");
  return text.replace(regex, `<span class="highlight">$1</span>`);
}
