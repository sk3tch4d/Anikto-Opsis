// ==============================
// OPT_STATS.JS — Optimization Stats Renderer
// ==============================

import { setupParseStats, highlightMatch } from "../search-utils.js";
import { scrollPanel } from "../panels.js";
import { showToast } from '../ui-utils.js';

// ==============================
// DEBUG TOGGLE
// ==============================
const DEBUG_MODE = localStorage.getItem("DEBUG_MODE") === "true";

// ==============================
// GLOBAL: SAVED ITEMS
// ==============================
const savedItems = new Map();

// ==============================
// HELPER: UPDATE SAVED PANEL
// ==============================
function updateSavedPanel() {
  const panel = document.querySelector("#optimization-saved-panel .panel-body");
  panel.innerHTML = "";

  if (!savedItems.size) {
    panel.innerHTML = `<p>No saved items yet.</p><br><p>Double click to save a card.</p>`;
    return;
  }

  for (const clone of savedItems.values()) {
    panel.appendChild(clone.cloneNode(true));
  }
}

// ==============================
// HELPER: TOGGLE SAVED ITEM
// ==============================
function toggleSaveItem(card, item) {
  const key = item.num;
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
// HELPER: CARD CREATOR
// ==============================
function createCard(item, term) {
  const card = document.createElement("div");
  card.className = "panel-card";

  card.innerHTML = `
    <div><strong>${highlightMatch(item.Num, term)}</strong> — ${highlightMatch(item.Description || "", term)}</div>
    <div><strong>Bin:</strong> ${highlightMatch(item.Bin || "-", term)}</div>
    <div><strong>ROP:</strong> ${item.RROP || "-"}</div>
    <div><strong>ROQ:</strong> ${item.RROQ || "-"}</div>
    <div><strong>Cost:</strong> ${item.Cost || 0} / ${item.UOM || "EA"}</div>
  `;

  card.addEventListener("dblclick", () => toggleSaveItem(card, item));
  return card;
}

// ==============================
// MAIN EXPORT
// ==============================
export function populateOptimizationStats(results) {
  const box = document.getElementById("optimization-stats");
  if (!box) return;

  const input = document.getElementById("optimization-search");
  const term = input?.value.trim().toLowerCase() || "";

  box.innerHTML = "";

  const summary = document.createElement("div");
  summary.className = "panel-card";
  summary.innerHTML = `<div><span class="tag-label">Results:</span> ${results.length}</div>`;
  box.appendChild(summary);

  for (const row of results) {
    const card = createCard(row, term);
    box.appendChild(card);
  }

  if (!results.length) {
    const empty = document.createElement("div");
    empty.className = "no-results";
    empty.textContent = "No matching results.";
    box.appendChild(empty);
  }

  setupParseStats();
}
