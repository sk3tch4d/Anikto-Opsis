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

  resultsList.innerHTML = ""; // clear previous results

  data.forEach(item => {
    const card = document.createElement("div");
    card.className = "panel-card";

    const numStr = String(item.Num ?? "");
    const oldStr = String(item.Old ?? "");

    // ==============================
    // BUILD NUMBER FIELD
    // ==============================
    let html = "";

    if (term) {
      const numMatch = numStr.toLowerCase().includes(term);
      const oldMatch = oldStr.toLowerCase().includes(term);

      if (numMatch || (!numMatch && !oldMatch)) {
        html += `<span class="tag-label">Number:</span> ${highlightMatch(numStr, term)}`;
        if (oldStr) html += ` &nbsp;&nbsp; <span class="tag-label">Old:</span> (${highlightMatch(oldStr, term)})`;
      } else if (oldMatch) {
        html += `<span class="tag-label">Old Number:</span> ${highlightMatch(oldStr, term)}`;
        if (numStr) html += ` &nbsp;&nbsp; <span class="tag-label">New:</span> (${highlightMatch(numStr, term)})`;
      }
    } else {
      html += `<span class="tag-label">Number:</span> ${numStr}`;
      if (oldStr) html += ` &nbsp;&nbsp; <span class="tag-label">Old:</span> ${oldStr}`;
    }

    html += `<br>`;

    // ==============================
    // OTHER FIELDS
    // ==============================
    if (item.Description?.trim()) {
      html += `${highlightMatch(item.Description, term)}<br>`;
    }
    // ===== USL / BIN
    if (item.USL?.trim() || item.Bin?.trim()) {
      html += `<span class="tag-label">Location:</span>`;
      if (item.USL?.trim()) html += ` ${highlightMatch(item.USL, term)}`;
      if (item.Bin?.trim()) html += ` - ${highlightMatch(item.Bin, term)}`;
      html += `<br>`;
    }
    // ===== ROP / ROQ
    if (item.ROP !== undefined && item.ROP !== null || item.ROQ !== undefined && item.ROQ !== null) {
      if (item.ROP !== undefined && item.ROP !== null) {
        html += `<span class="tag-label">ROP:</span> ${item.ROP} `;
      }
      if (item.ROQ !== undefined && item.ROQ !== null) {
        html += `<span class="tag-label">ROQ:</span> ${item.ROQ}`;
      }
      html += `<br>`;
    }
    // ===== QUANTITY
    if (item.QTY || item.UOM?.trim()) {
      html += `<span class="tag-label">Quantity:</span> ~${item.QTY}<br>`;
    }
    // ===== COST / UOM
    if (item.Cost !== undefined && item.Cost !== null && item.Cost !== "") {
      html += `<span class="tag-label">Cost:</span> ${item.Cost}`;
      if (item.UOM?.trim()) html += ` / ${highlightMatch(item.UOM, term)}`;
      html += `<br>`;
    }
    // ===== COST CENTER
    if (item.Cost_Center?.trim()) {
      html += `<span class="tag-label">Cost Center:</span> ${highlightMatch(item.Cost_Center, term)}<br>`;
    }
    // ===== GROUP
    if (item.Group?.trim()) {
      html += `<span class="tag-label">Group:</span> ${highlightMatch(item.Group, term)}`;
    }

    card.innerHTML = html;
    resultsList.appendChild(card);
  });

  // Adjust Search Window
  const header = document.querySelector('#optimization-search-panel .panel-header');
  scrollPanel(header);
}
