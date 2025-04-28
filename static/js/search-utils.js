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
  let pressTimer = null; // ====== For Long Press Detection

  document.addEventListener("click", function(e) {
    const matchTarget = e.target.closest(".clickable-match, .clickable-stat");

    const searchInput = document.getElementById("inventory-search");
    const uslFilter = document.getElementById("usl-filter");

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
  }, { passive: true });

  // ====== Long Press Logic ======
  document.addEventListener("mousedown", (e) => {
    if (e.target.closest(".clickable-match, .clickable-stat")) {
      pressTimer = setTimeout(() => {
        const searchInput = document.getElementById("inventory-search");
        const uslFilter = document.getElementById("usl-filter");

        if (searchInput) {
          searchInput.value = "";
          searchInput.dispatchEvent(new Event("input"));
        }

        if (uslFilter) {
          uslFilter.value = "All";
          uslFilter.dispatchEvent(new Event("change"));
        }
      }, 600); // 600ms = long press
    }
  });

  document.addEventListener("mouseup", () => clearTimeout(pressTimer));
  document.addEventListener("mouseleave", () => clearTimeout(pressTimer));
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
