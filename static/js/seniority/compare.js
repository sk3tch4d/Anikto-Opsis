// ==============================
// COMPARE.JS
// Comparison Panel Logic
// ==============================

import { normalize } from './search.js';
import { getSeniorityEmoji } from './emoji.js';

// ==============================
// INIT COMPARE HANDLER
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
  const input1 = normalize(document.getElementById("compare-input-1")?.value.trim());
  const input2 = normalize(document.getElementById("compare-input-2")?.value.trim());
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

  resultsDiv.innerHTML = `
    <ul style="list-style: none; padding-left: 0;">
      ${renderListItem(match1)}
      ${renderListItem(match2)}
    </ul>
    ${renderDelta(match1, match2)}
  `;
}


// ==============================
// RENDER LIST ITEM
// ==============================
function renderListItem(row) {
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
}


// ==============================
// RENDER DELTA COMPARISON
// ==============================
function renderDelta(a, b) {
  const y1 = parseFloat(a["Years"] || 0);
  const y2 = parseFloat(b["Years"] || 0);
  const delta = Math.abs(y1 - y2);
  const days = delta * 365.25;
  const hours = days * 24;
  const months = delta * 12;
  const weeks = days / 7;

  return `
    <ul style="list-style: none; padding-left: 0; margin-top: 1.5rem;">
      <li><p><strong>Years:</strong> ${delta.toFixed(2)}</p></li>
      <li><p><strong>Months:</strong> ${months.toFixed(1)}</p></li>
      <li><p><strong>Weeks:</strong> ${weeks.toFixed(1)}</p></li>
      <li><p><strong>Days:</strong> ${days.toFixed(0)}</p></li>
      <li><p><strong>Hours:</strong> ${hours.toFixed(0)}</p></li>
    </ul>
  `;
}
