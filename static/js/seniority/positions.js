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

      // Helper: adjust a single position string
      function adjustPosition(raw, adjustments) {
        return raw
          .replace(/\b(PT|FT|CASUAL|CAS|HOLD)\b/gi, "") // remove non-position terms
          .split(/[\s\-]+/) // split on spaces/dashes
          .filter(Boolean)
          .map(token => adjustments[token.toUpperCase()] || token)
          .join(" ");
      }

      data.forEach(row => {
        const raw = row["Position"] || "";

        // Process each role chunk separated by dashes
        const roles = raw.split("-").map(role => adjustPosition(role, posAdjustments));

        roles.forEach(role => {
          const normalized = normalize(role);
          if (!normalized) return;

          // Log suspicious entries
          if (normalized.length > 100 || /[^a-zA-Z0-9\s\.\-\/&]/.test(normalized)) {
            console.warn("Suspicious normalized position:", raw, "→", normalized);
          }

          positionMap[normalized] = (positionMap[normalized] || 0) + 1;
        });
      });

      // Clear existing and populate sorted positions
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
    })
    .catch(err => {
      console.error("Failed to load pos_adjust.json", err);
    });
}

