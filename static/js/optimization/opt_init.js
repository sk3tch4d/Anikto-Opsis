// ==============================
// OPT_INIT.JS — Optimization UI Bootstrap
// ==============================

import { doOptimizationSearch } from "./opt_search.js";
import { populateOptimizationStats } from "./opt_stats.js";
import { setupOptimizationDownloadSearch, setupOptimizationDownloadHistory } from "./opt_downloads.js";
import { highlightMatch } from "../search-utils.js";
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
  const sortBy = document.getElementById("sort-by");
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
        sortBy: sortBy || { value: "site_suggested_rop" },
        sortDirButton,
        resultsList,
        noResults,
        sortDirection
      });
    });

    const header = document.querySelector('#optimization-search-panel .panel-header');
    scrollPanel(header);
  }

  // ==============================
  // SEARCH EVENTS
  // ==============================
  searchInput.addEventListener("input", () => {
    clearTimeout(window._searchDebounce);
    window._searchDebounce = setTimeout(doSearch, 200);
  });

  cartFilter.addEventListener("change", doSearch);
  if (sortBy && typeof sortBy.addEventListener === "function") {
    sortBy.addEventListener("change", doSearch);
  }

  doSearch();

  // ==============================
  // SCROLL POSITION PERSISTENCE
  // ==============================
  window.addEventListener("beforeunload", () => {
    localStorage.setItem("optimizationScrollTop", window.scrollY);
    const header = document.querySelector('#optimization-search-panel .panel-header');
    scrollPanel(header);
  });

  // ==============================
  // DOWNLOAD BUTTONS SETUP
  // ==============================
  if (document.getElementById("optimization-search-download")) {
    setupOptimizationDownloadSearch();
  }
  if (document.getElementById("optimization-history-download")) {
    setupOptimizationDownloadHistory();
  }
}
