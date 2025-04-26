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
    const targetStat = e.target.closest(".clickable-stat");
    const targetMatch = e.target.closest(".clickable-match");

    const searchInput = document.getElementById("inventory-search");
    const uslFilter = document.getElementById("usl-filter");

    if (targetStat && uslFilter) {
      const uslValue = targetStat.getAttribute("data-value");
      if (uslValue) {
        uslFilter.value = uslValue;
        uslFilter.dispatchEvent(new Event("change"));
      }
    }

    if (targetMatch && searchInput) {
      const matchValue = targetMatch.getAttribute("data-value");
      if (matchValue) {
        searchInput.value = matchValue;
        searchInput.dispatchEvent(new Event("input"));
      }
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
