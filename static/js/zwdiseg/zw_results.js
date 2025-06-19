// ==============================
// ZW_RESULTS.JS
// ==============================

import { highlightMatch } from "../search-utils.js";
import { scrollPanel } from './panels/panels_core.js';
import { getStatusDot } from '../statusdot.js';
import { renderLine } from '../cards/results_card.js';

// ==============================
// MAIN RENDER FUNCTION
// ==============================
export function renderZwdisegResults(data, term, resultsList) {
  if (!Array.isArray(data) || !resultsList) return;
  if (data.length === 0) return;

  resultsList.innerHTML = "";

  data.forEach(item => {
    const card = document.createElement("div");
    card.className = "panel-card";

    const statusDot = getStatusDot({ valid: item.Valid });
    const changed = item.Changed === "X" ? "Yes" : "No";

    let html = "";

    html += renderLine("Material", item.Num, { term, highlight: true });
    html += renderLine("", item.Description, { term, highlight: true });

    html += renderLine([
      ["ROP", item.ROP],
      ["ROQ", item.ROQ]
    ], null, { joiner: " | " });

    html += renderLine([
      ["Counted", item.Counted],
      ["Consumed", item.Consumed]
    ]);

    html += `<span class="tag-label">Movement:</span> ${item.MVT} <span class="tag-label">Valid Scan:</span> ${statusDot}`;

    card.innerHTML = html;
    resultsList.appendChild(card);
  });

  const header = document.querySelector('#zwdiseg-search-panel .panel-header');
  scrollPanel(header);
}
