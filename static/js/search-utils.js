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
// PARSE TO SEARCH MODULE
// ==============================
export function setupParseStats(selector, inputId, attribute = "data-value") {
  document.querySelectorAll(selector).forEach(elem => {
    elem.addEventListener("click", () => {
      const value = elem.getAttribute(attribute);
      if (value) {
        searchFromStat(inputId, value);
      }
    });
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
