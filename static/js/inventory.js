// ==============================
// INVENTORY.JS
// Inventory Search Panel Logic
// ==============================

// ==============================
// IMPORTS
// ==============================
import { setupParseStats } from "./search-utils.js";
import { openPanelById } from "./panels.js";

// ==============================
// DEBUG TOGGLE
// ==============================
const DEBUG_MODE = localStorage.getItem("DEBUG_MODE") === "true";

// ==============================
// HIGHLIGHT MATCH HELPER
// ==============================
function highlightMatch(text, term) {
  if (!term) return text;
  const safeTerm = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${safeTerm})`, "ig");
  return text.replace(regex, `<span class="highlight">$1</span>`);
}

// ==============================
// POPULATE STATS PANEL
// ==============================
function populateInventoryStats(results) {
  const statsBox = document.getElementById("inventory-stats");
  if (!statsBox) return;

  statsBox.innerHTML = "";
  const uniqueNums = [...new Set(results.map(item => item.Num))];

  // Summary Stats
  const liResults = document.createElement("li");
  liResults.innerHTML = `<strong>Results:</strong> ${results.length}`;
  statsBox.appendChild(liResults);

  const liUnique = document.createElement("li");
  liUnique.innerHTML = `<strong>Unique Items:</strong> ${uniqueNums.length}`;
  statsBox.appendChild(liUnique);

  const liFound = document.createElement("li");
  liFound.innerHTML = `<strong>Found:</strong> ${uniqueNums.join(", ")}`;
  statsBox.appendChild(liFound);

  // Detailed Stats Per Item
  uniqueNums.forEach(num => {
    const matching = results.filter(r => r.Num === num);
    if (!matching.length) return;

    const base = matching[0];
    const old = base.Old?.trim() ? ` (Old: ${base.Old})` : "";
    const cost = base.Cost !== undefined ? base.Cost : "N/A";
    const uom = base.UOM ?? "";
    const topMatch = matching.reduce((a, b) => a.QTY > b.QTY ? a : b);

    const li = document.createElement("li");
    
    // Label (non-clickable)
    li.innerHTML = `<strong>Stores Number:</strong> `;
    
    // Clickable Number
    const numberSpan = document.createElement("span");
    numberSpan.className = "clickable-stat";
    numberSpan.setAttribute("data-value", base.Num);
    numberSpan.textContent = base.Num + old;
    
    // Append the number span right after the label
    li.appendChild(numberSpan);
    
    // Add the rest of the item details
    li.innerHTML += `
      <br><strong>Description:</strong> ${base.Description}<br>
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

  setupParseStats(".clickable-stat", "inventory-search", "data-value");
}

// ==============================
// MAIN APP INITIALIZER
// ==============================
export function initializeInventoryApp() {
  const searchInput = document.getElementById("inventory-search");
  const uslFilter = document.getElementById("usl-filter");
  const sortBy = document.getElementById("sort-by") || { value: "QTY" };
  const sortDirButton = document.getElementById("sort-direction");
  const resultsList = document.getElementById("inventory-results");
  const noResults = document.getElementById("no-results");
  let sortDirection = "desc";

  // ==============================
  // FETCH USL FILTER OPTIONS
  // ==============================
  fetch("/inventory-usls")
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

    document.getElementById("loading").style.display = "block";
    resultsList.innerHTML = "";
    noResults.style.display = "none";

    fetch(`/inventory-search?term=${encodeURIComponent(term)}&usl=${encodeURIComponent(usl)}&sort=${encodeURIComponent(sort)}&dir=${encodeURIComponent(sortDirection)}`)
      .then(res => res.json())
      .then(data => {
        document.getElementById("loading").style.display = "none";
        if (!data || !data.length) {
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
        });
      })
      .catch(err => {
        document.getElementById("loading").style.display = "none";
        noResults.style.display = "block";
        DEBUG_MODE && console.error("[DEBUG] Fetch Error:", err);
      });

    const savedScroll = localStorage.getItem("inventoryScrollTop");
    if (savedScroll) {
      setTimeout(() => {
        window.scrollTo(0, parseInt(savedScroll));
        DEBUG_MODE && console.log(`[DEBUG] Restored scroll position: ${savedScroll}px`);
      }, 50);
    }
  }

  searchInput.addEventListener("input", () => {
    clearTimeout(window._searchDebounce);
    window._searchDebounce = setTimeout(doSearch, 200);
  });

  uslFilter.addEventListener("change", doSearch);
  if (sortBy) sortBy.addEventListener("change", doSearch);
  doSearch();

  window.addEventListener("beforeunload", () => {
    localStorage.setItem("inventoryScrollTop", window.scrollY);
  });
}

// ==============================
// EXPORTS
// ==============================
export { highlightMatch, populateInventoryStats };
