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
  setupCompareValidation();
}

// ==============================
// NAME MATCHING UTILITY
// ==============================
function findPersonByName(name) {
  return (window.seniorityData || []).find(row =>
    normalize(`${row["First Name"]} ${row["Last Name"]}`) === normalize(name)
  );
}

// ==============================
// HANDLE COMPARISON
// ==============================
function handleComparison() {
  const input1 = document.getElementById("compare-input-1")?.value.trim();
  const input2 = document.getElementById("compare-input-2")?.value.trim();
  const resultsDiv = document.getElementById("compare-results");

  const match1 = findPersonByName(input1);
  const match2 = findPersonByName(input2);

  if (!input1 || !input2 || !match1 || !match2) {
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
// SETUP VALIDATION
// ==============================
function setupCompareValidation() {
  const input1 = document.getElementById("compare-input-1");
  const input2 = document.getElementById("compare-input-2");
  const button = document.getElementById("compare-button");

  const validateInputs = () => {
    const valid1 = !!findPersonByName(input1.value.trim());
    const valid2 = !!findPersonByName(input2.value.trim());
    button.disabled = !(valid1 && valid2);
    input1.classList.toggle("input-error", !valid1 && input1.value !== "");
    input2.classList.toggle("input-error", !valid2 && input2.value !== "");
  };

  input1.addEventListener("input", validateInputs);
  input2.addEventListener("input", validateInputs);
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
