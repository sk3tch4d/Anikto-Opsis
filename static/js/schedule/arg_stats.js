// ==============================
// ARG_STATS.JS
// ==============================

import { createBounceLoader, toggleLoadingState } from "../loading.js";

let bounceLoader;
let rankingsData = {
  weekly: [],
  period: [],
  total: []
};
let statsData = {
  total_hours_week: 0,
  top_day: '',
  top_day_hours: 0
};

// ==============================
// SET STATS DATA
// ==============================
export function setStatsData(data) {
  if (data.rankings) rankingsData = data.rankings;
  if (data.total_hours_week !== undefined) statsData.total_hours_week = data.total_hours_week;
  if (data.top_day) statsData.top_day = data.top_day;
  if (data.top_day_hours !== undefined) statsData.top_day_hours = data.top_day_hours;

  updateStatsDisplay(); // default view
}

// ==============================
// INIT STAT DROPDOWN
// ==============================
export function initStatDropdown() {
  const panelBody = document.querySelector("#arg-stat-panel .panel-body");
  bounceLoader = createBounceLoader(panelBody);

  const modeSelect = document.getElementById("stats-mode-select");
  const filterSelect = document.getElementById("emp-stats-filter");

  if (modeSelect) modeSelect.addEventListener("change", updateStatsDisplay);
  if (filterSelect) filterSelect.addEventListener("change", fetchStatsData);

  fetchStatsData(); // initial load
}

// ==============================
// UPDATE STATS DISPLAY
// ==============================
function updateStatsDisplay() {
  const mode = document.getElementById("stats-mode-select")?.value;
  const container = document.getElementById("stats-container");
  if (!mode || !container) return;

  container.innerHTML = "";

  if (mode === "stats") {
    const stat1 = document.createElement("div");
    stat1.className = "delta-item";
    stat1.innerHTML = `Total Hours This Week: <span>${statsData.total_hours_week}</span>`;

    const stat2 = document.createElement("div");
    stat2.className = "delta-item";
    stat2.innerHTML = `Top Day: <span>${statsData.top_day} (${statsData.top_day_hours} hours)</span>`;

    container.appendChild(stat1);
    container.appendChild(stat2);
  } else {
    if (!rankingsData[mode] || !rankingsData[mode].length) {
      container.innerHTML = `<div class="delta-item">No data available</div>`;
      return;
    }

    rankingsData[mode].forEach(([name, hours]) => {
      const div = document.createElement("div");
      div.className = "delta-item";
      div.innerHTML = `${name} <span>${hours} hours</span>`;
      container.appendChild(div);
    });
  }
}

// ==============================
// FETCH API STATS DATA
// ==============================
export async function fetchStatsData() {
  const container = document.getElementById("stats-container");

  toggleLoadingState(true, { show: [bounceLoader], hide: [container] });

  try {
    const filter = document.getElementById("emp-stats-filter")?.value || "all";
    const res = await fetch(`/api/arg_stats?filter=${filter}`);
    const data = await res.json();
    if (data.stats) setStatsData(data.stats);
  } catch (err) {
    console.error("Failed to fetch stats:", err);
  } finally {
    toggleLoadingState(false, { show: [bounceLoader], hide: [container] });
  }
}
