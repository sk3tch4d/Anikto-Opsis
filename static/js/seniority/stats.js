// ==============================
// STATS.JS
// Global + Filtered Statistics
// ==============================

import { setupParseStats, searchFromStat } from "../search-utils.js";
import { renderResults } from './results.js';

// ==============================
// GLOBAL STATS (ALL ENTRIES)
// ==============================
export function populateGlobalStats() {
  const statsDiv = document.getElementById("seniority-stats-global");
  const data = window.seniorityData || [];
  if (!statsDiv || !data.length) return;

  let total = 0;
  let totalYears = 0;
  let fullTime = 0;
  let partTime = 0;
  let casual = 0;  
  let tenPlus = 0, twentyPlus = 0, thirtyPlus = 0, fortyPlus = 0;
  const departments = new Set();

  data.forEach(row => {
    const position = row["Position"] || "";
    const status = (row["Status"] || "").toLowerCase();
    const years = parseFloat(row["Years"] || 0);

    const dept = position.split("-")[0].trim();
    if (dept) departments.add(dept);

    if (status.includes("full")) fullTime++;
    if (status.includes("part")) partTime++;
    if (status.includes("casu")) casual++;

    total++;
    totalYears += years;
    if (years >= 10) tenPlus++;
    if (years >= 20) twentyPlus++;
    if (years >= 30) thirtyPlus++;
    if (years >= 40) fortyPlus++;
  });

  totalYears = parseFloat(totalYears.toFixed(2));
  const avgYears = total > 0 ? parseFloat((totalYears / total).toFixed(2)) : 0;

  statsDiv.innerHTML = "";

  function createStatCard(label, value, filterName = null) {
    const card = document.createElement("div");
    card.className = "clickable-stat";
    if (filterName) card.dataset.name = filterName;

    card.innerHTML = `
      <div class="panel-delta">
        <div class="delta-item">
          <span>${label}</span>
          <span>${value}</span>
        </div>
      </div>
    `;
    return card;
  }

  statsDiv.appendChild(createStatCard("Total Departments", departments.size));
  statsDiv.appendChild(createStatCard("Total Employees", total));
  statsDiv.appendChild(createStatCard("Total Full-Time", fullTime, "Full-Time"));
  statsDiv.appendChild(createStatCard("Total Part-Time", partTime, "Part-Time"));
  statsDiv.appendChild(createStatCard("Total Casual", casual, "Casual"));
  statsDiv.appendChild(createStatCard("10+ Years", tenPlus, "10+"));
  statsDiv.appendChild(createStatCard("20+ Years", twentyPlus, "20+"));
  statsDiv.appendChild(createStatCard("30+ Years", thirtyPlus, "30+"));
  statsDiv.appendChild(createStatCard("40+ Years", fortyPlus, "40+"));
  statsDiv.appendChild(createStatCard("Average Years", avgYears));
  statsDiv.appendChild(createStatCard("Total Combined", totalYears));

  setupParseStats(".clickable-stat", "seniority-search", "data-name");
}


// ==============================
// FILTERED SEARCH STATS
// ==============================
export function populateStats(data) {
  const statsDiv = document.getElementById("seniority-stats");
  const searchInput = document.getElementById("seniority-search");
  const currentQuery = searchInput?.value.trim() || "(None)";

  if (!statsDiv || !data || !data.length) {
    statsDiv.innerHTML = "<p style='text-align: center;'>No data available.</p>";
    return;
  }

  let total = 0;
  let fullTime = 0;
  let partTime = 0;
  let casual = 0;
  let totalYears = 0;
  let mostSenior = { name: "", years: 0 };

  data.forEach(row => {
    const status = (row["Status"] || "").toLowerCase();
    const years = parseFloat(row["Years"] || 0);
    const name = `${row["First Name"] || ""} ${row["Last Name"] || ""}`.trim();

    if (status.includes("full")) fullTime++;
    if (status.includes("part")) partTime++;
    if (status.includes("casu")) casual++;

    total++;
    totalYears += years;

    if (years > mostSenior.years) {
      mostSenior = { name, years };
    }
  });

  const avgYears = (total > 0) ? (totalYears / total).toFixed(2) : "0.00";
  totalYears = totalYears.toFixed(2);

  statsDiv.innerHTML = "";

  const staticPanel = document.createElement("div");
  staticPanel.className = "panel-delta";
  staticPanel.innerHTML = `
    <div class="delta-item">
      <span>Filtered by</span>
      <span><em>${currentQuery}</em></span>
    </div>
    <div class="delta-item">
      <span>Total Employees</span>
      <span>${total}</span>
    </div>
  `;
  statsDiv.appendChild(staticPanel);

  function createStatCard(label, value, filterValue) {
    const card = document.createElement("div");
    card.className = "clickable-stat";
    card.dataset.name = filterValue;
    card.innerHTML = `
      <div class="panel-delta">
        <div class="delta-item">
          <span>${label}</span>
          <span>${value}</span>
        </div>
      </div>
    `;
    card.addEventListener("click", () => {
      searchFromStat("seniority-search", filterValue);
    });
    return card;
  }

  statsDiv.appendChild(createStatCard("Full-Time", fullTime, "Full-Time"));
  statsDiv.appendChild(createStatCard("Part-Time", partTime, "Part-Time"));
  statsDiv.appendChild(createStatCard("Casual", casual, "Casual"));

  const bottomPanel = document.createElement("div");
  bottomPanel.className = "panel-delta";
  bottomPanel.innerHTML = `
    <div class="delta-item">
      <span>Average Seniority</span>
      <span>${avgYears} Years</span>
    </div>
    <div class="delta-item">
      <span>Top Senior</span>
      <span>${mostSenior.name} — ${mostSenior.years.toFixed(2)} Years</span>
    </div>
    <div class="delta-item">
      <span>Total Combined</span>
      <span>${totalYears} Years</span>
    </div>
  `;
  statsDiv.appendChild(bottomPanel);
}

// ==============================
// REFINE FILTERED RESULTS
// ==============================
export function refineSearchFromStat(filter) {
  const current = window.currentSearchResults || [];
  if (!current.length) return;

  let refined;

  if (filter.startsWith("Years>=")) {
    const min = parseFloat(filter.split(">=")[1]);
    refined = current.filter(row => parseFloat(row["Years"] || 0) >= min);
  } else {
    refined = current.filter(row =>
      Object.values(row).some(val =>
        String(val || "").toLowerCase().includes(filter.toLowerCase())
      )
    );
  }

  window.currentSearchResults = refined;
  renderResults(refined);
  populateStats(refined);
}

// ==============================
// GLOBAL EXPORT
// ==============================
window.refineSearchFromStat = refineSearchFromStat;
window.populateStats = populateStats;
window.populateGlobalStats = populateGlobalStats;
