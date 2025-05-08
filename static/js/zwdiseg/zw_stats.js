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
  if (navigator.vibrate) {
    navigator.vibrate(65);
  }
}

// ==============================
// HELPER: CLEAR TEXT SELECTION
// ==============================
function clearTextSelection() {
  if (window.getSelection) {
    const sel = window.getSelection();
    if (sel && !sel.isCollapsed) {
      sel.removeAllRanges();
    }
  } else if (document.selection) {
    document.selection.empty();
  }
}

// ==============================
// HELPER: ATTACH LOCAL TOGGLE HANDLERS
// ==============================
function attachLocalToggleHandlers(container) {
  container.querySelectorAll(".clickable-toggle").forEach(toggle => {
    toggle.addEventListener("click", () => {
      const wrapper = toggle.nextElementSibling;
      if (wrapper && wrapper.classList.contains("usl-wrapper")) {
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

  if (cards.length === 0) {
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
    const clone = card.cloneNode(true);
    savedItems.set(base.Num, clone);
    card.classList.add("saved-card");
    showToast("Saved!");
  }
  vibrateShort();
  clearTextSelection();
  updateSavedPanel();
}

// ==============================
// HELPER: CREATE ITEM CARD
// ==============================
function createZwdisegItemCard(matching, base, currentSearch, currentFilter) {
  const card = document.createElement("div");
  card.className = "panel-card";

  const changedVal = base.Changed?.toString().toLowerCase() === "x" ? "Yes" : "No";

  const detailsHTML = joinAsDivs(
    `<span class="tag-label">Stores Number:</span> ${highlightMatch(base.Num, currentSearch)}`,
    `<span class="tag-label">Description:</span> ${highlightMatch(base.Description, currentSearch)}`,
    `<span class="tag-label">USL:</span> ${base.USL || ""}`,
    `<span class="tag-label">Date:</span> ${base.Date || ""}`,
    `<span class="tag-label">Time:</span> ${base.Time || ""}`,
    `<span class="tag-label">Name:</span> ${base.Name || ""}`,
    `<span class="tag-label">Cost Center:</span> ${base.Cost_Center || ""}`,
    `<span class="tag-label">Counted:</span> ${base.Counted}`,
    `<span class="tag-label">ROP:</span> ${base.ROP}`,
    `<span class="tag-label">ROQ:</span> ${base.ROQ}`,
    `<span class="tag-label">Difference:</span> ${base.Difference}`,
    `<span class="tag-label">New QTY:</span> ${base.New_QTY}`,
    `<span class="tag-label">MVT:</span> ${base.MVT}`,
    `<span class="tag-label">Changed:</span> ${changedVal}`
  );

  const infoBlock = document.createElement("div");
  infoBlock.innerHTML = detailsHTML;
  card.appendChild(infoBlock);

  card.addEventListener("dblclick", () => {
    toggleSaveItem(card, base);
  });

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
  const currentFilter = (filterInput?.value.trim().toLowerCase()) || "all";

  const uniqueNums = [...new Set(results.map(item => item.Num))];
  const fragment = document.createDocumentFragment();

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

// DEBUG WINDOW CONSOLE HOOK
window.populateZwdisegStats = populateZwdisegStats;
