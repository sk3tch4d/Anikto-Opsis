// ==============================
// OPT_INIT.JS
// Optimization Search Panel Logic
// ==============================

import { doOptimizationSearch } from "./opt_search.js";
import { populateOptimizationStats } from "./opt_stats.js";
import {
  setupOptimizationDownloadSearch,
  setupOptimizationDownloadSaved,
  setupOptimizationDownloadHistory
} from "./opt_downloads.js";
import { withLoadingToggle, createBounceLoader } from "../loading.js";
import { scrollPanel } from "../panels.js";

// ==============================
// GLOBAL CONST
// ==============================
const DEBUG_MODE = localStorage.getItem("DEBUG_MODE") === "true";

// ==============================
// MAIN INITIALIZER
// ==============================
export function initializeOptimizationApp() {
  const searchInput = document.getElementById("optimization-search");
  const cartFilter = document.getElementById("opsh-filter");
  const sortBy = document.getElementById("sort-by") || { value: "ROP" };
  const sortDirButton = document.getElementById("sort-direction");
  const resultsList = document.getElementById("optimization-results");
  const noResults = document.getElementById("no-results");
  let sortDirection = "desc";

  // ==============================
  // BOUNCE LOADER SETUP
  // ==============================
  const bounceEl = createBounceLoader(document.querySelector('#optimization-search-panel .panel-body'));

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
    withLoadingToggle({
      show: [bounceEl],
      hide: [resultsList, noResults]
    }, () => {
      return doOptimizationSearch({
        searchInput,
        cartFilter,
        sortBy,
        sortDirButton,
        resultsList,
        noResults,
        sortDirection
      });
    });

    scrollPanel(document.querySelector('#optimization-search-panel .panel-header'));
  }

  // ==============================
  // SEARCH EVENTS
  // ==============================
  searchInput.addEventListener("input", () => {
    clearTimeout(window._optSearchDebounce);
    window._optSearchDebounce = setTimeout(doSearch, 200);
  });

  cartFilter.addEventListener("change", doSearch);
  if (sortBy) sortBy.addEventListener("change", doSearch);

  doSearch();

  // ==============================
  // SCROLL POSITION PERSISTENCE
  // ==============================
  window.addEventListener("beforeunload", () => {
    localStorage.setItem("optimizationScrollTop", window.scrollY);
    scrollPanel(document.querySelector('#optimization-search-panel .panel-header'));
  });

  // ==============================
  // DOWNLOAD BUTTONS SETUP
  // ==============================
  if (document.getElementById("optimization-search-download")) {
    setupOptimizationDownloadSearch();
  }
  if (document.getElementById("optimization-saved-download")) {
    setupOptimizationDownloadSaved();
  }
  if (document.getElementById("optimization-history-download")) {
    setupOptimizationDownloadHistory();
  }
}
