// ==============================
// OPT_INIT.JS — Optimization Search Panel Logic
// ==============================

import { doOptimizationSearch } from "./opt_search.js";
import { populateOptimizationStats } from "./opt_stats.js";
import {
  setupOptimizationDownloadSearch,
  setupOptimizationDownloadSaved,
  setupOptimizationDownloadHistory,
  setupOptimizationDownloadPrintable,
  setupOptimizationDownloadHeuristic
} from "./opt_downloads.js";
import { highlightMatch } from '../search-utils.js';
import { withLoadingToggle, createBounceLoader } from "../loading.js";
import { scrollPanel } from '../panels/panels_core.js';

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
  // FETCH CART FILTER OPTIONS
  // ==============================
  fetch("/optimization-carts")
    .then(res => res.ok ? res.json() : null)
    .then(carts => {
      if (!Array.isArray(carts)) return;
      carts.sort().forEach(cart => {
        const opt = document.createElement("option");
        opt.value = cart;
        opt.textContent = cart;
        cartFilter.appendChild(opt);
      });
    })
    .catch(err => DEBUG_MODE && console.error("Cart fetch error:", err));

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

    // Adjust Search Window
    const header = document.querySelector('#optimization-search-panel .panel-header');
    scrollPanel(header);
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
    const header = document.querySelector('#optimization-search-panel .panel-header');
    scrollPanel(header);
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
  if (document.getElementById("optimization-printable-download")) {
    setupOptimizationDownloadPrintable();
  }
  if (document.getElementById("optimization-heuristic-download")) {
    setupOptimizationDownloadHeuristic();
  }
}
