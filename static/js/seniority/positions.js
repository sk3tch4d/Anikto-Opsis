// ==============================
// POSITIONS.JS
// Position List Panel Logic
// ==============================
import { searchFromStat } from '../search-utils.js'; // centralized function
import { normalize } from './search.js';
import { toTitleCase } from './helpers.js';

// ==============================
// INIT POSITION PANEL
// ==============================
export function populatePositionList() {
  const container = document.getElementById("seniority-positions");
  const data = window.seniorityData || [];
  if (!container || !data.length) return;

  fetch("/static/pos_adjust.json")
    .then(res => res.json())
    .then(posAdjustments => {
      const positionMap = {};

      data.forEach(row => {
        const raw = row["Position"] || "";

        let base = raw
          .split("-")[0]
          .replace(/\b(PT|FT|CASUAL|CAS|HOLD)\b/gi, "")
          .trim();

        // Apply replacements
        for (const [key, value] of Object.entries(posAdjustments)) {
          const pattern = new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
          base = base.replace(pattern, value);
        }

        base = normalize(base);
        if (!base) return;
        positionMap[base] = (positionMap[base] || 0) + 1;
      });

      // Clear existing list
      container.innerHTML = "";

      // Sort and build DOM elements
      const sorted = Object.entries(positionMap).sort((a, b) => b[1] - a[1]);
      sorted.forEach(([pos, count]) => {
      const card = document.createElement("div");
      card.className = "compare-card clickable-stat";
    
      card.innerHTML = `
        <div class="compare-delta">
          <div class="delta-item">${toTitleCase(pos)}<br>${count}</div>
        </div>
      `;
    
      card.addEventListener("click", () => {
        searchFromStat("seniority-search", pos);
      });
    
      container.appendChild(card);
    });
