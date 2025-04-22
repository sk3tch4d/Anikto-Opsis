// ==============================
// INVENTORY.JS
// Inventory Search Panel Logic
// ==============================

// ==============================
// GLOBAL DEBUG TOGGLE
// ==============================
const DEBUG_MODE = localStorage.getItem("DEBUG_MODE") === "true";
import { setupParseStats } from "./parse-search.js";

// ==============================
// HELPERS: HIGHLIGHT MATCHED
// ==============================
function highlightMatch(text, term) {
  if (!term) return text;
  const safeTerm = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${safeTerm})`, "ig");
  return text.replace(regex, `<span class="highlight">$1</span>`);
}


// ==============================
// POPULATE STATS PANEL (SEAECH)
// ==============================
function populateInventoryStats(results) {
  const statsBox = document.getElementById("inventory-stats");
  if (!statsBox) return;

  statsBox.innerHTML = "";

  const uniqueNums = [...new Set(results.map(item => item.Num))];

  // Summary stats
  const liResults = document.createElement("li");
  liResults.innerHTML = `<strong>Results:</strong> ${results.length}`;
  statsBox.appendChild(liResults);

  const liUnique = document.createElement("li");
  liUnique.innerHTML = `<strong>Unique Items:</strong> ${uniqueNums.length}`;
  statsBox.appendChild(liUnique);

  const liFound = document.createElement("li");
  liFound.innerHTML = `<strong>Found:</strong> ${uniqueNums.join(", ")}`;
  statsBox.appendChild(liFound);

  // Detailed per-item stats
  uniqueNums.forEach(num => {
    const matching = results.filter(r => r.Num === num);
    if (!matching.length) return;

    const base = matching[0];
    const old = base.Old?.trim() ? ` (Old: ${base.Old})` : "";
    const cost = base.Cost !== undefined ? base.Cost : "N/A";
    const uom = base.UOM ?? "";
    const topMatch = matching.reduce((a, b) => a.QTY > b.QTY ? a : b);

    const li = document.createElement("li");
    li.classList.add("clickable-stat");
    li.setAttribute("data-value", base.Num);

    li.innerHTML = `
      <span class="clickable-stat-label"><strong>Stores Number:</strong> ${base.Num}${old}</span><br>
      <strong>Description:</strong> ${base.Description}<br>
      <strong>Cost:</strong> ${cost} / ${uom}<br>
      <strong>Top Quantity:</strong> ${topMatch.USL} - ${topMatch.QTY}<br>
      <strong>Top 3 USLs:</strong><br>
      ${matching
        .sort((a, b) => b.QTY - a.QTY)
        .slice(0, 3)
        .map(m => `&nbsp;&nbsp;- ${m.USL} (${m.QTY})`)
        .join("<br>")}
    `;

    statsBox.appendChild(li);
  });

  // Enable stat-click behavior
  setupParseStats(".clickable-stat", "inventory-search", "data-value");
}

// ==============================
// INIT INVENTORY SEARCH PANEL
// ==============================
document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.getElementById("inventory-search");
  const uslFilter = document.getElementById("usl-filter");
  const sortBy = document.getElementById("sort-by") || { value: "QTY" };
  const sortDirButton = document.getElementById("sort-direction");
  const resultsList = document.getElementById("inventory-results");
  const noResults = document.getElementById("no-results");

  let sortDirection = "desc";

  // Fetch USLs
  fetch("/inventory-usls")
    .then(res => {
      if (!res.ok) {
        if (DEBUG_MODE) console.error("USL fetch failed:", res.status, res.statusText);
        return null;
      }
      return res.json();
    })
    .then(usls => {
      if (!Array.isArray(usls)) {
        if (DEBUG_MODE) console.warn("USL response not array:", usls);
        return;
      }

      if (DEBUG_MODE) console.log("[DEBUG] USLS Response:", usls);

      usls.sort().forEach(usl => {
        const opt = document.createElement("option");
        opt.value = usl;
        opt.textContent = usl;
        uslFilter.appendChild(opt);
      });
    })
    .catch(err => {
      if (DEBUG_MODE) console.error("USL fetch error:", err);
    });

  // Toggle sort direction
  sortDirButton.addEventListener("click", () => {
    sortDirection = sortDirection === "desc" ? "asc" : "desc";
    sortDirButton.textContent = sortDirection === "desc" ? "↓" : "↑";
    doSearch();
  });

  // ==============================
  // MAIN SEARCH FUNCTION
  // ==============================
  function doSearch() {
    const term = searchInput.value.trim().toLowerCase();
    const usl = uslFilter.value;
    const sort = sortBy.value;

    if (DEBUG_MODE) {
      console.log(`[DEBUG] Search Triggered`);
      console.log(`  • Term: "${term}"`);
      console.log(`  • USL: "${usl}"`);
      console.log(`  • Sort: "${sort}"`);
      console.log(`  • Direction: "${sortDirection}"`);
    }

    document.getElementById("loading").style.display = "block";
    resultsList.innerHTML = "";
    noResults.style.display = "none";

    fetch(`/inventory-search?term=${encodeURIComponent(term)}&usl=${encodeURIComponent(usl)}&sort=${encodeURIComponent(sort)}&dir=${encodeURIComponent(sortDirection)}`)
      .then(res => res.json())
      .then(data => {
        document.getElementById("loading").style.display = "none";

        if (DEBUG_MODE) {
          console.log(`[DEBUG] Search Results Received: ${data.length} item(s)`);
        }

        if (!data || data.length === 0) {
          noResults.style.display = "block";
          return;
        }

        populateInventoryStats(data);

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
            html += `<span class="tag-label">Quantity: </span> ~${item.QTY}<br>`;
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

          if (DEBUG_MODE) {
            console.log(`[DEBUG] Rendered Item: ${item.Num}`);
          }
        });
      })
      .catch(err => {
        document.getElementById("loading").style.display = "none";
        noResults.style.display = "block";
        if (DEBUG_MODE) console.error("[DEBUG] Fetch Error:", err);
      });

    // Restore scroll position on load
    const savedScroll = localStorage.getItem("inventoryScrollTop");
    if (savedScroll) {
      setTimeout(() => {
        window.scrollTo(0, parseInt(savedScroll));
        if (DEBUG_MODE) console.log(`[DEBUG] Restored scroll position: ${savedScroll}px`);
      }, 50);
    }
  }

  // Debounced input search
  searchInput.addEventListener("input", () => {
    clearTimeout(window._searchDebounce);
    window._searchDebounce = setTimeout(doSearch, 200);
  });

  uslFilter.addEventListener("change", doSearch);
  if (sortBy) sortBy.addEventListener("change", doSearch);

  // Trigger initial search on load
  doSearch();
});

// Save scroll position before page unload
window.addEventListener("beforeunload", () => {
  localStorage.setItem("inventoryScrollTop", window.scrollY);
});
