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

    html += `<span class="tag-label">Number:</span> ${highlightMatch(item.material || "N/A", term)}<br>`;
    html += `<span class="tag-label">Description:</span> ${highlightMatch(item.material_description || "", term)}<br>`;
    
    if (item.bin?.trim()) {
      html += `<span class="tag-label">Bin:</span> ${highlightMatch(item.bin, term)}<br>`;
    }

    if (item.site_suggested_rop) {
      html += `<span class="tag-label">ROP:</span> ${item.site_suggested_rop}<br>`;
    }

    if (item.site_suggested_roq) {
      html += `<span class="tag-label">ROQ:</span> ${item.site_suggested_roq}<br>`;
    }

    if (item.ma_price !== undefined) {
      html += `<span class="tag-label">Cost:</span> ${item.ma_price}`;
      if (item.bun_of_measure?.trim()) {
        html += ` / ${highlightMatch(item.bun_of_measure, term)}`;
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

  // Scroll to panel
  const header = document.querySelector('#optimization-search-panel .panel-header');
  scrollPanel(header);
}
