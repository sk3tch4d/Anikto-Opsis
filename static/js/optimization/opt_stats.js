// ==============================
// OPT_STATS.JS
// ==============================

import { clearTextSelect, setupParseStats, highlightMatch } from "../search-utils.js";
import { showToast, hapticFeedback, attachChevron, joinAsDivs } from '../ui-utils.js';
import { scrollPanel } from '../panels/panels_core.js';
import { createSavedCardToggle, createSavedCardUpdater } from '../cards/saved_card.js';

// ==============================
// DEBUG TOGGLE
// ==============================
const DEBUG_MODE = localStorage.getItem("DEBUG_MODE") === "true";

function debug(...args) {
  if (DEBUG_MODE) console.debug("[OPT_STATS]", ...args);
}

// ==============================
// SAVED CARDS SETUP
// ==============================
const savedItems = window.savedItems = window.savedItems || new Map();

const updateSavedPanel = createSavedCardUpdater({
  selector: "#optimization-saved-panel .panel-body",
  savedItems,
  searchSetup: () => {
    setupParseStats(
      ".clickable-match, .clickable-stat",
      "optimization-search",
      "data-search",
      "opsh-filter",
      "data-filter"
    );
  }
});

const toggleSavedCard = createSavedCardToggle(savedItems, updateSavedPanel);

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
function createOptimizationItemCard(matching, base, currentSearch, currentFilter) {
  const card = document.createElement("div");
  card.className = "panel-card";

  const firstBin = matching.length === 1 ? matching[0].Bin : null;

  const numberHTML = `<span class="clickable-stat" data-search="${base.Num}" ${firstBin ? `data-filter="${firstBin}"` : ""}>
    ${highlightMatch(base.Num, currentSearch)}
  </span>`;

  const descHTML = `${highlightMatch(base.Description || "", currentSearch)}`;
  const ropqLine = `<span class="tag-label">Current ROP:</span> ${base.ROP ?? "–"} <span class="tag-label">ROQ:</span> ${base.ROQ ?? "–"}`;
  const sropqLine = `<span class="tag-label">Suggested ROP:</span> ${base.RROP ?? "–"} <span class="tag-label">ROQ:</span> ${base.RROQ ?? "–"}`;
  const mvtLine = `<span class="tag-label">Movements:</span> ${base.MVT ?? "–"}`;
  const groupLine = `<span class="tag-label">Group:</span> ${highlightMatch(base.Group || "", currentSearch)}`;

  const detailsHTML = joinAsDivs(
    `<span class="tag-label">Number:</span> ${numberHTML}`,
    descHTML,
    ropqLine,
    sropqLine,
    mvtLine,
    groupLine
  );

  const infoBlock = document.createElement("div");
  infoBlock.innerHTML = detailsHTML;
  card.appendChild(infoBlock);

  card.addEventListener("dblclick", () => {
    toggleSavedCard(card, base, matching);
  });

  const uniqueBins = [...new Set(matching.map(item => item.Bin))];

  if (currentFilter === "all") {
    if (uniqueBins.length === 1) {
      const pill = document.createElement("span");
      pill.className = "clickable-match";
      pill.textContent = uniqueBins[0];
      pill.setAttribute("data-filter", uniqueBins[0]);
      pill.setAttribute("data-search", base.Bin);
      card.appendChild(pill);
    } else if (uniqueBins.length > 1) {
      const { toggle, wrapper } = createToggleList({
        label: "Bins",
        items: uniqueBins,
        itemAttributes: {
          "data-filter": bin => bin,
        },
        searchableValue: base.Bin
      });
      card.appendChild(toggle);
      card.appendChild(wrapper);
    }
  }

  return card;
}

// ==============================
// MAIN STAT POPULATOR FUNCTION
// ==============================
export function populateOptimizationStats(results) {
  debug("Populating stats — total results:", results.length);

  const statsBox = document.getElementById("optimization-stats");
  if (!statsBox) return;

  statsBox.innerHTML = "";

  const searchInput = document.getElementById("optimization-search");
  const currentSearch = searchInput?.value.trim() || "";

  const filterInput = document.getElementById("opsh-filter");
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
    matchesToggle.innerHTML = `Items (${uniqueNums.length}) <span class="chevron">▼</span>`;

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
    const card = createOptimizationItemCard(matching, base, currentSearch, currentFilter);
    fragment.appendChild(card);
  });

  if (!uniqueNums.length) {
    const noResults = document.createElement("div");
    noResults.className = "no-results";
    noResults.textContent = "No results found.";
    fragment.appendChild(noResults);
  }

  statsBox.appendChild(fragment);

  // Run AFTER next paint to ensure toggles are in DOM
  requestAnimationFrame(() => attachChevron({ root: statsBox, chevronColor: "#0a0b0f" }));

  setTimeout(() => {
    const header = document.querySelector('#optimization-search-panel .panel-header');
    if (header) scrollPanel(header);
  }, 100);

  setupParseStats(".clickable-match, .clickable-stat", "optimization-search", "data-search", "opsh-filter", "data-filter");
}

window.populateOptimizationStats = populateOptimizationStats;
