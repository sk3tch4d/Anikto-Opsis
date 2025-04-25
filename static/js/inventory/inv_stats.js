// ==============================
// INV_STATS.JS
// Inventory Statistics Renderer
// ==============================

import { setupParseStats, highlightMatch } from "../search-utils.js";

// ==============================
// DEBUG TOGGLE
// ==============================
const DEBUG_MODE = localStorage.getItem("DEBUG_MODE") === "true";

// ==============================
// MAIN STAT POPULATOR FUNCTION
// ==============================
export function populateInventoryStats(results) {
  const statsBox = document.getElementById("inventory-stats");
  if (!statsBox) return;

  statsBox.innerHTML = "";

  const searchInput = document.getElementById("inventory-search");
  const currentSearch = searchInput?.value.trim() || "(None)";

  const uniqueNums = [...new Set(results.map(item => item.Num))];

  // ========== STATS SUMMARY BLOCK ==========
  const summaryContainer = document.createElement("div");
  summaryContainer.className = "compare-card";

  const liResults = document.createElement("div");
  liResults.innerHTML = `<span class="tag-label">Results:</span> ${results.length} <span class="tag-label">Unique:</span> ${uniqueNums.length}`;
  summaryContainer.appendChild(liResults);

  const liMatches = document.createElement("div");
  liMatches.innerHTML = `<span class="tag-label">Matches:</span> `;
  const matchContainer = document.createElement("div");
  matchContainer.className = "clickable-match-container";

  uniqueNums.forEach(num => {
    const span = document.createElement("span");
    span.className = "clickable-match";
    span.setAttribute("data-value", num);
    span.textContent = num;
    matchContainer.appendChild(span);
  });

  liMatches.appendChild(matchContainer);
  summaryContainer.appendChild(liMatches);
  statsBox.appendChild(summaryContainer);

  // ========== PER-ITEM CARDS ==========
  uniqueNums.forEach(num => {
    const matching = results.filter(r => r.Num === num);
    if (!matching.length) return;

    const base = matching[0];
    const old = base.Old?.trim() ? ` (Old: ${base.Old})` : "";
    const cost = base.Cost !== undefined ? base.Cost : "N/A";
    const uom = base.UOM ?? "";
    const totalQty = matching.reduce((sum, item) => sum + item.QTY, 0);

    const card = document.createElement("div");
    card.className = "compare-card";

    const numberHTML = highlightMatch(base.Num + old, currentSearch);
    const descHTML = highlightMatch(base.Description, currentSearch);
    const binInfo = matching.length === 1 && matching[0].Bin
      ? `<br><span class="tag-label">Bin:</span> ${highlightMatch(matching[0].Bin, currentSearch)}`
      : "";

    const groupMatch = (base.Group || "").toLowerCase().includes(currentSearch.toLowerCase());
    const costCenterMatch = (base.Cost_Center || "").toLowerCase().includes(currentSearch.toLowerCase());

    const groupLine = groupMatch
      ? `<span class="tag-label">Group:</span> ${highlightMatch(base.Group, currentSearch)}<br>`
      : "";
    const costCenterLine = costCenterMatch
      ? `<span class="tag-label">Cost Center:</span> ${highlightMatch(base.Cost_Center, currentSearch)}<br>`
      : "";

    const detailsHTML = `
      <span class="tag-label">Stores Number:</span> <span class="clickable-stat" data-value="${base.Num}">${numberHTML}</span><br>
      <span class="tag-label">Description:</span> ${descHTML}<br>
      <span class="tag-label">Cost:</span> ${cost} / ${uom}<br>
      <span class="tag-label">Total Quantity:</span> ${totalQty}${binInfo}<br>
      ${groupLine}
      ${costCenterLine}
      <span class="tag-label">USLs:</span>
    `;

    const infoBlock = document.createElement("div");
    infoBlock.innerHTML = detailsHTML;

    const uslContainer = document.createElement("div");
    uslContainer.className = "clickable-match-container";
    matching
      .sort((a, b) => b.QTY - a.QTY)
      .forEach(item => {
        const span = document.createElement("span");
        span.className = "clickable-match";
        span.setAttribute("data-value", item.USL);
        span.textContent = item.USL;
        uslContainer.appendChild(span);
      });

    card.appendChild(infoBlock);
    card.appendChild(uslContainer);  
    statsBox.appendChild(card);
  });

  setupParseStats(".clickable-stat, .clickable-match", "inventory-search", "data-value");
}
