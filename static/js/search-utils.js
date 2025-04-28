// ==============================
// SEARCH-UTILS.JS
// Shared Search Utilities
// ==============================

import { openPanelById, scrollPanel } from "./panels.js";

// ==============================
// SEARCH FROM STAT
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
// PARSE TO SEARCH MODULE (Event Delegation)
// ==============================
export function setupParseStats() {
  let pressTimer = null;
  let pressTarget = null; // new

  document.addEventListener("click", function (e) {
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
          uslFilter.value = "All";
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
  document.addEventListener("mousedown", startLongPress);
  document.addEventListener("touchstart", startLongPress);
  document.addEventListener("mouseup", clearLongPress);
  document.addEventListener("touchend", clearLongPress);
  document.addEventListener("mouseleave", clearLongPress);

  function startLongPress(e) {
    const match = e.target.closest(".clickable-match, .clickable-stat");
    if (!match) return;

    pressTarget = match; // Save starting target
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
    }, 600);
  }

  function clearLongPress(e) {
    if (pressTimer) {
      clearTimeout(pressTimer);
      pressTimer = null;
    }
    pressTarget = null;
  }
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
