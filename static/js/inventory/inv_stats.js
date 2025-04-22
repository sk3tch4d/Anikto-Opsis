// ==============================
// INV_STATS.JS
// Inventory Statistics Renderer
// ==============================

import { setupParseStats } from "../search-utils.js";

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

  // ==============================
  // GET SEARCH TERM
  // ==============================
  const searchInput = document.getElementById("inventory-search");
  const currentSearch = searchInput?.value.trim() || "(None)";

  // ==============================
  // BASIC SUMMARY STATS
  // ==============================
  const uniqueNums = [...new Set(results.map(item => item.Num))];

  const liSearch = document.createElement("li");
  liSearch.innerHTML = `<strong>Current Search:</strong> <em>${currentSearch}</em>`;
  statsBox.appendChild(liSearch);

  const liResults = document.createElement("li");
  liResults.innerHTML = `<strong>Results:</strong> ${results.length}`;
  statsBox.appendChild(liResults);

  const liUnique = document.createElement("li");
  liUnique.innerHTML = `<strong>Unique Items:</strong> ${uniqueNums.length}`;
  statsBox.appendChild(liUnique);

  const liMatches = document.createElement("li");
  liMatches.innerHTML = `<strong>Matches:</strong> `;

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

    // Store number label
    li.innerHTML = `<strong>Stores Number:</strong> `;

    // Clickable stat span
    const numberSpan = document.createElement("span");
    numberSpan.className = "clickable-stat";
    numberSpan.setAttribute("data-value", base.Num);
    numberSpan.textContent = base.Num + old;
    li.appendChild(numberSpan);

    // Remaining item details
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

  // ==============================
  // MAKE CLICKABLE
  // ==============================
  setupParseStats(".clickable-stat", "inventory-search", "data-value");
}
