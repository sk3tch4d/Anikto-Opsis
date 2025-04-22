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
        const li = document.createElement("li");
        const p = document.createElement("p");
        p.className = "clickable-stat";
        const titleCasePos = toTitleCase(pos);
        p.innerHTML = `<strong>${titleCasePos}:</strong> ${count}`;
        p.addEventListener("click", () => {
          searchFromStat("seniority-search", pos);
        });
        li.appendChild(p);
        container.appendChild(li);
      });
    })
    .catch(err => {
      console.error("Failed to load pos_adjust.json", err);
    });
}
