// ==============================
// OPT_SEARCH.JS
// Optimization Search Logic
// ==============================

import { populateOptimizationStats } from "./opt_stats.js";
import { renderOptimizationResults } from "./opt_results.js";
import { addOptimizationSearchToHistory } from "./opt_history.js";
import { withLoadingToggle, createBounceLoader } from "../loading.js";
import { scrollPanel } from "../panels.js";

// ==============================
// DEBUGGING
// ==============================
const DEBUG_MODE = localStorage.getItem("DEBUG_MODE") === "true";

// ==============================
// CONFIG
// ==============================
const SCROLL_RESTORE_DELAY = 50;
const FETCH_TIMEOUT = 5000;
const FETCH_RETRIES = 2;
const FETCH_RETRY_DELAY = 500;
const DEBOUNCE_DELAY = 300;
const MAX_CACHE_SIZE = 20;

// ==============================
// URL BUILDER
// ==============================
function buildSearchUrl({ term, cart, sort, dir }) {
  const params = new URLSearchParams({
    term: term.trim().toLowerCase(),
    cart,
    sort,
    dir
  });
  return `/optimization-search?${params}`;
}

// ==============================
// ELEMENTS
// ==============================
const elements = {
  stats: document.getElementById("optimization-stats")
};

// ==============================
// BOUNCE LOADER
// ==============================
const bounceLoader = createBounceLoader(document.querySelector("#optimization-search-panel .panel-body"));

// ==============================
// FETCH ABORT CONTROLLER
// ==============================
let currentFetchController = null;

// ==============================
// SCROLL RESTORE
// ==============================
function restoreScrollPosition(key = "optimizationScrollTop", delay = SCROLL_RESTORE_DELAY) {
  const savedScroll = localStorage.getItem(key);
  if (savedScroll) {
    setTimeout(() => {
      window.scroll({
        top: parseInt(savedScroll),
        behavior: "smooth"
      });
      DEBUG_MODE && console.log(`[DEBUG] Restored scroll position: ${savedScroll}px`);
    }, delay);
  }
}

// ==============================
// FETCH HELPERS
// ==============================
function fetchWithTimeout(resource, options = {}, timeout = FETCH_TIMEOUT, controller = null) {
  const ctrl = controller || new AbortController();
  const id = setTimeout(() => ctrl.abort(), timeout);
  return fetch(resource, {
    ...options,
    signal: ctrl.signal
  }).finally(() => clearTimeout(id));
}

async function fetchWithRetry(url, options = {}, retries = FETCH_RETRIES, delay = FETCH_RETRY_DELAY, controller = null) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fetchWithTimeout(url, options, FETCH_TIMEOUT, controller);
    } catch (err) {
      if (attempt === retries) throw err;
      DEBUG_MODE && console.warn(`[DEBUG] Retry ${attempt + 1} failed. Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

// ==============================
// CACHE
// ==============================
const searchCache = new Map();

function generateSearchKey({ term, cart, sort, dir }) {
  return `${term}|${cart}|${sort}|${dir}`;
}

function updateSearchCache(key, data) {
  if (searchCache.size >= MAX_CACHE_SIZE) {
    const oldestKey = searchCache.keys().next().value;
    searchCache.delete(oldestKey);
  }
  searchCache.set(key, data);
}

// ==============================
// DEBOUNCE
// ==============================
function debounce(fn, wait) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn.apply(this, args), wait);
  };
}

// ==============================
// MAIN SEARCH FUNCTION
// ==============================
export const doOptimizationSearch = debounce(function ({
  searchInput,
  cartFilter,
  sortBy,
  sortDirButton,
  resultsList,
  noResults,
  sortDirection
}) {
  const term = searchInput.value.trim().toLowerCase();
  const cartRaw = cartFilter.value;
  const cart = cartRaw === "All" ? "All" : cartRaw.replace("Cart ", "");
  const sort = sortBy?.value || "rop";

  if (!term) {
    resultsList.innerHTML = "";
    elements.stats.innerHTML = "";
    noResults.style.display = "block";
    noResults.innerText = "Please enter a search term.";
    return;
  }

  const key = generateSearchKey({ term, cart, sort, dir: sortDirection });

  withLoadingToggle(
    {
      show: [bounceLoader],
      hide: [resultsList, noResults, elements.stats]
    },
    () => {
      noResults.style.display = "none";

      if (currentFetchController) currentFetchController.abort();
      currentFetchController = new AbortController();

      if (searchCache.has(key)) {
        const cached = searchCache.get(key);
        renderOptimizationResults(cached, term, resultsList);
        populateOptimizationStats(cached);
        addOptimizationSearchToHistory(searchInput.value.trim(), cart, cached);
        return;
      }

      return fetchWithRetry(buildSearchUrl({ term, cart, sort, dir: sortDirection }), {}, FETCH_RETRIES, FETCH_RETRY_DELAY, currentFetchController)
        .then(res => res.json())
        .then(data => {
          if (!data || !data.length) {
            resultsList.innerHTML = "";
            elements.stats.innerHTML = "";
            noResults.style.display = "block";
            noResults.innerText = "No results found. Try a different search.";
            return;
          }

          populateOptimizationStats(data);
          renderOptimizationResults(data, term, resultsList);
          window.optimizationSearchResults = data;
          addOptimizationSearchToHistory(searchInput.value.trim(), cart, data);
          updateSearchCache(key, data);
        })
        .catch(err => {
          if (err.name === "AbortError") {
            DEBUG_MODE && console.warn("[DEBUG] Fetch aborted.");
            return;
          }
          resultsList.innerHTML = "";
          elements.stats.innerHTML = "";
          noResults.style.display = "block";
          noResults.innerText = "Error loading results. Please try again.";
          DEBUG_MODE && console.error("[DEBUG] Fetch Error:", err);
        })
        .finally(() => {
          restoreScrollPosition();
        });
    }
  );

  scrollPanel(document.querySelector("#optimization-search-panel .panel-header"));
}, DEBOUNCE_DELAY);

// ==============================
// SEARCH HANDLER INIT
// ==============================
window.addEventListener("DOMContentLoaded", () => {
  const input = document.getElementById("optimization-search");
  const resultsList = document.getElementById("optimization-results");
  const sort = document.getElementById("sort-by");
  const dirBtn = document.getElementById("sort-direction");
  const noResults = document.getElementById("no-results");
  const cartFilter = document.getElementById("opsh-filter");

  input.addEventListener("input", () => {
    doOptimizationSearch({
      searchInput: input,
      cartFilter,
      sortBy: sort,
      sortDirButton: dirBtn,
      resultsList,
      noResults,
      sortDirection: dirBtn?.textContent.includes("↑") ? "asc" : "desc"
    });
  });
});
