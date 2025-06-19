// ==============================
// INV_RESULTS.JS — Inventory Result Renderer
// ==============================

import { highlightMatch } from "../search-utils.js";
import { scrollPanel } from '../panels/panels_core.js';
import { renderLine } from '../cards/results_card.js';

// ==============================
// MAIN RENDER FUNCTION
// ==============================
export function renderInventoryResults(data, term, resultsList) {
  if (!Array.isArray(data) || !resultsList) return;
  if (data.length === 0) return;

  resultsList.innerHTML = "";

  data.forEach(item => {
    const card = document.createElement("div");
    card.className = "panel-card";

    const numStr = String(item.Num ?? "");
    const oldStr = String(item.Old ?? "");

    let html = "";

    // ==============================
    // NUMBER / OLD NUMBER LOGIC
    // ==============================
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
    // RENDER LINES
    // ==============================
    html += renderLine("", item.Description, { term, highlight: true });

    html += renderLine([
      ["Location", item.USL, item.Bin]
    ], null, { joiner: " - " });

    html += renderLine([
      ["ROP", item.ROP],
      ["ROQ", item.ROQ]
    ]);

    html += renderLine("Quantity", item.QTY, { prefix: "~" });

    html += renderLine([
      ["Cost", item.Cost, item.UOM]
    ]);

    html += renderLine("Cost Center", item.Cost_Center, { term, highlight: true });
    html += renderLine("Group", item.Group, { term, highlight: true });

    card.innerHTML = html;
    resultsList.appendChild(card);
  });

  const header = document.querySelector('#inventory-search-panel .panel-header');
  scrollPanel(header);
}
