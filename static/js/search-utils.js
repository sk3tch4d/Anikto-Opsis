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
  let longPressTriggered = false;

  document.addEventListener("mousedown", startLongPress);
  document.addEventListener("touchstart", startLongPress);
  document.addEventListener("mouseup", clearLongPress);
  document.addEventListener("touchend", clearLongPress);
  document.addEventListener("mouseleave", clearLongPress);

  document.addEventListener("click", function (e) {
    // If a long press already happened, cancel click
    if (longPressTriggered) {
      longPressTriggered = false;
      return;
    }

    const matchTarget = e.target.closest(".clickable-match, .clickable-stat");
    if (!matchTarget) return;

    const searchInput = document.getElementById("inventory-search");
    const uslFilter = document.getElementById("usl-filter");

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
  }, { passive: true });

  function startLongPress(e) {
    const matchTarget = e.target.closest(".clickable-match, .clickable-stat");
    if (!matchTarget) return;

    pressTimer = setTimeout(() => {
      longPressTriggered = true; // Mark that long press succeeded

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
    }, 600); // 600ms long press
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
