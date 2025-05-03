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
// HELPER: TOAST
// ==============================
function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2000);
}

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
// HELPER: CARD CREATOR
// ==============================
function createCard(item, term) {
  const card = document.createElement("div");
  card.className = "compare-card";

  card.innerHTML = `
    <div><strong>${highlightMatch(item.material, term)}</strong> — ${highlightMatch(item.material_description || "", term)}</div>
    <div><strong>Bin:</strong> ${highlightMatch(item.bin || "-", term)}</div>
    <div><strong>ROP:</strong> ${item.site_suggested_rop || "-"}</div>
    <div><strong>ROQ:</strong> ${item.site_suggested_roq || "-"}</div>
    <div><strong>Cost:</strong> ${item.ma_price || 0} / ${item.bun_of_measure || "EA"}</div>
  `;

  card.addEventListener("dblclick", () => toggleSaveItem(card, item));
  return card;
}

// ==============================
// MAIN EXPORT
// ==============================
export function setupStats() {
  const box = document.getElementById("optimization-stats");
  if (!box || !window.optimizationData) return;

  const input = document.getElementById("optimization-search");
  const term = input?.value.trim().toLowerCase() || "";

  const list = window.optimizationData;

  box.innerHTML = "";

  const summary = document.createElement("div");
  summary.className = "compare-card";
  summary.innerHTML = `<div><span class="tag-label">Results:</span> ${list.length}</div>`;
  box.appendChild(summary);

  for (const row of list) {
    const card = createCard(row, term);
    box.appendChild(card);
  }

  if (!list.length) {
    const empty = document.createElement("div");
    empty.className = "no-results";
    empty.textContent = "No matching results.";
    box.appendChild(empty);
  }

  setupParseStats();
}
