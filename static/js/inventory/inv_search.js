// ==============================
// INV_SEARCH.JS — Inventory Search Logic
// ==============================

import { populateInventoryStats } from "./inv_stats.js";
import { renderInventoryResults } from "./inv_results.js";
import { withLoadingToggle } from "../loading.js";

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
  const formattedTerm = term
    .trim()
    .toLowerCase()
    .replace(/[+|\s]+/g, ",") // convert + or space to comma
    .replace(/,+/g, ",");      // collapse multiple commas

  const params = new URLSearchParams({ term: formattedTerm, usl, sort, dir });
  const finalUrl = `/inventory-search?${params}`;
  DEBUG_MODE && console.log(`[DEBUG] Built search URL: ${finalUrl}`);
  return finalUrl;
}

// ==============================
// ELEMENTS
// ==============================
const elements = {
  loading: document.getElementById("loading"),
  stats: document.getElementById("inventory-stats")
};

// ==============================
// SCROLL RESTORE
// ==============================
function restoreScrollPosition(key = "inventoryScrollTop", delay = SCROLL_RESTORE_DELAY) {
  const savedScroll = localStorage.getItem(key);
  if (savedScroll) {
    setTimeout(() => {
      window.scrollTo(0, parseInt(savedScroll));
      DEBUG_MODE && console.log(`[DEBUG] Restored scroll position: ${savedScroll}px`);
    }, delay);
  }
}

// ==============================
// FETCH HELPERS
// ==============================
function fetchWithTimeout(resource, options = {}, timeout = FETCH_TIMEOUT) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  return fetch(resource, {
    ...options,
    signal: controller.signal
  }).finally(() => clearTimeout(id));
}

async function fetchWithRetry(url, options = {}, retries = FETCH_RETRIES, delay = FETCH_RETRY_DELAY) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fetchWithTimeout(url, options);
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
// SEARCH LOGIC
// ==============================
export const doInventorySearch = debounce(function({
  searchInput,
  uslFilter,
  sortBy,
  sortDirButton,
  resultsList,
  noResults,
  sortDirection
}) {
  const term = searchInput.value.trim().toLowerCase();
  const usl = uslFilter.value;
  const sort = sortBy.value;
  const key = generateSearchKey({ term, usl, sort, dir: sortDirection });

  DEBUG_MODE && console.log(`[DEBUG] Triggered search: term='${term}', usl='${usl}', sort='${sort}', direction='${sortDirection}'`);

  withLoadingToggle(
    {
      show: [elements.loading],
      hide: [resultsList, noResults, elements.stats]
    },
    () => {
      noResults.style.display = "none";

      // Use cache if available
      if (searchCache.has(key)) {
        const cached = searchCache.get(key);
        DEBUG_MODE && console.log("[DEBUG] Using cached result for:", key);
        renderInventoryResults(cached, term, resultsList);
        return;
      }

      return fetchWithRetry(buildSearchUrl({ term, usl, sort, dir: sortDirection }))
        .then(res => res.json())
        .then(data => {
          if (!data || !data.length) {
            noResults.style.display = "block";
            noResults.innerText = "No results found. Try a different search.";
            return;
          }

          DEBUG_MODE && console.log(`[DEBUG] Received ${data.length} results`);
          populateInventoryStats(data);
          renderInventoryResults(data, term, resultsList);
          window.inventorySearchResults = data;
          updateSearchCache(key, data);
        })
        .catch(err => {
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
