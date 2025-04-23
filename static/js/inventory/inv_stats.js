// ==============================
// INV_STATS.JS
// Inventory Statistics Renderer
// ==============================

import { setupParseStats, highlightMatch } from "../search-utils.js";
import { toggleLoadingState } from "..loading.js";

// ==============================
// DEBUG TOGGLE
// ==============================
const DEBUG_MODE = localStorage.getItem("DEBUG_MODE") === "true";

// ==============================
// MAIN STAT POPULATOR FUNCTION
// ==============================
export function populateInventoryStats(results) {
  const statsBox = document.getElementById("inventory-stats");
  const loading = document.getElementById("loading");
  if (!statsBox || !loading) return;

  // Start: show spinner, hide stats
  toggleLoadingState(true, {
    show: [loading],
    hide: [statsBox]
  });

  statsBox.innerHTML = "";

  // ==============================
  // GET SEARCH TERM
  // ==============================
  const searchInput = document.getElementById("inventory-search");
  const currentSearch = searchInput?.value.trim() || "(None)";

  // ==============================
  // BASIC SUMMARY & STATS
  // ==============================
  const uniqueNums = [...new Set(results.map(item => item.Num))];

  const liResults = document.createElement("li");
  liResults.innerHTML = `<span class="tag-label">Results:</span> ${results.length} <span class="tag-label">Unique:</span> ${uniqueNums.length}`;
  statsBox.appendChild(liResults);

  const liMatches = document.createElement("li");
  liMatches.innerHTML = `<span class="tag-label">Matches:</span> `;
  const container = document.createElement("div");
  container.className = "clickable-match-container";

  uniqueNums.forEach(num => {
    const span = document.createElement("span");
    span.className = "clickable-match";
    span.setAttribute("data-value", num);
    span.textContent = num;
    container.appendChild(span);
  });

  liMatches.appendChild(container);
  statsBox.appendChild(liMatches);

  // ==============================
  // PER-ITEM DETAIL BLOCKS
  // ==============================
  uniqueNums.forEach(num => {
    const matching = results.filter(r => r.Num === num);
    if (!matching.length) return;

    const base = matching[0];
    const old = base.Old?.trim() ? ` (Old: ${base.Old})` : "";
    const cost = base.Cost !== undefined ? base.Cost : "N/A";
    const uom = base.UOM ?? "";
    const topMatch = matching.reduce((a, b) => a.QTY > b.QTY ? a : b);

    const li = document.createElement("li");

    li.innerHTML = `<span class="tag-label">Stores Number:</span> `;

    const numberSpan = document.createElement("span");
    numberSpan.className = "clickable-stat";
    numberSpan.setAttribute("data-value", base.Num);
    numberSpan.innerHTML = highlightMatch(base.Num + old, currentSearch);
    li.appendChild(numberSpan);

    const totalQty = matching.reduce((sum, item) => sum + item.QTY, 0);
    const uslContainer = document.createElement("div");
    uslContainer.className = "clickable-match-container";

    matching.forEach(item => {
      const span = document.createElement("span");
      span.className = "clickable-match";
      span.setAttribute("data-value", item.USL);
      span.textContent = item.USL;
      uslContainer.appendChild(span);
    });

    li.innerHTML += `
      <br><span class="tag-label">Description:</span> ${highlightMatch(base.Description, currentSearch)}<br>
      <span class="tag-label">Cost:</span> ${cost} / ${uom}<br>
      <span class="tag-label">Total Quantity:</span> ${totalQty}<br>
      <span class="tag-label">USLs:</span>
    `;

    li.appendChild(uslContainer);
    statsBox.appendChild(li);
  });

  // ==============================
  // MAKE CLICKABLE
  // ==============================
  setupParseStats(".clickable-stat, .clickable-match", "inventory-search", "data-value");

  // Done: hide spinner, show stats
  toggleLoadingState(false, {
    show: [statsBox],
    hide: [loading]
  });
}
