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

  const abbreviations = {
    "RPN": "Registered Practical Nurse",
    "PCA": "Patient Care Assistant",
    "EA": "Environmental Assistant",
    "Asst": "Assistant",
    // Add more mappings here
  };

  const positionMap = {};

  data.forEach(row => {
    const raw = row["Position"] || "";

    let base = raw
      .split("-")[0]
      .replace(/\b(PT|FT|CASUAL|CAS|HOLD|)\b/gi, "") // Strip employment types / Remove Problem Chars
      .replace("Reg P", "Registered P") // Modify Problem Names
      .replace("Reg. P", "Registered P") // Modify Problem Names
      .replace("Enviro Serv", "Environmental") // Modify Problem Names
      .trim();

    // Convert abbreviation to full form
    const upper = base.toUpperCase();
    if (abbreviations[upper]) {
      base = abbreviations[upper];
    }

    if (!base) return;
    positionMap[base] = (positionMap[base] || 0) + 1;
  });

  const sorted = Object.entries(positionMap).sort((a, b) => b[1] - a[1]);

  container.innerHTML = sorted.map(([pos, count]) => {
    return `<li><p class="clickable-stat" onclick="searchFromStat('${pos}')"><strong>${pos}:</strong> ${count}</p></li>`;
  }).join("");
}
