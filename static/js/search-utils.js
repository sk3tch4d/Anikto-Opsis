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
// HELPER: climb up and find parent by selector
// ==============================
function findClosestBySelector(element, selector) {
  while (element) {
    if (element.matches(selector)) return element;
    element = element.parentElement;
  }
  return null;
}

// ==============================
// PARSE TO SEARCH MODULE (Event Delegation)
// ==============================
export function setupParseStats() {
  document.addEventListener("click", function(e) {
    const matchTarget = e.target.closest(".clickable-match, .clickable-stat");
    const toggleTarget = e.target.matches(".clickable-toggle") ? e.target : null;

    const searchInput = document.getElementById("inventory-search");
    const uslFilter = document.getElementById("usl-filter");

    // ====== Match clicked (searching) ======
    if (matchTarget) {
      const searchValue = matchTarget.getAttribute("data-search");
      const filterValue = matchTarget.getAttribute("data-filter");
    
      if (uslFilter) {
        if (filterValue && Array.from(uslFilter.options).some(opt => opt.value === filterValue)) {
          uslFilter.value = filterValue;
        } else {
          uslFilter.value = "All"; // fallback safely
        }
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
    
      scrollPanel();
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
