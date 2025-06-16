// ==============================
// OPT_RESULTS.JS — Optimization Result Renderer
// ==============================

import { highlightMatch } from "../search-utils.js";
import { scrollPanel } from "../panels.js";

// ==============================
// MAIN RENDER FUNCTION
// ==============================
export function renderOptimizationResults(data, term, resultsList) {
  console.log("📦 renderOptimizationResults() called");
  console.log("🧾 Data received:", data);
  console.log("🔍 Term:", term);
  console.log("📥 Results container:", resultsList);

  if (!Array.isArray(data) || !resultsList) return;
  if (data.length === 0) return;

  resultsList.innerHTML = ""; // clear previous results

  data.forEach(item => {
    const card = document.createElement("div");
    card.className = "panel-card";

    const numStr = String(item.Num ?? "");

    // ==============================
    // BUILD NUMBER FIELD
    // ==============================
    let html = "";
    if (term) {
      const numMatch = numStr.toLowerCase().includes(term);
    
      html += `<span class="tag-label">Number:</span> ${highlightMatch(numStr, term)}`;
    } else {
      html += `<span class="tag-label">Number:</span> ${numStr}`;
    }
    html += `<br>`;

    // ==============================
    // OTHER FIELDS
    // ==============================
    if (item.Description?.trim()) {
      html += `${highlightMatch(item.Description, term)}<br>`;
    }
    // ===== CART / BIN
    if (item.Cart?.trim() || item.Bin?.trim()) {
      html += `<span class="tag-label">Location:</span>`;
      if (item.Cart?.trim()) html += ` ${item.Cart}`;
      if (item.Bin?.trim()) html += ` - ${highlightMatch(item.Bin, term)}`;
      html += `<br>`;
    }
    // ===== CURRENT ROP/ROQ
    if (item.ROP !== undefined && item.ROP !== null || item.ROQ !== undefined && item.ROQ !== null) {
      if (item.ROP !== undefined && item.ROP !== null) {
        html += `<span class="tag-label">Current ROP:</span> ${item.ROP} `;
      }
      if (item.ROQ !== undefined && item.ROQ !== null) {
        html += `<span class="tag-label">ROQ:</span> ${item.ROQ}`;
      }
      html += `<br>`;
    }
    // ===== SUGGESTED ROP/ROQ
    if ((item.RROP !== undefined && item.RROP !== null) || (item.RROQ !== undefined && item.RROQ !== null)) {
      if (item.RROP !== undefined && item.RROP !== null) {
        html += `<span class="tag-label">Suggested ROP:</span> ${item.RROP} `;
      }
      if (item.RROQ !== undefined && item.RROQ !== null) {
        html += `<span class="tag-label">ROQ:</span> ${item.RROQ}`;
      }
      html += `<br>`;
    }
    // ===== CART USAGE
    if ((item.CU1 !== undefined && item.CU1 !== null) || (item.CU2 !== undefined && item.CU2 !== null)) {
      if (item.CU1 !== undefined && item.CU1 !== null) {
        html += `<span class="tag-label">Usage Quart:</span> ${item.CU1} `;
      }
      if (item.CU2 !== undefined && item.CU2 !== null) {
        html += `<span class="tag-label">Anual:</span> ${item.CU2}`;
      }
      html += `<br>`;
    }
    // ===== COST CENTER USAGE
    if ((item.CC1 !== undefined && item.CC1 !== null) || (item.CC2 !== undefined && item.CC2 !== null)) {
      if (item.CC1 !== undefined && item.CC1 !== null) {
        html += `<span class="tag-label">CC Usage Quart:</span> ${item.CC1} `;
      }
      if (item.CC2 !== undefined && item.CC2 !== null) {
        html += `<span class="tag-label">Anual:</span> ${item.CU2}`;
      }
      html += `<br>`;
    }
    // ===== MOVEMENTS
    if (item.MVT != null) {
      html += `<span class="tag-label">Movements:</span> ${highlightMatch(String(item.MVT), term)}<br>`;
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
