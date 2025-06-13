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

  let successCount = 0;

  data.forEach((item, index) => {
    try {
      console.log(`[🧱 Rendering Item #${index}]`, item);
  
      const card = document.createElement("div");
      card.className = "panel-card";
  
      const numStr = String(item.Num ?? "");
      let html = "";
  
      html += `<span class="tag-label">Number:</span> ${highlightMatch(numStr, term)}<br>`;
  
      if (item.Description?.trim?.()) {
        html += `${highlightMatch(item.Description, term)}<br>`;
      }
  
      const usl = item.USL?.trim?.() || "";
      const bin = item.Bin?.trim?.() || "";
      
      if (usl || bin) {
        html += `<span class="tag-label">Location:</span>`;
        if (usl) html += ` ${highlightMatch(usl, term)}`;
        if (bin) html += ` - ${highlightMatch(bin, term)}`;
        html += `<br>`;
      }

      if (item.ROP !== undefined || item.ROQ !== undefined) {
        if (item.ROP !== undefined) html += `<span class="tag-label">ROP:</span> ${item.ROP} `;
        if (item.ROQ !== undefined) html += `<span class="tag-label">ROQ:</span> ${item.ROQ}`;
        html += `<br>`;
      }
  
      if (item.Group?.trim?.()) {
        html += `<span class="tag-label">Group:</span> ${highlightMatch(item.Group, term)}<br>`;
      }
  
      card.innerHTML = html;
  
      card.addEventListener("dblclick", () => {
        window.dispatchEvent(new CustomEvent("optimization:save", { detail: item }));
      });

      // DEBUGGING
      if (!html.trim()) {
        console.warn("⚠️ Skipping empty card:", item);
        html = "<div>FORCED: No HTML content but data exists</div>";
      }
      
      resultsList.appendChild(card);
      successCount++;
  
    } catch (err) {
      console.error(`❌ [ERROR] Rendering item #${index} failed`, item, err);
    }
  });


  console.log(`✅ Successfully rendered ${successCount} of ${data.length} items`);

  scrollPanel(document.querySelector('#optimization-search-panel .panel-header'));
}

window.renderOptimizationResults = renderOptimizationResults;
