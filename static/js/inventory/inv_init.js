// ==============================
// INV_INIT.JS
// Inventory Search Panel Logic
// ==============================

import { doInventorySearch } from "./inv_search.js";
import { populateInventoryStats } from "./inv_stats.js";
import { setupInventoryDownloadSearch, setupInventoryDownloadHistory } from "./inv_downloads.js";
import { highlightMatch } from '../search-utils.js';
import { withLoadingToggle } from '../loading.js';
import { scrollPanel } from '../panels.js';

// ==============================
// GLOBAL CONST
// ==============================
const DEBUG_MODE = localStorage.getItem("DEBUG_MODE") === "true";

// ==============================
// MAIN INITIALIZER
// ==============================
export function initializeInventoryApp() {
  const searchInput = document.getElementById("inventory-search");
  const uslFilter = document.getElementById("usl-filter");
  const sortBy = document.getElementById("sort-by") || { value: "QTY" };
  const sortDirButton = document.getElementById("sort-direction");
  const resultsList = document.getElementById("inventory-results");
  const noResults = document.getElementById("no-results");
  let sortDirection = "desc";

  // ==============================
  // FETCH USL FILTER OPTIONS
  // ==============================
  fetch("/inventory-usls")
    .then(res => res.ok ? res.json() : null)
    .then(usls => {
      if (!Array.isArray(usls)) return;
      usls.sort().forEach(usl => {
        const opt = document.createElement("option");
        opt.value = usl;
        opt.textContent = usl;
        uslFilter.appendChild(opt);
      });
    })
    .catch(err => DEBUG_MODE && console.error("USL fetch error:", err));

  // ==============================
  // TOGGLE SORT DIRECTION
  // ==============================
  if (sortDirButton) {
    sortDirButton.addEventListener("click", () => {
      sortDirection = sortDirection === "desc" ? "asc" : "desc";
      sortDirButton.textContent = sortDirection === "desc" ? "↓" : "↑";
      doSearch();
    });
  }

  // ==============================
  // MAIN SEARCH FUNCTION
  // ==============================
  function doSearch() {
    doInventorySearch({
      searchInput,
      uslFilter,
      sortBy,
      sortDirButton,
      resultsList,
      noResults,
      sortDirection
    });

    // Adjust Search Window
    const header = document.querySelector('#inventory-search-panel .panel-header');
    scrollPanel(header);
  }

  // ==============================
  // SEARCH EVENTS
  // ==============================
  searchInput.addEventListener("input", () => {
    clearTimeout(window._searchDebounce);
    window._searchDebounce = setTimeout(doSearch, 200);
  });

  uslFilter.addEventListener("change", doSearch);
  if (sortBy) sortBy.addEventListener("change", doSearch);

  doSearch();

  // ==============================
  // SCROLL POSITION PERSISTENCE
  // ==============================
  window.addEventListener("beforeunload", () => {
    localStorage.setItem("inventoryScrollTop", window.scrollY);
    // Adjust Search Window
    const header = document.querySelector('#inventory-search-panel .panel-header');
    scrollPanel(header);
  });

  // ==============================
  // DOWNLOAD BUTTONS SETUP
  // ==============================
  if (document.getElementById("inventory-search-download")) {
    setupInventoryDownloadSearch();
  }
  if (document.getElementById("inventory-history-download")) {
    setupInventoryDownloadHistory();
  }
}
