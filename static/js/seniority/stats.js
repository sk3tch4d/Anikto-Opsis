// ==============================
// STATS
// ==============================

import { normalize } from './search.js';

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
      <li><p class="clickable-stat" onclick="searchFromStat('Full-Time')"><strong>Total Full-Time:</strong> ${fullTime}</p></li>
      <li><p class="clickable-stat" onclick="searchFromStat('Part-Time')"><strong>Total Part-Time:</strong> ${partTime}</p></li>
      <li><p class="clickable-stat" onclick="searchFromStat('Years>=10')"><strong>10+ Years:</strong> ${tenPlus}</p></li>
      <li><p class="clickable-stat" onclick="searchFromStat('Years>=20')"><strong>20+ Years:</strong> ${twentyPlus}</p></li>
      <li><p class="clickable-stat" onclick="searchFromStat('Years>=30')"><strong>30+ Years:</strong> ${thirtyPlus}</p></li>
      <li><p class="clickable-stat" onclick="searchFromStat('Years>=40')"><strong>40+ Years:</strong> ${fortyPlus}</p></li>
      <li><p><strong>Average Years:</strong> ${avgYears}</p></li>
      <li><p><strong>Total Combined:</strong> ${totalYears}</p></li>
    </ul>
  `;
}


// ==============================
// FILTERED SEARCH STATS
// ==============================
export function populateStats(data) {
  const statsDiv = document.getElementById("seniority-stats");
  if (!statsDiv || !data || !data.length) {
    statsDiv.innerHTML = "<p style='text-align: center;'>No data available.</p>";
    return;
  }

  let total = 0;
  let fullTime = 0;
  let partTime = 0;
  let totalYears = 0;
  let mostSenior = { name: "", years: 0 };

  data.forEach(row => {
    const status = (row["Status"] || "").toLowerCase();
    const years = parseFloat(row["Years"] || 0);
    const name = `${row["First Name"] || ""} ${row["Last Name"] || ""}`.trim();

    if (status.includes("full")) fullTime++;
    if (status.includes("part")) partTime++;

    total++;
    totalYears += years;

    if (years > mostSenior.years) {
      mostSenior = { name, years };
    }
  });

  const avgYears = total > 0 ? (totalYears / total).toFixed(2) : "0.00";

  statsDiv.innerHTML = `
    <ul style="list-style: none; padding-left: 0;">
      <li><p style="text-align: center"><strong>Total Employees:</strong> ${total}</p></li>
      <li><p style="text-align: center"><strong>Full-Time:</strong> ${fullTime}</p></li>
      <li><p style="text-align: center"><strong>Part-Time:</strong> ${partTime}</p></li>
      <li><p style="text-align: center"><strong>Average Seniority:</strong> ${avgYears} Years</p></li>
      <li><p style="text-align: center"><strong>Top Senior:</strong> ${mostSenior.name} — ${mostSenior.years.toFixed(2)} Years</p></li>
      <li><p style="text-align: center"><strong>Total Combined:</strong> ${totalYears.toFixed(2)} Years</p></li>
    </ul>
  `;
}
