// ==============================
// ZW_STATS.JS 
// Zwdiseg Statistics Renderer
// ==============================

import { setupParseStats, highlightMatch } from "../search-utils.js";
import { getStatusDot } from '../statusdot.js';

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
// HELPER: SAFE GETTER w/ HIGHLIGHT
// ==============================
function safeHighlight(obj, key, currentSearch, label) {
  const val = obj?.[key];
  const safe = (val === undefined || val === null || val === "" || val === "NaT") ? "undefined" : val;
  return `<span class="tag-label">${label}:</span> ${highlightMatch(String(safe), currentSearch)}`;
}

// ==============================
// HELPER: CREATE ITEM CARD
// ==============================
function createZwdisegItemCard(matching, base, currentSearch, currentFilter) {
  const old = base.Old?.trim() ? ` (Old: ${base.Old})` : "";
  const totalQty = matching.reduce((sum, item) => sum + (item.New_QTY || 0), 0);
  const card = document.createElement("div");
  card.className = "panel-card";

  const detailsHTML = joinAsDivs(
    safeHighlight(base, "Num", currentSearch, "Stores Number"),
    safeHighlight(base, "Description", currentSearch, "Description"),
    safeHighlight(matching[0], "USL", currentSearch, "USL"),
    safeHighlight(base, "Name", currentSearch, "Name"),
    safeHighlight(base, "Cost_Center", currentSearch, "Cost Center"),
    `${safeHighlight(base, "Counted", currentSearch, "Counted")} ${safeHighlight(base, "Difference", currentSearch, "Difference")}`,
    `${safeHighlight(base, "ROP", currentSearch, "ROP")} ${safeHighlight(base, "ROQ", currentSearch, "ROQ")}`,
    safeHighlight(base, "MVT", currentSearch, "MVT"),
    safeHighlight(base, "Time", currentSearch, "Time")
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

  const totalChanged = results.filter(item => item.Changed === "X").length;
  const uniqueNums = [...new Set(results.map(item => item.Num))];
  const fragment = document.createDocumentFragment();

  const summaryContainer = document.createElement("div");
  summaryContainer.className = "panel-card";

  const liResults = document.createElement("div");
  const firstName = results[0]?.Name || "Unknown";
  const firstDate = results[0]?.Date || "Unknown";
  liResults.innerHTML = `
    <span class="tag-label">Date:</span> ${firstDate}&nbsp;
    <span class="tag-label">Scan:</span> ${firstName}<br>
    <span class="tag-label">Total:</span> ${results.length}&nbsp;
    <span class="tag-label">Valid:</span> ${totalChanged}
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
  setupParseStats();
}

// ==============================
// DEBUG HOOK FOR CONSOLE
// ==============================
window.populateZwdisegStats = populateZwdisegStats;
