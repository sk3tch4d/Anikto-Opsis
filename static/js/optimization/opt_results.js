// ==============================
// OPT_RESULTS.JS
// ==============================

import { highlightMatch } from '../search-utils.js';
import { scrollPanel } from '../panels/panels_core.js';
import { renderLine } from '../cards/results_card.js';

// ==============================
// RENDER RESULTS
// ==============================
export function renderOptimizationResults(data, term, resultsList) {
  console.log("📦 renderOptimizationResults() called");
  console.log("🧾 Data received:", data);
  console.log("🔍 Term:", term);
  console.log("📥 Results container:", resultsList);

  if (!Array.isArray(data) || !resultsList) return;
  if (data.length === 0) return;

  resultsList.innerHTML = "";

  data.forEach(item => {
    const card = document.createElement("div");
    card.className = "panel-card";

    let html = "";

    html += renderLine("Number", item.Num, { term, highlight: true });
    html += renderLine("", item.Description, { term, highlight: true });
    html += renderLine("Location", item.Bin, { term, highlight: true });

    html += renderLine([["Current ROP", item.ROP], ["ROQ", item.ROQ]]);
    html += renderLine([["Suggested ROP", item.RROP], ["ROQ", item.RROQ]]);
    html += renderLine([["Usage Quart", item.CU1], ["Annual", item.CU2]]);
    html += renderLine([["CC Usage Quart", item.CC1], ["Annual", item.CC2]]);

    html += renderLine("Movements", item.MVT, { term, highlight: true });

    html += renderLine("Quantity", item.QTY, { prefix: "~" });
    
    html += renderLine([["Cost", item.Cost, item.UOM]], null, { joiner: " - " });

    html += renderLine("Cost Center", item.Cost_Center, { term, highlight: true });
    html += renderLine("Group", item.Group, { term, highlight: true });

    card.innerHTML = html;
    resultsList.appendChild(card);
  });

  const header = document.querySelector('#optimization-search-panel .panel-header');
  scrollPanel(header);
}
