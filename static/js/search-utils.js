// ==============================
// SHARED SEARCH UTILITIES
// ==============================

import { openPanelById } from "./panels.js";

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
