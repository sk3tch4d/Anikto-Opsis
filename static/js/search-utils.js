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
// PARSE TO SEARCH MODULE (Event Delegation)
// ==============================
export function setupParseStats() {
  let pressTimer = null;

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
          uslFilter.value = "All"; // fallback
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

  // ==============================
  // LONG PRESS RESET LOGIC
  // ==============================
  const searchInput = document.getElementById("inventory-search");
  const uslFilter = document.getElementById("usl-filter");

  if (searchInput) {
    searchInput.addEventListener("mousedown", startLongPressInput);
    searchInput.addEventListener("touchstart", startLongPressInput);
    searchInput.addEventListener("mouseup", clearLongPress);
    searchInput.addEventListener("touchend", clearLongPress);
    searchInput.addEventListener("mouseleave", clearLongPress);
  }

  if (uslFilter) {
    uslFilter.addEventListener("mousedown", startLongPressFilter);
    uslFilter.addEventListener("touchstart", startLongPressFilter);
    uslFilter.addEventListener("mouseup", clearLongPress);
    uslFilter.addEventListener("touchend", clearLongPress);
    uslFilter.addEventListener("mouseleave", clearLongPress);
  }

  function startLongPressInput(e) {
    pressTimer = setTimeout(() => {
      searchInput.value = "";
      searchInput.dispatchEvent(new Event("input"));
    }, 600);
  }

  function startLongPressFilter(e) {
    pressTimer = setTimeout(() => {
      uslFilter.value = "All";
      uslFilter.dispatchEvent(new Event("change"));
    }, 600);
  }

  function clearLongPress() {
    clearTimeout(pressTimer);
    pressTimer = null;
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
