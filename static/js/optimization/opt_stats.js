// ==============================
// OPT_STATS.JS
// ==============================

import { highlightMatch, setupParseStats, clearTextSelect } from "../search-utils.js";
import { scrollPanel } from "../panels.js";
import { showToast, hapticFeedback } from "../ui-utils.js";

// ==============================
// DEBUG TOGGLE
// ==============================
const DEBUG_MODE = localStorage.getItem("DEBUG_MODE") === "true";

// ==============================
// GLOBAL: SAVED ITEMS
// ==============================
window.savedItems = new Map();

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
// HELPER: TOGGLE LIST CREATOR
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

    for (const [attr, value] of Object.entries(itemAttributes)) {
      span.setAttribute(attr, typeof value === "function" ? value(text) : value);
    }

    if (searchableValue) {
      span.setAttribute("data-search", searchableValue);
    }

    container.appendChild(span);
  });

  wrapper.appendChild(container);

  toggle.addEventListener("click", () => {
    wrapper.classList.toggle("show");
    toggle.classList.toggle("toggle-open");
  });

  return { toggle, wrapper };
}

// ==============================
// HELPER: UPDATE SAVED PANEL
// ==============================
function updateSavedPanel() {
  const panel = document.querySelector("#optimization-saved-panel .panel-body");
  panel.innerHTML = "";

  const cards = Array.from(savedItems.values()).map(entry => entry.card).reverse();

  if (!cards.length) {
    panel.innerHTML = `<p>No saved items yet.</p><br><p>Double click a tile to save!</p>`;
    return;
  }

  cards.forEach(clone => {
    const freshClone = clone.cloneNode(true);
    panel.appendChild(freshClone);
  });
}

// ==============================
// HELPER: TOGGLE SAVE ITEM
// ==============================
function toggleSaveItem(card, base, matching) {
  if (savedItems.has(base.Num)) {
    savedItems.delete(base.Num);
    card.classList.remove("saved-card");
    showToast("Removed!");
  } else {
    const clone = card.cloneNode(true);
    savedItems.set(base.Num, { card: clone, data: matching });
    card.classList.add("saved-card");
    showToast("Saved!");
  }
  hapticFeedback();
  clearTextSelect();
  updateSavedPanel();
}

// ==============================
// HELPER: CREATE ITEM CARD
// ==============================
function createOptimizationItemCard(matching, base, currentSearch, currentFilter) {
  const totalQty = matching.reduce((sum, item) => sum + (item.QTY || 0), 0);
  const card = document.createElement("div");
  card.className = "panel-card";

  const firstUSL = matching.length === 1 ? matching[0].USL : null;

  const numberHTML = `<span class="clickable-stat" data-search="${base.Num}" ${firstUSL ? `data-filter="${firstUSL}"` : ""}>
    ${highlightMatch(base.Num, currentSearch)}
  </span>`;

  const oldHTML = base.Old?.trim()
    ? `&nbsp;<span class="tag-label">Old Number:</span> <span class="clickable-stat old-number" data-search="${base.Old}">${highlightMatch(base.Old, currentSearch)}</span>`
    : "";

  const descHTML = highlightMatch(base.Description || "", currentSearch);

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

  const sropLine = base.SROP
    ? `<span class="tag-label">Suggested ROP:</span> ${base.SROP}`
    : "";

  const sroqLine = base.SROQ
    ? `<span class="tag-label">Suggested ROQ:</span> ${base.SROQ}`
    : "";

  const uniqueUSLs = [...new Set(matching.map(item => item.USL))];
  const quantityLabel = (currentFilter === "all" && uniqueUSLs.length > 1) ? "Total Quantity" : "Quantity";

  const detailsHTML = joinAsDivs(
    `<span class="tag-label">Stores Number:</span> ${numberHTML}`,
    oldHTML,
    descHTML,
    `<span class="tag-label">${quantityLabel}:</span> ${totalQty} ${binInfo}`,
    groupLine,
    costCenterLine,
    sropLine,
    sroqLine
  );

  const infoBlock = document.createElement("div");
  infoBlock.innerHTML = detailsHTML;
  card.appendChild(infoBlock);

  card.addEventListener("dblclick", () => {
    toggleSaveItem(card, base, matching);
  });

  if (currentFilter === "all") {
    if (uniqueUSLs.length === 1) {
      const pill = document.createElement("span");
      pill.className = "clickable-match";
      pill.textContent = uniqueUSLs[0];
      pill.setAttribute("data-filter", uniqueUSLs[0]);
      pill.setAttribute("data-search", base.Num);
      card.appendChild(pill);
    } else if (uniqueUSLs.length > 1) {
      const { toggle, wrapper } = createToggleList({
        label: "USLs",
        items: uniqueUSLs,
        itemAttributes: {
          "data-filter": usl => usl
        },
        searchableValue: base.Num
      });
      card.appendChild(toggle);
      card.appendChild(wrapper);
    }
  }

  return card;
}

// ==============================
// MAIN EXPORT
// ==============================
export function populateOptimizationStats(results) {
  const box = document.getElementById("optimization-stats");
  if (!box) return;

  const input = document.getElementById("optimization-search");
  const currentSearch = input?.value.trim().toLowerCase() || "";

  const filterInput = document.getElementById("opsh-filter");
  const currentFilter = filterInput?.value.trim().toLowerCase() || "all";

  box.innerHTML = "";

  const uniqueNums = [...new Set(results.map(item => item.Num))];

  const summary = document.createElement("div");
  summary.className = "panel-card";
  summary.innerHTML = `<div><span class="tag-label">Results:</span> ${results.length} <span class="tag-label">Unique:</span> ${uniqueNums.length}</div>`;
  box.appendChild(summary);

  const fragment = document.createDocumentFragment();

  for (const num of uniqueNums) {
    const matching = results.filter(r => r.Num === num);
    const base = matching[0];
    const card = createOptimizationItemCard(matching, base, currentSearch, currentFilter);
    fragment.appendChild(card);
  }

  if (!uniqueNums.length) {
    const empty = document.createElement("div");
    empty.className = "no-results";
    empty.textContent = "No results found.";
    fragment.appendChild(empty);
  }

  box.appendChild(fragment);

  setTimeout(() => {
    const header = document.querySelector('#optimization-search-panel .panel-header');
    if (header) scrollPanel(header);
  }, 100);

  setupParseStats(".clickable-match, .clickable-stat", "optimization-search", "data-search", "opsh-filter", "data-filter");
}

window.populateOptimizationStats = populateOptimizationStats;
