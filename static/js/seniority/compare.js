// ==============================
// COMPARE.JS
// Comparison Panel Logic
// ==============================

import { normalize } from './search.js';
import { getStatusDot } from '../statusdot.js';

// ==============================
// NAME MATCHING UTILITY
// ==============================
function findPersonByName(name) {
  return (window.seniorityData || []).find(row =>
    normalize(`${row["First Name"]} ${row["Last Name"]}`) === normalize(name)
  );
}

// ==============================
// SETUP AND VALIDATION
// ==============================
export function initComparisonPanel() {
  const input1 = document.getElementById("compare-input-1");
  const input2 = document.getElementById("compare-input-2");
  const resultsDiv = document.getElementById("compare-results");

  const updateUI = () => {
    const name1 = input1.value.trim();
    const name2 = input2.value.trim();
    const match1 = findPersonByName(name1);
    const match2 = findPersonByName(name2);

    const valid1 = !!match1;
    const valid2 = !!match2;

    input1.classList.toggle("input-error", !valid1 && name1 !== "");
    input2.classList.toggle("input-error", !valid2 && name2 !== "");

    if (!valid1 && !valid2) {
      resultsDiv.innerHTML = "";
      return;
    }

    let html = "<ul style='list-style: none; padding-left: 0;'>";

    if (valid1) html += renderListItem(match1);
    if (valid2) html += renderListItem(match2);

    html += "</ul>";

    if (valid1 && valid2) {
      html += renderDelta(match1, match2);
    }

    resultsDiv.innerHTML = html;
  };

  input1.addEventListener("input", updateUI);
  input2.addEventListener("input", updateUI);
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
  const statusDot = getStatusDot(status, position);

  return `
    <li style="margin-bottom: 1.5em;">
      <strong>${first} ${last}</strong><br>
      ${statusDot} ${status}<br>
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
