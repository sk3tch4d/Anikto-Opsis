// ==============================
// INV_STATS.JS 
// ==============================

import { clearTextSelect, setupParseStats, highlightMatch } from "../search-utils.js";
import { showToast, hapticFeedback, attachChevron } from '../ui-utils.js';
import { scrollPanel } from '../panels.js';
import { createSavedCardToggle, createSavedCardUpdater } from '../cards/saved_card.js';

// ==============================
// DEBUG TOGGLE
// ==============================
const DEBUG_MODE = localStorage.getItem("DEBUG_MODE") === "true";

// ==============================
// SAVED CARDS SETUP
// ==============================
const savedItems = new Map();

const updateSavedPanel = createSavedCardUpdater({
  selector: "#inventory-saved-panel .panel-body",
  savedItems
});

const toggleSavedCard = createSavedCardToggle(savedItems, updateSavedPanel);

// ==============================
// HELPER: JOIN CONTENT <div>
// ==============================
function joinAsDivs(...lines) {
  return lines
    .filter(line => line && line.trim() !== "")
    .map(line => `<div class="inventory-line">${line}</div>`)
    .join("");
}

// ==============================
// HELPER: CREATE TOGGLE LIST
// ==============================
function createToggleList({ label, items, itemAttributes = {}, sort = true, searchableValue = "" }) {
  const toggle = document.createElement("span");
  toggle.className = "tag-label tag-toggle clickable-toggle";
  toggle.innerHTML = `${label} (${items.length}) <span class="chevron">▼</span>`;

  const wrapper = document.createElement("div");
  wrapper.className = "toggle-wrapper";

  const container = document.createElement("div");
  container.className = "clickable-match-container";

  const sortedItems = sort ? [...items].sort() : items;

  sortedItems.forEach(text => {
    const span = document.createElement("span");
    span.className = "clickable-match";
    span.textContent = text;

    for (const [attr, value] of Object.entries(itemAttributes)) {
      span.setAttribute(attr, typeof value === "function" ? value(text) : value);
    }

    if (searchableValue) {
      span.setAttribute("data-search", searchableValue);
    }

    container.appendChild(span);
  });

  wrapper.appendChild(container);

  return { toggle, wrapper };
}

