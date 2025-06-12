// ==============================
// OPT_RESULTS.JS — Optimization Result Renderer
// ==============================

import { highlightMatch } from "../search-utils.js";
import { scrollPanel } from "../panels.js";

// ==============================
// MAIN RENDER FUNCTION
// ==============================
export function renderOptimizationResults(data, term, resultsList) {
  if (!Array.isArray(data) || !resultsList) return;
  if (data.length === 0) return;

  console.log("🧪 Incoming data:", data);
  console.log("📍resultsList:", resultsList);

  resultsList.innerHTML = ""; // clear previous

  data.forEach(item => {
    const card = document.createElement("div");
    card.className = "panel-card";

    const numStr = String(item.Num ?? "");

    let html = "";

    // ==== Number Field
    if (term) {
      const numMatch = numStr.toLowerCase().includes(term);
      html += `<span class="tag-label">Number:</span> ${highlightMatch(numStr, term)}`;
    } else {
      html += `<span class="tag-label">Number:</span> ${numStr}`;
    }

    html += `<br>`;

    // ==== Description
    if (item.Description?.trim()) {
      html += `${highlightMatch(item.Description, term)}<br>`;
    }

    // ==== USL + Bin
    if (item.USL?.trim() || item.Bin?.trim()) {
      html += `<span class="tag-label">Location:</span>`;
      if (item.USL?.trim()) html += ` ${highlightMatch(item.USL, term)}`;
      if (item.Bin?.trim()) html += ` - ${highlightMatch(item.Bin, term)}`;
      html += `<br>`;
    }

    // ==== ROP/ROQ
    if (item.ROP !== undefined || item.ROQ !== undefined) {
      if (item.ROP !== undefined) html += `<span class="tag-label">ROP:</span> ${item.ROP} `;
      if (item.ROQ !== undefined) html += `<span class="tag-label">ROQ:</span> ${item.ROQ}`;
      html += `<br>`;
    }

    // ==== Group
    if (item.Group?.trim()) {
      html += `<span class="tag-label">Group:</span> ${highlightMatch(item.Group, term)}<br>`;
    }

    // ==== Confidence / Score
    if (item.Confidence !== undefined || item.Score !== undefined) {
      if (item.Confidence !== undefined) html += `<span class="tag-label">Confidence:</span> ${item.Confidence} `;
      if (item.Score !== undefined) html += `<span class="tag-label">Score:</span> ${item.Score}`;
      html += `<br>`;
    }

    // ==== Cost/UOM
    if (item.Cost !== undefined && item.Cost !== null) {
      html += `<span class="tag-label">Cost:</span> ${item.Cost}`;
      if (item.UOM?.trim()) html += ` / ${highlightMatch(item.UOM, term)}`;
      html += `<br>`;
    }

    card.innerHTML = html;

    // Enable save-on-double-click
    card.addEventListener("dblclick", () => {
      window.dispatchEvent(new CustomEvent("optimization:save", { detail: item }));
    });

    resultsList.appendChild(card);
  });

  scrollPanel(document.querySelector('#optimization-search-panel .panel-header'));
}
