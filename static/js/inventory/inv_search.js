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
// SEARCH LOGIC
// ==============================
export function doInventorySearch({ searchInput, uslFilter, sortBy, sortDirButton, resultsList, noResults, sortDirection }) {
  const term = searchInput.value.trim().toLowerCase();
  const usl = uslFilter.value;
  const sort = sortBy.value;

  withLoadingToggle(
    {
      show: [document.getElementById("loading")],
      hide: [resultsList, noResults, document.getElementById("inventory-stats")]
    },
    () => {
      noResults.style.display = "none";

      return fetch(`/inventory-search?term=${encodeURIComponent(term)}&usl=${encodeURIComponent(usl)}&sort=${encodeURIComponent(sort)}&dir=${encodeURIComponent(sortDirection)}`)
        .then(res => res.json())
        .then(data => {
          if (!data || !data.length) {
            noResults.style.display = "block";
            return;
          }

          populateInventoryStats(data);
          renderInventoryResults(data, term, resultsList);
          window.inventorySearchResults = data;
        })
        .catch(err => {
          noResults.style.display = "block";
          DEBUG_MODE && console.error("[DEBUG] Fetch Error:", err);
        })
        .finally(() => {
          const savedScroll = localStorage.getItem("inventoryScrollTop");
          if (savedScroll) {
            setTimeout(() => {
              window.scrollTo(0, parseInt(savedScroll));
              DEBUG_MODE && console.log(`[DEBUG] Restored scroll position: ${savedScroll}px`);
            }, 50);
          }
        });
    }
  );
}
