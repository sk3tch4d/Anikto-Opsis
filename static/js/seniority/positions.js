// ==============================
// POSITIONS.JS
// Position List Panel Logic
// ==============================
import { searchFromStat, normalize } from './search.js';

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
          .replace(/\b(PT|FT|CASUAL|CAS|HOLD|)\b/gi, "")
          .trim();

        // Apply replacements
        for (const [key, value] of Object.entries(posAdjustments)) {
          const pattern = new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");
          base = base.replace(pattern, value);
        }

        base = base.trim();
        if (!base) return;
        positionMap[base] = (positionMap[base] || 0) + 1;
      });

      const sorted = Object.entries(positionMap).sort((a, b) => b[1] - a[1]);

      container.innerHTML = sorted.map(([pos, count]) => {
        return `<li><p class="clickable-stat" onclick="searchFromStat('${pos}')"><strong>${pos}:</strong> ${count}</p></li>`;
      }).join("");
    })
    .catch(err => {
      console.error("Failed to load pos_adjust.json", err);
    });
}
