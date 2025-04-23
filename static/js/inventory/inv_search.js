// ==============================
// INV_SEARCH.JS — Inventory Search Logic
// ==============================

import { populateInventoryStats } from "./inv_stats.js";
import { highlightMatch } from "../search-utils.js";
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
      resultsList.innerHTML = "";
      noResults.style.display = "none";

      return fetch(`/inventory-search?term=${encodeURIComponent(term)}&usl=${encodeURIComponent(usl)}&sort=${encodeURIComponent(sort)}&dir=${encodeURIComponent(sortDirection)}`)
        .then(res => res.json())
        .then(data => {
          if (!data || !data.length) {
            noResults.style.display = "block";
            return;
          }

          populateInventoryStats(data);
          window.inventorySearchResults = data;

          data.forEach(item => {
            const li = document.createElement("li");
            let html = "";

            const numStr = String(item.Num ?? "");
            const oldStr = String(item.Old ?? "");

            if (term) {
              const numMatch = numStr.toLowerCase().includes(term);
              const oldMatch = oldStr.toLowerCase().includes(term);

              if (numMatch || (!numMatch && !oldMatch)) {
                html += `<span class="tag-label">Number:</span> ${highlightMatch(numStr, term)}`;
                if (oldStr) html += ` &nbsp;&nbsp; <span class="tag-label">Old:</span> (${highlightMatch(oldStr, term)})`;
              } else if (oldMatch) {
                html += `<span class="tag-label">Old Number:</span> ${highlightMatch(oldStr, term)}`;
                if (numStr) html += ` &nbsp;&nbsp; <span class="tag-label">New:</span> (${highlightMatch(numStr, term)})`;
              }
            } else {
              html += `<span class="tag-label">Number:</span> ${numStr}`;
              if (oldStr) html += ` &nbsp;&nbsp; <span class="tag-label">Old:</span> ${oldStr}`;
            }

            html += `<br>`;

            if (item.Description?.trim()) {
              html += `<span class="tag-label">Description:</span> ${highlightMatch(item.Description, term)}<br>`;
            }

            if (item.USL?.trim() || item.Bin?.trim()) {
              html += `<span class="tag-label">Location:</span>`;
              if (item.USL?.trim()) html += ` ${highlightMatch(item.USL, term)}`;
              if (item.Bin?.trim()) html += ` - ${highlightMatch(item.Bin, term)}`;
              html += `<br>`;
            }

            if (item.QTY || item.UOM?.trim()) {
              html += `<span class="tag-label">Quantity:</span> ~${item.QTY}<br>`;
            }

            if (item.Cost !== undefined && item.Cost !== null && item.Cost !== "") {
              html += `<span class="tag-label">Cost:</span> ${item.Cost}`;
              if (item.UOM?.trim()) html += ` / ${highlightMatch(item.UOM, term)}`;
              html += `<br>`;
            }

            if (item.Cost_Center?.trim()) {
              html += `<span class="tag-label">Cost Center:</span> ${highlightMatch(item.Cost_Center, term)}<br>`;
            }

            if (item.Group?.trim()) {
              html += `<span class="tag-label">Group:</span> ${highlightMatch(item.Group, term)}`;
            }

            li.innerHTML = html;
            resultsList.appendChild(li);
          });
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
