// ==============================
// INIT.JS — Seniority Initialization
// ==============================

import { doSenioritySearch } from './search.js';
import { populateGlobalStats } from './stats-global.js';
import { populatePositionList } from './positions.js';

// ==============================
// INIT LOGIC
// ==============================
export function initSenioritySearch() {
  const input = document.getElementById("seniority-search");
  const button = document.getElementById("seniority-search-button");
  if (!input || !button) return;

  // Hide search button by default
  button.style.display = "none";

  // Show on focus
  input.addEventListener("focus", () => {
    button.style.display = "block";
    input.value = "";
  });

  // Hide on blur
  input.addEventListener("blur", () => {
    setTimeout(() => {
      button.style.display = "none";
    }, 100);
  });

  // Button click
  button.addEventListener("click", () => {
    doSenioritySearch();
    input.blur();
  });

  // Enter key press
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      doSenioritySearch();
      input.blur();
    }
  });

  // Default filter and panel population
  input.value = "Supply Assistant";
  doSenioritySearch();

  // Populate all static panels
  populateGlobalStats();
  populatePositionList();
}
