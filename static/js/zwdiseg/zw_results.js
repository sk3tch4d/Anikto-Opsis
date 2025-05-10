// ==============================
// ZW_RESULTS.JS
// Zwdiseg Result Renderer
// ==============================

import { highlightMatch } from "../search-utils.js";
import { scrollPanel } from '../panels.js';
import { getStatusDot } from '../statusdot.js';

// ==============================
// MAIN RENDER FUNCTION
// ==============================
export function renderZwdisegResults(data, term, resultsList) {
  if (!Array.isArray(data) || !resultsList) return;
  if (data.length === 0) return;

  resultsList.innerHTML = ""; // Clear previous results

  data.forEach(item => {
    const card = document.createElement("div");
    card.className = "panel-card";

    const num = String(item.Num ?? "");
    const desc = String(item.Description ?? "");
    const counted = item.Counted ?? "";
    const consumed = item.Consumed ?? "";
    const diff = item.Difference ?? "";
    const rop = item.ROP ?? "";
    const roq = item.ROQ ?? "";
    const changed = item.Changed === "X" ? "Yes" : "No";
    const mvt = item.MVT ?? "";
    const statusDot = getStatusDot({ mvt });
    
    let html = "";

    // Line 1: Material Number
    html += `<span class="tag-label">Material:</span> ${highlightMatch(num, term)}<br>`;

    // Line 2: Description
    html += `${highlightMatch(desc, term)}<br>`;

    // Line 3: ROP & ROQ
    html += `<span class="tag-label">ROP:</span> ${rop} | <span class="tag-label">ROQ:</span> ${roq}<br>`;

    // Line 4: Counted & Remaining
    html += `<span class="tag-label">Counted:</span> ${counted} <span class="tag-label">Consumed:</span> ${consumed}<br>`;

    // Line 5: Changed & MVT
    html += `<span class="tag-label">MVT:</span> ${mvt} ${statusDot}`;

    card.innerHTML = html;
    resultsList.appendChild(card);
  });

  // Adjust Search Window
  const header = document.querySelector('#zwdiseg-search-panel .panel-header');
  scrollPanel(header);
}
