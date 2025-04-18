// ==============================
// COMPARISON.JS
// Person-to-Person Comparison
// ==============================

import { normalize } from "./search.js";
import { getSeniorityEmoji } from "./emoji.js";

// ==============================
// COMPARISON INIT
// ==============================
export function initComparisonPanel() {
  const compareBtn = document.getElementById("compare-button");
  if (compareBtn) {
    compareBtn.addEventListener("click", handleComparison);
  }
}


// ==============================
// HANDLE COMPARISON
// ==============================
function handleComparison() {
  const input1 = normalize(document.getElementById("compare-input-1").value.trim());
  const input2 = normalize(document.getElementById("compare-input-2").value.trim());
  const resultsDiv = document.getElementById("compare-results");
  const data = window.seniorityData || [];

  if (!input1 || !input2) {
    resultsDiv.innerHTML = "<p>Please enter two names to compare.</p>";
    return;
  }

  const match1 = data.find(row =>
    normalize(`${row["First Name"]} ${row["Last Name"]}`).includes(input1)
  );
  const match2 = data.find(row =>
    normalize(`${row["First Name"]} ${row["Last Name"]}`).includes(input2)
  );

  if (!match1 || !match2) {
    resultsDiv.innerHTML = "<p>One or both entries not found.</p>";
    return;
  }

  const renderListItem = (row) => {
    const first = row["First Name"] || "";
    const last = row["Last Name"] || "";
    const position = row["Position"] || "";
    const status = row["Status"] || "";
    const years = parseFloat(row["Years"] || 0);
    const emoji = getSeniorityEmoji(status, position);

    return `
      <li style="margin-bottom: 1.5em;">
        <strong>${first} ${last}</strong><br>
        ${emoji} ${status}<br>
        <em>${position}</em><br>
        ${years.toFixed(2)} Years
      </li>
    `;
  };

  const y1 = parseFloat(match1["Years"] || 0);
  const y2 = parseFloat(match2["Years"] || 0);
  const deltaYears = Math.abs(y1 - y2);
  const totalHours = deltaYears * 365.25 * 24;
  const totalDays = deltaYears * 365.25;
  const totalWeeks = totalDays / 7;
  const totalMonths = deltaYears * 12;

  resultsDiv.innerHTML = `
    <ul style="list-style: none; padding-left: 0;">
      ${renderListItem(match1)}
      ${renderListItem(match2)}
    </ul>
    <ul style="list-style: none; padding-left: 0; margin-top: 1.5rem;">
      <li><p><strong>Years:</strong> ${deltaYears.toFixed(2)}</p></li>
      <li><p><strong>Months:</strong> ${totalMonths.toFixed(1)}</p></li>
      <li><p><strong>Weeks:</strong> ${totalWeeks.toFixed(1)}</p></li>
      <li><p><strong>Days:</strong> ${totalDays.toFixed(0)}</p></li>
      <li><p><strong>Hours:</strong> ${totalHours.toFixed(0)}</p></li>
    </ul>
  `;
}
