// ==============================
// INV_SEARCH.JS
// ==============================

import { populateInventoryStats } from "./inv_stats.js";
import { renderInventoryResults } from "./inv_results.js";
import { debounce } from "../search-utils.js";
import { withLoadingToggle, createBounceLoader } from "../loading.js";
import { addSearchHistoryCard } from "../cards/history_card.js";

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
function buildSearchUrl({ term, usl, sort, dir }) {
  const params = new URLSearchParams({
    term: term.trim().toLowerCase(),
    usl,
    sort,
    dir
  });
  return `/inventory-search?${params}`;
}

// ==============================
// ELEMENTS
// ==============================
const elements = {
  stats: document.getElementById("inventory-stats")
};

// ==============================
// BOUNCE LOADER
// ==============================
const bounceLoader = createBounceLoader(document.querySelector("#inventory-search-panel .panel-body"));

// ==============================
// FETCH ABORT CONTROLLER
// ==============================
let currentFetchController = null;

// ==============================
// SCROLL RESTORE
// ==============================
function restoreScrollPosition(key = "inventoryScrollTop", delay = SCROLL_RESTORE_DELAY) {
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

function generateSearchKey({ term, usl, sort, dir }) {
  return `${term}|${usl}|${sort}|${dir}`;
}

function updateSearchCache(key, data) {
  if (searchCache.size >= MAX_CACHE_SIZE) {
    const oldestKey = searchCache.keys().next().value;
    searchCache.delete(oldestKey);
  }
  searchCache.set(key, data);
}

// ==============================
// SEARCH LOGIC
// ==============================
export const doInventorySearch = debounce(function({ searchInput, uslFilter, sortBy, sortDirButton, resultsList, noResults, sortDirection }) {
  const term = searchInput.value.trim().toLowerCase();
  const usl = uslFilter.value;
  const sort = sortBy.value;

  // Validate search term
  if (!term) {
    resultsList.innerHTML = "";
    elements.stats.innerHTML = "";
    noResults.style.display = "block";
    noResults.innerText = "Please enter a search term.";
    return;
  }

  console.log(`🔎 Inventory Search: ${searchInput} - (${uslFilter})`);

  const key = generateSearchKey({ term, usl, sort, dir: sortDirection });

  withLoadingToggle(
    {
      show: [bounceLoader],
      hide: [resultsList, noResults, elements.stats]
    },
    () => {
      noResults.style.display = "none";

      // Cancel any previous fetch
      if (currentFetchController) {
        currentFetchController.abort();
      }
      currentFetchController = new AbortController();

      // Use cache if available
      if (searchCache.has(key)) {
        const cached = searchCache.get(key);
        renderInventoryResults(cached, term, resultsList);
        populateInventoryStats(cached);
        addSearchHistoryCard({
          term: searchInput.value.trim(),
          filter: uslFilter.value,
          results: cached,
          historyKey: "inventorySearchHistory"
        });
        return;
      }

      return fetchWithRetry(buildSearchUrl({ term, usl, sort, dir: sortDirection }), {}, FETCH_RETRIES, FETCH_RETRY_DELAY, currentFetchController)
        .then(res => res.json())
        .then(data => {
          if (!data || !data.length) {
            resultsList.innerHTML = "";
            elements.stats.innerHTML = "";
            noResults.style.display = "block";
            noResults.innerText = "No results found. Try a different search.";
            return;
          }

          populateInventoryStats(data);
          renderInventoryResults(data, term, resultsList);
          window.inventorySearchResults = data;
          addSearchHistoryCard({
            term: searchInput.value.trim(),
            filter: uslFilter.value,
            results: data,
            historyKey: "inventorySearchHistory"
          });
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

}, DEBOUNCE_DELAY);