// ==============================
// HELPER: CREATE ITEM CARD
// ==============================
function createInventoryItemCard(matching, base, currentSearch, currentFilter) {
  const totalQty = matching.reduce((sum, item) => sum + item.QTY, 0);
  const card = document.createElement("div");
  card.className = "panel-card";

  const firstUSL = matching.length === 1 ? matching[0].USL : null;
  
  const numberHTML = `<span class="clickable-stat" data-search="${base.Num}" ${firstUSL ? `data-filter="${firstUSL}"` : ""}>
    ${highlightMatch(base.Num, currentSearch)}
  </span>`;
  
  const oldHTML = base.Old?.trim()
    ? `&nbsp;<span class="tag-label">Old Number:</span> <span class="clickable-stat old-number" data-search="${base.Old}">${highlightMatch(base.Old, currentSearch)}</span>`
    : "";

  const descHTML = highlightMatch(base.Description, currentSearch);

  const binInfo = matching.length === 1 && matching[0].Bin
    ? `<span class="tag-label">Bin:</span> ${highlightMatch(matching[0].Bin, currentSearch)}`
    : "";

  const groupMatch = (base.Group || "").toLowerCase().includes(currentSearch.toLowerCase());
  const costCenterMatch = (base.Cost_Center || "").toLowerCase().includes(currentSearch.toLowerCase());

  const groupLine = groupMatch
    ? `<span class="tag-label">Group:</span> ${highlightMatch(base.Group, currentSearch)}`
    : "";

  const costCenterLine = costCenterMatch
    ? `<span class="tag-label">Cost Center:</span> ${highlightMatch(base.Cost_Center, currentSearch)}`
    : "";

  const uniqueUSLs = [...new Set(matching.map(item => item.USL))];
  const quantityLabel = (currentFilter === "all" && uniqueUSLs.length > 1) ? "Total Quantity" : "Quantity";

  const detailsHTML = joinAsDivs(
    `<span class="tag-label">Stores Number:</span> ${numberHTML}`,
    oldHTML,
    descHTML,
    `<span class="tag-label">${quantityLabel}:</span> ${totalQty} ${binInfo}`,
    groupLine,
    costCenterLine
  );

  const infoBlock = document.createElement("div");
  infoBlock.innerHTML = detailsHTML;
  card.appendChild(infoBlock);

  card.addEventListener("dblclick", () => {
    toggleSavedCard(card, base, matching);
  });

  if (currentFilter === "all") {
    if (uniqueUSLs.length === 1) {
      const singlePill = document.createElement("span");
      singlePill.className = "clickable-match";
      singlePill.textContent = uniqueUSLs[0];
      singlePill.setAttribute("data-filter", uniqueUSLs[0]);
      singlePill.setAttribute("data-search", base.Num);
      card.appendChild(singlePill);
    } else if (uniqueUSLs.length > 1) {
      const { toggle, wrapper: uslWrapper } = createToggleList({
        label: "USLs",
        items: uniqueUSLs,
        itemAttributes: {
          "data-filter": usl => usl,
        },
        searchableValue: base.Num,
      });
      card.appendChild(toggle);
      card.appendChild(uslWrapper);
    }
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
  const currentSearch = searchInput?.value.trim() || "";

  const filterInput = document.getElementById("usl-filter");
  const currentFilter = (filterInput?.value.trim().toLowerCase()) || "all";

  const uniqueNums = [...new Set(results.map(item => item.Num))];

  const fragment = document.createDocumentFragment();

  const summaryContainer = document.createElement("div");
  summaryContainer.className = "panel-card";

  const liResults = document.createElement("div");
  const resultsCount = results.length >= 100 ? "100+" : results.length;
  liResults.innerHTML = `<span class="tag-label">Results:</span> ${resultsCount} <span class="tag-label">Unique:</span> ${uniqueNums.length}`;
  summaryContainer.appendChild(liResults);

  const liMatches = document.createElement("div");

  if (uniqueNums.length <= 3) {
    const matchContainer = document.createElement("div");
    matchContainer.className = "clickable-match-container";

    uniqueNums.forEach(num => {
      const span = document.createElement("span");
      span.className = "clickable-match";
      span.setAttribute("data-search", num);
      span.textContent = num;
      matchContainer.appendChild(span);
    });

    liMatches.appendChild(matchContainer);
  } else {
    const matchesToggle = document.createElement("span");
    matchesToggle.className = "tag-label tag-toggle clickable-toggle";
    matchesToggle.innerHTML = `Matches (${uniqueNums.length}) <span class="chevron">▼</span>`;

    const matchesWrapper = document.createElement("div");
    matchesWrapper.className = "toggle-wrapper";

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

    liMatches.appendChild(matchesToggle);
    liMatches.appendChild(matchesWrapper);
  }

  summaryContainer.appendChild(liMatches);
  fragment.appendChild(summaryContainer);

  uniqueNums.forEach(num => {
    const matching = results.filter(r => r.Num === num);
    if (!matching.length) return;

    const base = matching[0];
    const card = createInventoryItemCard(matching, base, currentSearch, currentFilter);
    fragment.appendChild(card);
  });

  if (!uniqueNums.length) {
    const noResults = document.createElement("div");
    noResults.className = "no-results";
    noResults.textContent = "No results found.";
    fragment.appendChild(noResults);
  }

  statsBox.appendChild(fragment);

  requestAnimationFrame(() => attachChevron({ root: statsBox, chevronColor: "#0a0b0f" }));

  setTimeout(() => {
    const header = document.querySelector('#inventory-search-panel .panel-header');
    if (header) scrollPanel(header);
  }, 100);

  setupParseStats(".clickable-match, .clickable-stat", "inventory-search", "data-search", "usl-filter", "data-filter");
}

window.populateInventoryStats = populateInventoryStats;
