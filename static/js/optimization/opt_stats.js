// ==============================
// OPT_STATS.JS
// ==============================

import { highlightMatch, setupParseStats, clearTextSelect } from "../search-utils.js";
import { scrollPanel } from "../panels.js";
import { showToast, hapticFeedback } from "../ui-utils.js";

const DEBUG_MODE = localStorage.getItem("DEBUG_MODE") === "true";
window.savedItems = new Map();

function debug(...args) {
  if (DEBUG_MODE) console.debug("[OPT_STATS]", ...args);
}

// ==============================
// JOIN LINES INTO HTML BLOCKS
// ==============================
function joinAsDivs(...lines) {
  return lines
    .filter(line => line && line.trim() !== "")
    .map(line => `<div class="inventory-line">${line}</div>`)
    .join("");
}

// ==============================
// TOGGLEABLE MATCH LIST
// ==============================
function createToggleList({ label, items, itemAttributes = {}, sort = true, searchableValue = "" }) {
  debug("Creating toggle list:", label, items);

  const toggle = document.createElement("span");
  toggle.className = "tag-label tag-toggle clickable-toggle";
  toggle.innerHTML = `${label} (${items.length}) <span class="chevron">▼</span>`;

  const wrapper = document.createElement("div");
  wrapper.className = "cart-wrapper";

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
// UPDATE SAVED PANEL
// ==============================
function updateSavedPanel() {
  debug("Updating saved panel");
  const panel = document.querySelector("#optimization-saved-panel .panel-body");
  panel.innerHTML = "";

  const cards = Array.from(savedItems.values()).map(entry => entry.card).reverse();
  debug("Saved cards:", cards.length);

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
// TOGGLE SAVE STATE
// ==============================
function toggleSaveItem(card, base, matching) {
  debug("Toggling saved item:", base.Num);
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
// CREATE OPTIMIZATION ITEM CARD
// ==============================
function createOptimizationItemCard(matching, base, currentSearch, currentFilter) {
  debug("Creating card for:", base.Num, "Matches:", matching.length);
  const card = document.createElement("div");
  card.className = "panel-card";

  const firstBin = matching.length === 1 ? matching[0].Bin : null;

  const numberHTML = `<span class="clickable-stat" data-search="${base.Num}" ${firstBin ? `data-filter="${firstBin}"` : ""}>
    ${highlightMatch(base.Num, currentSearch)}
  </span>`;

  const descHTML = highlightMatch(base.Description || "", currentSearch);
  const binInfo = matching.length === 1 && matching[0].Bin
    ? `<span class="tag-label">Bin:</span> ${highlightMatch(matching[0].Bin, currentSearch)}`
    : "";

  const ropLine = base.ROP ? `<span class="tag-label">Current ROP:</span> ${base.ROP}` : "";
  const roqLine = base.ROQ ? `<span class="tag-label">Current ROQ:</span> ${base.ROQ}` : "";
  const sropLine = base.SROP ? `<span class="tag-label">Suggested ROP:</span> ${base.SROP}` : "";
  const sroqLine = base.SROQ ? `<span class="tag-label">Suggested ROQ:</span> ${base.SROQ}` : "";

  const detailsHTML = joinAsDivs(
    `<span class="tag-label">Stores Number:</span> ${numberHTML}`,
    descHTML,
    binInfo,
    ropLine,
    roqLine,
    sropLine,
    sroqLine
  );

  const infoBlock = document.createElement("div");
  infoBlock.innerHTML = detailsHTML;
  card.appendChild(infoBlock);

  card.addEventListener("dblclick", () => {
    toggleSaveItem(card, base, matching);
  });

  const uniqueCarts = [...new Set(matching.map(item => item.Bin))];
  debug("Unique carts for", base.Num, uniqueCarts);

  if (currentFilter === "all") {
    if (uniqueCarts.length === 1) {
      const pill = document.createElement("span");
      pill.className = "clickable-match";
      pill.textContent = uniqueCarts[0];
      pill.setAttribute("data-filter", uniqueCarts[0]);
      pill.setAttribute("data-search", base.Num);
      card.appendChild(pill);
    } else if (uniqueCarts.length > 1) {
      const { toggle, wrapper } = createToggleList({
        label: "Carts",
        items: uniqueCarts,
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
// POPULATE OPTIMIZATION RESULTS
// ==============================
export function populateOptimizationStats(results) {
  debug("Populating stats — total results:", results.length);

  const box = document.getElementById("optimization-stats");
  if (!box) return console.warn("[OPT_STATS] Missing #optimization-stats container");

  const input = document.getElementById("optimization-search");
  const currentSearch = input?.value.trim().toLowerCase() || "";

  const filterInput = document.getElementById("opsh-filter");
  const currentFilter = filterInput?.value.trim().toLowerCase() || "all";

  debug("Current search:", currentSearch, "Current filter:", currentFilter);

  box.innerHTML = "";

  const uniqueNums = [...new Set(results.map(item => item.Num))].sort();
  debug("Unique item numbers:", uniqueNums.length, uniqueNums.slice(0, 5));

  const summary = document.createElement("div");
  summary.className = "panel-card";
  summary.innerHTML = `<div><span class="tag-label">Results:</span> ${results.length} <span class="tag-label">Unique:</span> ${uniqueNums.length}</div>`;
  box.appendChild(summary);

  const fragment = document.createDocumentFragment();

  for (const num of uniqueNums) {
    const matching = results.filter(r => r.Num === num);
    if (!matching.length) {
      debug(`No matches found for item: ${num}`);
      continue;
    }

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
