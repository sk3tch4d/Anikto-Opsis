// ==============================
// OPT_STATS.JS — Optimization Stats Renderer
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
// HELPER: TOGGLE SAVE
// ==============================
function toggleSaveItem(card, item) {
  const key = item.material;
  if (savedItems.has(key)) {
    savedItems.delete(key);
    card.classList.remove("saved-card");
    showToast("Removed");
  } else {
    const clone = card.cloneNode(true);
    savedItems.set(key, clone);
    card.classList.add("saved-card");
    showToast("Saved");
  }
  updateSavedPanel();
}

// ==============================
// HELPER: UPDATE SAVED PANEL
// ==============================
function updateSavedPanel() {
  const panel = document.querySelector("#optimization-saved-panel .panel-body");
  panel.innerHTML = "";

  if (!savedItems.size) {
    panel.innerHTML = "<p>No saved items yet.</p><p>Double click a card to save it!</p>";
    return;
  }

  for (const clone of savedItems.values()) {
    panel.appendChild(clone.cloneNode(true));
  }
}

// ==============================
// HELPER: CREATE ITEM CARD
// ==============================
function createOptimizationCard(item, searchTerm) {
  const card = document.createElement("div");
  card.className = "compare-card";

  card.innerHTML = `
    <div><strong>${highlightMatch(item.material, searchTerm)}</strong> — ${highlightMatch(item.material_description || "", searchTerm)}</div>
    <div><strong>Bin:</strong> ${highlightMatch(item.bin || "-", searchTerm)}</div>
    <div><strong>ROP:</strong> ${item.site_suggested_rop || "-"}</div>
    <div><strong>ROQ:</strong> ${item.site_suggested_roq || "-"}</div>
    <div><strong>Cost:</strong> ${item.ma_price || 0} / ${item.bun_of_measure || "EA"}</div>
  `;

  card.addEventListener("dblclick", () => toggleSaveItem(card, item));
  return card;
}

// ==============================
// MAIN RENDER FUNCTION
// ==============================
export function populateOptimizationStats(results) {
  const statsBox = document.getElementById("optimization-stats");
  if (!statsBox) return;

  statsBox.innerHTML = "";

  const searchInput = document.getElementById("optimization-search");
  const searchTerm = searchInput?.value?.trim().toLowerCase() || "";

  const summary = document.createElement("div");
  summary.className = "compare-card";
  summary.innerHTML = `<div><span class="tag-label">Results:</span> ${results.length}</div>`;
  statsBox.appendChild(summary);

  for (const item of results) {
    const card = createOptimizationCard(item, searchTerm);
    statsBox.appendChild(card);
  }

  if (!results.length) {
    const empty = document.createElement("div");
    empty.className = "no-results";
    empty.textContent = "No matching results.";
    statsBox.appendChild(empty);
  }

  setupParseStats();
}
