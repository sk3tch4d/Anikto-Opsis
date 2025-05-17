// ==============================
// RESULTS.JS
// Render Search Result Entries
// ==============================

import { getStatusDot } from '../statusdot.js';
import { scrollPanelBody } from '../panels.js';

// ==============================
// RENDER MATCHED RESULTS
// ==============================
export function renderResults(matches) {
  console.log("Rendering", matches.length, "results");

  const resultsDiv = document.getElementById("seniority-results");

  // Clear previous content
  resultsDiv.innerHTML = "";

  if (!matches || matches.length === 0) {
    resultsDiv.innerHTML = "<p>No matching entries found.</p>";
    return;
  }

  // ====== Add the "Results: X" delta at the top ======
  const delta = document.createElement("div");
  delta.className = "panel-delta";
  delta.style.marginBottom = "8px";
  delta.innerHTML = `
    <div class="delta-item">
      <span>Results:</span>
      <span>${matches.length}</span>
    </div>
  `;
  resultsDiv.appendChild(delta);

  // ====== Render matching results ======
  matches.forEach(row => {
    const first = row["First Name"] || "";
    const last = row["Last Name"] || "";
    const position = row["Position"] || "";
    const department = row["Department"] || "";
    const status = row["Status"] || "";
    const note = row["Note"] || "";
    const years = parseFloat(row["Years"] || 0);
    const statusDot = getStatusDot({ note, status });

    const card = document.createElement("div");
    card.className = "panel-card";
    card.innerHTML = `
      <strong>${first} ${last}</strong><br>
      ${statusDot} ${status} ${note}<br>
      <em>${position} - ${department}</em><br>
      ${years.toFixed(2)} Years
    `;

    resultsDiv.appendChild(card);
  });

  // Reset scroll
  scrollPanelBody();
}
