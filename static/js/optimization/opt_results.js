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

    let html = "";

    html += `<span class="tag-label">Number:</span> ${highlightMatch(item.Num || "N/A", term)}<br>`;
    html += `<span class="tag-label">Description:</span> ${highlightMatch(item.Description || "", term)}<br>`;
    
    if (item.Bin?.trim()) {
      html += `<span class="tag-label">Bin:</span> ${highlightMatch(item.Bin, term)}<br>`;
    }

    if (item.SROP !== undefined) {
      html += `<span class="tag-label">ROP:</span> ${item.ROP}<br>`;
    }

    if (item.SROQ !== undefined) {
      html += `<span class="tag-label">ROQ:</span> ${item.ROQ}<br>`;
    }

    if (item.Cost !== undefined) {
      html += `<span class="tag-label">Cost:</span> ${item.Cost}`;
      if (item.UOM?.trim()) {
        html += ` / ${highlightMatch(item.UOM, term)}`;
      }
      html += `<br>`;
    }

    card.innerHTML = html;

    // Optional: double-click to save
    card.addEventListener("dblclick", () => {
      window.dispatchEvent(new CustomEvent("optimization:save", { detail: item }));
    });

    resultsList.appendChild(card);
  });

  const header = document.querySelector('#optimization-search-panel .panel-header');
  scrollPanel(header);
}
