// ==============================
// SEARCH-UTILS.JS
// Shared Search Utilities
// ==============================

import { openPanelById, scrollPanel } from "./panels.js";

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
// PARSE TO SEARCH MODULE (Event Delegation, Simple)
// ==============================
export function setupParseStats() {
  document.addEventListener("click", function(e) {
    const matchTarget = e.target.closest(".clickable-match, .clickable-stat");
    const toggleTarget = e.target.closest(".clickable-toggle");

    const searchInput = document.getElementById("inventory-search");
    const uslFilter = document.getElementById("usl-filter");

    // ====== Match clicked (searching) ======
    if (matchTarget) {
      const searchValue = matchTarget.getAttribute("data-search");
      const filterValue = matchTarget.getAttribute("data-filter");

      if (filterValue && uslFilter) {
        uslFilter.value = filterValue;
        uslFilter.dispatchEvent(new Event("change"));
      }

      if (searchValue && searchInput) {
        searchInput.value = searchValue;
        searchInput.dispatchEvent(new Event("input"));
      }

      const searchPanel = document.getElementById("inventory-search-panel");
      if (searchPanel && !searchPanel.classList.contains("open")) {
        openPanelById("inventory-search-panel");
      }

      scrollPanel(); // Only scroll when a match, not on toggle click
    }

    // ====== Toggle clicked (expand/collapse) ======
    if (toggleTarget) {
      const wrapper = toggleTarget.nextElementSibling;
      if (wrapper && wrapper.classList.contains("usl-wrapper")) {
        wrapper.classList.toggle("show");
        toggleTarget.classList.toggle("toggle-open");
      }
    }
  }, { passive: true });
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
