// ==============================
// POSITIONS.JS
// Positions Panel Logic
// ==============================

window.populatePositionList = function () {
  const container = document.getElementById("seniority-positions");
  const data = window.seniorityData || [];
  if (!container || !data.length) return;

  const abbreviations = {
    "RPN": "Reg. Practical Nurse",
    "PCA": "Patient Care Assistant",
    "EA": "Environmental Assistant"
    // Extend as needed
  };

  const positionMap = {};

  data.forEach(row => {
    const raw = row["Position"] || "";
    let base = raw.split("-")[0]
      .replace(/\b(PT|FT|CAS)\b/gi, "") // Remove trailing job-type
      .trim();

    if (abbreviations[base.toUpperCase()]) {
      base = abbreviations[base.toUpperCase()];
    }

    if (!base) return;
    if (!positionMap[base]) positionMap[base] = 0;
    positionMap[base]++;
  });

  const sorted = Object.entries(positionMap).sort((a, b) => b[1] - a[1]);

  container.innerHTML = sorted.map(([pos, count]) => {
    return `<li><p class="clickable-stat" onclick="searchFromStat('${pos}')"><strong>${pos}:</strong> ${count}</p></li>`;
  }).join("");
};
