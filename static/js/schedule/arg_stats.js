// ==============================
// ARG_STATS.JS
// ==============================

import { createBounceLoader, toggleLoadingState } from "../loading.js";
import { scrollPanel } from '../panels/panels_core.js'
import { parseDate, parseAndFormat } from "../utils/format_date.js";
import { formatName } from "./arg_helpers.js"

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

  statsData.total_hours_week = data.total_hours_week ?? 0;
  statsData.top_day = data.top_day || '';
  statsData.top_day_hours = data.top_day_hours ?? 0;
  statsData.unique_employees = data.unique_employees ?? 0;
  statsData.total_shifts = data.total_shifts ?? 0;
  statsData.avg_daily_hours = data.avg_daily_hours ?? 0;

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

  const topDayDate = parseDate(statsData.top_day);
  const formattedTopDay = topDayDate
    ? `${parseAndFormat(topDayDate, 'short-long', { relative: true })} (${statsData.top_day_hours} hours)`
    : `${statsData.top_day_hours} hours`;

  if (mode === "stats") {
    const stats = [
      [`Total Hours This Week`, statsData.total_hours_week],
      [`Top Day`, formattedTopDay],
      [`Unique Employees`, statsData.unique_employees],
      [`Total Shifts`, statsData.total_shifts],
      [`Avg Daily Hours`, statsData.avg_daily_hours]
    ];

    for (const [label, value] of stats) {
      const div = document.createElement("div");
      div.className = "delta-item";
      div.innerHTML = `${label}: <span>${value}</span>`;
      container.appendChild(div);
    }
  } else {
    if (!rankingsData[mode] || !rankingsData[mode].length) {
      container.innerHTML = `<div class="delta-item">No data available</div>`;
      return;
    }

    rankingsData[mode]
      .map(([rawName, hours]) => {
        const display = formatName(rawName);
        return { raw: rawName, display, hours };
      })
      .sort((a, b) => a.display.localeCompare(b.display))
      .forEach(({ raw, display, hours }) => {
        const div = document.createElement("div");
        div.className = "delta-item";
        div.setAttribute("data-name", raw);  // Use raw "Last, First"
        div.innerHTML = `${display} <span>${hours} hours</span>`;
        container.appendChild(div);
      });
  }

  scrollPanel();
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
