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
  // BASIC SUMMARY & STATS
  // ==============================
  const uniqueNums = [...new Set(results.map(item => item.Num))];

  const liResults = document.createElement("li");
  liResults.innerHTML = `<strong>Results:</strong> ${results.length} <strong> Unique:</strong> ${uniqueNums.length}`;
  statsBox.appendChild(liResults);

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
    const totalQty = matching.reduce((sum, item) => sum + item.QTY, 0);
    const uslContainer = document.createElement("div");
    uslContainer.className = "clickable-match-container"; // same style as summary pills

    matching.forEach(item => {
      const span = document.createElement("span");
      span.className = "clickable-match"; // same pill style
      span.textContent = item.USL;
      uslContainer.appendChild(span);
    });

    li.innerHTML += `
      <br><strong>Description:</strong> ${base.Description}<br>
      <strong>Cost:</strong> ${cost} / ${uom}<br>
      <strong>Total Quantity:</strong> ${totalQty}<br>
      <strong>USLs:</strong>
    `;

    li.appendChild(uslContainer);

    statsBox.appendChild(li);
  });

  // ==============================
  // MAKE CLICKABLE
  // ==============================
  setupParseStats(".clickable-stat, .clickable-match", "inventory-search", "data-value");
}
