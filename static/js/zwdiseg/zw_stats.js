// ==============================
// ZW_STATS.JS 
// ==============================

import { clearTextSelect, setupParseStats, highlightMatch } from "../search-utils.js";
import { getStatusDot } from '../statusdot.js';
import { showToast, hapticFeedback, attachChevron, joinAsDivs } from '../ui-utils.js';
import { createSavedCardToggle, createSavedCardUpdater } from '../cards/saved_card.js';

// ==============================
// DEBUG TOGGLE
// ==============================
const DEBUG_MODE = localStorage.getItem("DEBUG_MODE") === "true";

// ==============================
// SAVED CARDS SETUP
// ==============================
const savedItems = window.savedItems = window.savedItems || new Map();

const updateSavedPanel = createSavedCardUpdater({
  selector: "#zwdiseg-saved-panel .panel-body",
  savedItems
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
    Object.entries(itemAttributes).forEach(([attr, value]) => {
      span.setAttribute(attr, typeof value === "function" ? value(text) : value);
    });
    if (searchableValue) span.setAttribute("data-search", searchableValue);
    container.appendChild(span);
  });

  wrapper.appendChild(container);
  return { toggle, wrapper };
}

// ==============================
// HELPER: SAFE GETTER w/ HIGHLIGHT
// ==============================
function safeHighlight(obj, key, currentSearch, label) {
  const val = obj?.[key];
  const safe = (val === undefined || val === null || val === "" || val === "NaT") ? "undefined" : val;
  return `<span class="tag-label">${label}:</span> ${highlightMatch(String(safe), currentSearch)}`;
}

// ==============================
// HELPER: GET VALID PERCENTAGE
// ==============================
export function getValidPercentage(results) {
  const { valid, total } = results.reduce((acc, item) => {
    const val = String(item.Valid).toLowerCase();
    if (val === "true") acc.valid++;
    if (val === "true" || val === "false") acc.total++;
    return acc;
  }, { valid: 0, total: 0 });

  return total ? `${(valid / total * 100).toFixed(1)}%` : "0.0%";
}

// ==============================
// HELPER: CREATE ITEM CARD
// ==============================
function createZwdisegItemCard(matching, base, currentSearch, currentFilter) {
  const card = document.createElement("div");
  card.className = "panel-card";

  const statusDot = getStatusDot({ valid: base.Valid });
  const matchUSL = base.USL;

  const detailsHTML = joinAsDivs(
    `<span class="tag-label">USL:</span> ${matchUSL}&nbsp;&nbsp;${safeHighlight(base, "Num", currentSearch, "Material")}&nbsp;&nbsp;&nbsp;${statusDot}`,
    highlightMatch(base.Description || "", currentSearch),
    `${safeHighlight(base, "ROP", currentSearch, "ROP")}&nbsp;&nbsp;${safeHighlight(base, "ROQ", currentSearch, "ROQ")}`,
    `${safeHighlight(base, "Counted", currentSearch, "Counted")}&nbsp;&nbsp;${safeHighlight(base, "Consumed", currentSearch, "Consumed")}`,
    `<span class="tag-label">Movement:</span> ${highlightMatch(base.MVT || "", currentSearch)}`
  );

  const infoBlock = document.createElement("div");
  infoBlock.innerHTML = detailsHTML;
  card.appendChild(infoBlock);

  card.addEventListener("dblclick", () => toggleSavedCard(card, base));

  return card;
}

// ==============================
// MAIN STAT POPULATOR FUNCTION
// ==============================
export function populateZwdisegStats(results) {
  const statsBox = document.getElementById("zwdiseg-stats");
  if (!statsBox) return;

  statsBox.innerHTML = "";

  const searchInput = document.getElementById("zwdiseg-search");
  const currentSearch = searchInput?.value.trim() || "";

  const filterInput = document.getElementById("usl-filter");
  const currentFilter = filterInput?.value.trim().toLowerCase() || "all";

  const totalValid = results.filter(item => item.Valid === "true").length;
  const totalInvalid = results.filter(item => item.Valid === "false").length;
  const uniqueNums = [...new Set(results.map(item => item.Num))];

  const fragment = document.createDocumentFragment();

  const summaryContainer = document.createElement("div");
  summaryContainer.className = "panel-card";

  const firstName = results[0]?.Name || "Unknown";
  const firstDate = results[0]?.Date || "Unknown";

  const liResults = document.createElement("div");
  liResults.innerHTML = `
    <span class="tag-label">Date:</span> ${firstDate}&nbsp;&nbsp;
    <span class="tag-label">Scan:</span> ${firstName}<br>
    <span class="tag-label">Total:</span> ${results.length}&nbsp;&nbsp;
    <span class="tag-label">Valid:</span> ${totalValid}&nbsp;&nbsp;
    <span class="tag-label">Invalid:</span> ${totalInvalid}
  `;
  summaryContainer.appendChild(liResults);
  fragment.appendChild(summaryContainer);

  uniqueNums.forEach(num => {
    const matching = results.filter(r => r.Num === num);
    if (!matching.length) return;
    const base = matching[0];
    const card = createZwdisegItemCard(matching, base, currentSearch, currentFilter);
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

  setupParseStats();
}

window.populateZwdisegStats = populateZwdisegStats;
