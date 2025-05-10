// ==============================
// ZW_INIT.JS
// Zwdiseg Search Panel Logic
// ==============================

import { doZwdisegSearch } from "./zw_search.js";
import { populateZwdisegStats } from "./zw_stats.js";
import { setupZwdisegDownloadSearch, setupZwdisegDownloadHistory, setupZwdisegDownloadCleaned } from "./zw_download.js";
import { highlightMatch } from '../search-utils.js';
import { withLoadingToggle, createBounceLoader } from '../loading.js';
import { scrollPanel } from '../panels.js';

// ==============================
// GLOBAL CONST
// ==============================
const DEBUG_MODE = localStorage.getItem("DEBUG_MODE") === "true";

// ==============================
// MAIN INITIALIZER
// ==============================
export function initializeZwdisegApp() {
  const searchInput = document.getElementById("zwdiseg-search");
  const uslFilter = document.getElementById("usl-filter");
  const sortBy = document.getElementById("sort-by") || { value: "QTY" };
  const sortDirButton = document.getElementById("sort-direction");
  const resultsList = document.getElementById("zwdiseg-results");
  const noResults = document.getElementById("no-results");
  let sortDirection = "desc";

  // ==============================
  // BOUNCE LOADER SETUP
  // ==============================
  const bounceEl = createBounceLoader(document.querySelector('#zwdiseg-search-panel .panel-body'));

  // ==============================
  // FETCH USL FILTER OPTIONS
  // ==============================
  fetch("/zwdiseg-usls")
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
    withLoadingToggle({
      show: [bounceEl],
      hide: [resultsList, noResults]
    }, () => {
      return doZwdisegSearch({
        searchInput,
        uslFilter,
        sortBy,
        sortDirButton,
        resultsList,
        noResults,
        sortDirection
      });
    });

    // Adjust Search Window
    const header = document.querySelector('#zwdiseg-search-panel .panel-header');
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
    localStorage.setItem("zwdisegScrollTop", window.scrollY);
    const header = document.querySelector('#zwdiseg-search-panel .panel-header');
    scrollPanel(header);
  });

  // ==============================
  // DOWNLOAD BUTTONS SETUP
  // ==============================
  if (document.getElementById("zwdiseg-cleaned-download")) {
    setupZwdisegDownloadCleaned();
  }
  if (document.getElementById("zwdiseg-search-download")) {
    setupZwdisegDownloadSearch();
  }
  if (document.getElementById("zwdiseg-history-download")) {
    setupZwdisegDownloadHistory();
  }
}
