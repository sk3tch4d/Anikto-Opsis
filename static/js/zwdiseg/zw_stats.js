// ==============================
// ZW_STATS.JS 
// Zwdiseg Statistics Renderer
// ==============================

import { setupParseStats, highlightMatch } from "../search-utils.js";

// ==============================
// DEBUG TOGGLE
// ==============================
const DEBUG_MODE = localStorage.getItem("DEBUG_MODE") === "true";

// ==============================
// GLOBAL: SAVED ITEMS
// ==============================
const savedItems = new Map();

// ==============================
// HELPER: SHOW TOAST
// ==============================
function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => {
    toast.classList.remove("show");
  }, 2000);
}

// ==============================
// HELPER: JOIN CONTENT <div>
// ==============================
function joinAsDivs(...lines) {
  return lines
    .filter(line => line && line.trim() !== "")
    .map(line => `<div class="zwdiseg-line">${line}</div>`)
    .join("");
}

// ==============================
// HELPER: HAPTIC FEEDBACK
// ==============================
function vibrateShort() {
  if (navigator.vibrate) navigator.vibrate(65);
}

// ==============================
// HELPER: CLEAR TEXT SELECTION
// ==============================
function clearTextSelection() {
  const sel = window.getSelection?.();
  if (sel && !sel.isCollapsed) sel.removeAllRanges();
}

// ==============================
// HELPER: ATTACH LOCAL TOGGLE HANDLERS
// ==============================
function attachLocalToggleHandlers(container) {
  container.querySelectorAll(".clickable-toggle").forEach(toggle => {
    toggle.addEventListener("click", () => {
      const wrapper = toggle.nextElementSibling;
      if (wrapper?.classList.contains("usl-wrapper")) {
        wrapper.classList.toggle("show");
        toggle.classList.toggle("toggle-open");
      }
    });
  });
}

// ==============================
// HELPER: UPDATE SAVED PANEL
// ==============================
function updateSavedPanel() {
  const savedPanel = document.querySelector("#zwdiseg-saved-panel .panel-body");
  savedPanel.innerHTML = "";
  const cards = Array.from(savedItems.values()).reverse();
  if (!cards.length) {
    savedPanel.innerHTML = "<p>No items saved yet.</p><br><br><p>Double click a tile to save!</p>";
    return;
  }
  cards.forEach(clone => {
    const freshClone = clone.cloneNode(true);
    attachLocalToggleHandlers(freshClone);
    savedPanel.appendChild(freshClone);
  });
}

// ==============================
// HELPER: TOGGLE SAVE ITEM
// ==============================
function toggleSaveItem(card, base) {
  if (savedItems.has(base.Num)) {
    savedItems.delete(base.Num);
    card.classList.remove("saved-card");
    showToast("Removed!");
  } else {
    savedItems.set(base.Num, card.cloneNode(true));
    card.classList.add("saved-card");
    showToast("Saved!");
  }
  vibrateShort();
  clearTextSelection();
  updateSavedPanel();
}

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
    Object.entries(itemAttributes).forEach(([attr, value]) => {
      span.setAttribute(attr, typeof value === "function" ? value(text) : value);
    });
    if (searchableValue) span.setAttribute("data-search", searchableValue);
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
// HELPER: SAFE GETTER
// ==============================
function safeGet(obj, key, fallback = "undefined") {
  const val = obj?.[key];
  return (val === undefined || val === null || val === "" || val === "NaT") ? fallback : val;
}

// ==============================
// HELPER: CREATE ITEM CARD
// ==============================
function createZwdisegItemCard(matching, base, currentSearch, currentFilter) {
  const old = base.Old?.trim() ? ` (Old: ${base.Old})` : "";
  const totalQty = matching.reduce((sum, item) => sum + (item.New_QTY || 0), 0);
  const card = document.createElement("div");
  card.className = "panel-card";

  const numberHTML = highlightMatch(base.Num + old, currentSearch);
  const descHTML = highlightMatch(safeGet(base, "Description"), currentSearch);

  const detailsHTML = joinAsDivs(
    `<span class="tag-label">Stores Number:</span> ${safeGet(base, "Num")}`,
    `<span class="tag-label">Description:</span> ${safeGet(base, "Description")}`,
    `<span class="tag-label">USL:</span> ${safeGet(matching[0], "USL")}`,
    `<span class="tag-label">Date:</span> ${safeGet(base, "Date")}`,
    `<span class="tag-label">Time:</span> ${safeGet(base, "Time")}`,
    `<span class="tag-label">Name:</span> ${safeGet(base, "Name")}`,
    `<span class="tag-label">Cost Center:</span> ${safeGet(base, "Cost_Center")}`,
    `<span class="tag-label">Counted:</span> ${safeGet(base, "Counted")}`,
    `<span class="tag-label">ROP:</span> ${safeGet(base, "ROP")}`,
    `<span class="tag-label">ROQ:</span> ${safeGet(base, "ROQ")}`,
    `<span class="tag-label">Difference:</span> ${safeGet(base, "Difference")}`,
    `<span class="tag-label">New QTY:</span> ${safeGet(base, "New_QTY")}`,
    `<span class="tag-label">MVT:</span> ${safeGet(base, "MVT")}`,
    `<span class="tag-label">Changed:</span> ${safeGet(base, "Changed") === "X" ? "Yes" : "No"}`
  );

  const infoBlock = document.createElement("div");
  infoBlock.innerHTML = detailsHTML;
  card.appendChild(infoBlock);
  card.addEventListener("dblclick", () => toggleSaveItem(card, base));
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

  const uniqueNums = [...new Set(results.map(item => item.Num))];
  const fragment = document.createDocumentFragment();

  const summaryContainer = document.createElement("div");
  summaryContainer.className = "panel-card";

  const liResults = document.createElement("div");
  liResults.innerHTML = `<span class="tag-label">Results:</span> ${results.length} <span class="tag-label">Unique:</span> ${uniqueNums.length}`;
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
  setupParseStats();
}

// ==============================
// DEBUG HOOK FOR CONSOLE
// ==============================
window.populateZwdisegStats = populateZwdisegStats;
