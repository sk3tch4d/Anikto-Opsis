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

  statsDiv.innerHTML = `
    <ul style="list-style: none; padding-left: 0;">
      <li><p><strong>Total Departments:</strong> ${departments.size}</p></li>
      <li><p><strong>Total Employees:</strong> ${total}</p></li>
      <li><p class="clickable-stat" data-name="Full-Time"><strong>Total Full-Time:</strong> ${fullTime}</p></li>
      <li><p class="clickable-stat" data-name="Part-Time"><strong>Total Part-Time:</strong> ${partTime}</p></li>
      <li><p class="clickable-stat" data-name="Casual"><strong>Total Casual:</strong> ${casual}</p></li>
      <li><p class="clickable-stat" data-name="10+"><strong>10+ Years:</strong> ${tenPlus}</p></li>
      <li><p class="clickable-stat" data-name="20+"><strong>20+ Years:</strong> ${twentyPlus}</p></li>
      <li><p class="clickable-stat" data-name="30+"><strong>30+ Years:</strong> ${thirtyPlus}</p></li>
      <li><p class="clickable-stat" data-name="40+"><strong>40+ Years:</strong> ${fortyPlus}</p></li>
      <li><p><strong>Average Years:</strong> ${avgYears}</p></li>
      <li><p><strong>Total Combined:</strong> ${totalYears}</p></li>
    </ul>
  `;

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

  const avgYears = total > 0 ? (totalYears / total).toFixed(2) : "0.00";
  
  statsDiv.innerHTML = `
    <div class="panel-delta">
      <div class="delta-item full-span"><strong>Filtered by:</strong><br><em>${currentQuery}</em></div>
      <div class="delta-item full-span"><strong>Total Employees:</strong><br>${total}</div>
      <div class="delta-item full-span"><span class="clickable-stat" data-name="Full-Time"><strong>Full-Time:</strong>${fullTime}</span></div>
      <div class="delta-item full-span"><span class="clickable-stat" data-name="Part-Time"><strong>Part-Time:</strong>${partTime}</span></div>
      <div class="delta-item full-span"><span class="clickable-stat" data-name="Casual"><strong>Casual:</strong>${casual}</span></div>
      <div class="delta-item full-span"><strong>Average Seniority:</strong><br>${avgYears} Years</div>
      <div class="delta-item full-span"><strong>Top Senior:</strong><br>${mostSenior.name} — ${mostSenior.years.toFixed(2)} Years</div>
      <div class="delta-item full-span"><strong>Total Combined:</strong><br>${totalYears.toFixed(2)} Years</div>
    </div>
  `;

  setupParseStats(".clickable-stat", "seniority-search", "data-name");
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
