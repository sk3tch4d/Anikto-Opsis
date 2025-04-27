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
// HELPER: CREATE TOGGLE LIST
// ==============================
function createToggleList({ label, items, itemAttributes = {}, sort = true, searchableValue = "" }) {
  const toggle = document.createElement("span");
  toggle.className = "tag-label tag-toggle clickable-toggle";
  toggle.innerHTML = `${label} (${items.length}) <span class="chevron">▼</span>`;

  const wrapper = document.createElement("div");
  wrapper.className = "usl-wrapper";

  const container = document.createElement("div");
  container.className = "clickable-match-container";

  const sortedItems = sort ? [...items].sort() : items;

  sortedItems.forEach(text => {
    const span = document.createElement("span");
    span.className = "clickable-match";
    span.textContent = text;

    // Apply any custom attributes
    for (const [attr, value] of Object.entries(itemAttributes)) {
      span.setAttribute(attr, typeof value === "function" ? value(text) : value);
    }

    if (searchableValue) {
      span.setAttribute("data-search", searchableValue);
    }

    container.appendChild(span);
  });

  wrapper.appendChild(container);

  // Auto-expand small lists
  if (items.length <= 3) {
    wrapper.classList.add("show");
    toggle.classList.add("toggle-open");
  }

  toggle.addEventListener("click", () => {
    wrapper.classList.toggle("show");
    toggle.classList.toggle("toggle-open");
  });

  return { toggle, wrapper };
}

// ==============================
// HELPER: CREATE ITEM CARD
// ==============================
function createInventoryItemCard(matching, base, currentSearch, currentFilter) {
  const old = base.Old?.trim() ? ` (Old: ${base.Old})` : "";
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
    <span class="tag-label">Stores Number:</span> <span class="clickable-stat" data-search="${base.Num}">${numberHTML}</span><br>
    <span class="tag-label">Description:</span> ${descHTML}<br>
    <span class="tag-label">Total Quantity:</span> ${totalQty}${binInfo}<br>
    ${groupLine}
    ${costCenterLine}
  `;

  const infoBlock = document.createElement("div");
  infoBlock.innerHTML = detailsHTML;

  card.appendChild(infoBlock);

  if (currentFilter === "All") {
    const { toggle, wrapper: uslWrapper } = createToggleList({
      label: "USLs",
      items: matching.map(item => item.USL),
      itemAttributes: {
        "data-filter": usl => usl,
      },
      searchableValue: base.Num,
    });
    card.appendChild(toggle);
    card.appendChild(uslWrapper);
  }

  return card;
}

// ==============================
// MAIN STAT POPULATOR FUNCTION
// ==============================
export function populateInventoryStats(results) {
  const statsBox = document.getElementById("inventory-stats");
  if (!statsBox) return;

  statsBox.innerHTML = "";

  const searchInput = document.getElementById("inventory-search");
  const currentSearch = searchInput?.value.trim() || "(None)";

  const filterInput = document.getElementById("inventory-filter");
  const currentFilter = filterInput?.value.trim() || "All";

  const uniqueNums = [...new Set(results.map(item => item.Num))];

  // ========== STATS SUMMARY BLOCK ==========
  const summaryContainer = document.createElement("div");
  summaryContainer.className = "compare-card";

  const liResults = document.createElement("div");
  liResults.innerHTML = `<span class="tag-label">Results:</span> ${results.length} <span class="tag-label">Unique:</span> ${uniqueNums.length}`;
  summaryContainer.appendChild(liResults);

  const liMatches = document.createElement("div");

  const matchesToggle = document.createElement("span");
  matchesToggle.className = "tag-label tag-toggle clickable-toggle";
  matchesToggle.innerHTML = `Matches (${uniqueNums.length}) <span class="chevron">▼</span>`;

  const matchesWrapper = document.createElement("div");
  matchesWrapper.className = "usl-wrapper";

  const matchContainer = document.createElement("div");
  matchContainer.className = "clickable-match-container";

  uniqueNums.forEach(num => {
    const span = document.createElement("span");
    span.className = "clickable-match";
    span.setAttribute("data-search", num);
    span.textContent = num;
    matchContainer.appendChild(span);
  });

  matchesWrapper.appendChild(matchContainer);

  matchesToggle.addEventListener("click", () => {
    matchesWrapper.classList.toggle("show");
    matchesToggle.classList.toggle("toggle-open");
  });

  liMatches.appendChild(matchesToggle);
  liMatches.appendChild(matchesWrapper);

  summaryContainer.appendChild(liMatches);
  statsBox.appendChild(summaryContainer);

  // ========== PER-ITEM CARDS ==========
  uniqueNums.forEach(num => {
    const matching = results.filter(r => r.Num === num);
    if (!matching.length) return;

    const base = matching[0];
    const card = createInventoryItemCard(matching, base, currentSearch, currentFilter);
    statsBox.appendChild(card);
  });

  setupParseStats();
}
