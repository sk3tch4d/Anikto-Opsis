// ==============================
// POSITIONS.JS
// Position List Panel Logic
// ==============================
import { searchFromStat, normalize } from './search.js';
import posAdjustments from '/static/pos_adjust.json' assert { type: 'json' };

// ==============================
// INIT POSITION PANEL
// ==============================
export function populatePositionList() {
  const container = document.getElementById("seniority-positions");
  const data = window.seniorityData || [];
  if (!container || !data.length) return;

  const positionMap = {};

  data.forEach(row => {
    const raw = row["Position"] || "";

    let base = raw
      .split("-")[0]
      .replace(/\b(PT|FT|CASUAL|CAS|HOLD|)\b/gi, "")
      .trim();

    // Apply any replacements from JSON (case-insensitive matching)
    for (const [key, value] of Object.entries(posAdjustments)) {
      const pattern = new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      if (pattern.test(base)) {
        base = base.replace(pattern, value);
      }
    }

    // Convert abbreviation to full form if exact match after cleanup
    const upper = base.toUpperCase();
    if (posAdjustments[upper]) {
      base = posAdjustments[upper];
    }

    if (!base) return;
    positionMap[base] = (positionMap[base] || 0) + 1;
  });

  const sorted = Object.entries(positionMap).sort((a, b) => b[1] - a[1]);

  container.innerHTML = sorted.map(([pos, count]) => {
    return `<li><p class="clickable-stat" onclick="searchFromStat('${pos}')"><strong>${pos}:</strong> ${count}</p></li>`;
  }).join("");
}
