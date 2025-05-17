// ==============================
// POSITIONS.JS
// Position List Panel Logic (Cleaned)
// ==============================

import { searchFromStat } from '../search-utils.js';
import { toTitleCase } from './helpers.js';

// ==============================
// INIT POSITION PANEL
// ==============================
export function populatePositionList() {
  const container = document.getElementById("seniority-positions");
  const data = window.seniorityData || [];
  if (!container || !data.length) return;

  const positionMap = {};

  // Count frequency of already-normalized positions
  data.forEach(row => {
    const position = row["Position"]?.trim();
    if (!position) return;

    positionMap[position] = (positionMap[position] || 0) + 1;
  });

  // Clear and render sorted positions
  container.innerHTML = "";
  const sorted = Object.entries(positionMap).sort((a, b) => b[1] - a[1]);

  sorted.forEach(([pos, count]) => {
    const card = document.createElement("div");
    card.className = "clickable-delta";

    card.innerHTML = `
      <div class="panel-delta">
        <div class="delta-item">
          ${toTitleCase(pos)}
          <span>${count}</span>
        </div>
      </div>
    `;

    card.addEventListener("click", () => {
      searchFromStat("seniority-search", pos);
    });

    container.appendChild(card);
  });
}
