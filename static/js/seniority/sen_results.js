// ==============================
// RESULTS.JS
// Render Search Result Entries
// ==============================

import { getStatusDot } from '../statusdot.js';
import { scrollPanelBody } from '../panels.js';
import { handleCompareSlot } from './sen_compare.js';

// ==============================
// RENDER MATCHED RESULTS
// ==============================
export function renderResults(matches) {
  console.log("Rendering", matches.length, "results");

  const resultsDiv = document.getElementById("seniority-results");
  resultsDiv.innerHTML = "";

  if (!matches || matches.length === 0) {
    resultsDiv.innerHTML = "<p>No matching entries found.</p>";
    return;
  }

  const limit = 100;
  const limited = matches.slice(0, limit);

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

  limited.forEach(row => {
    const first = row["First Name"] || "";
    const last = row["Last Name"] || "";
    const position = row["Position"] || "";
    const department = row["Department"] ? ` - ${row["Department"]}` : "";
    const status = row["Status"] || "";
    const note = row["Note"] || "";
    const years = parseFloat(row["Years"] || 0);
    const union = row["Union"] || "";
    const statusDot = getStatusDot({ note, status });

    const card = document.createElement("div");
    card.className = "panel-card";
    card.innerHTML = `
      <strong>${first} ${last}</strong><br>
      ${statusDot} ${status} ${note}<br>
      <em>${position} ${department}</em><br>
      ${union} - ${years.toFixed(2)} Years
    `;

    let lastTap = 0;

    card.addEventListener("dblclick", () => handleCompareSlot(row));
    card.addEventListener("touchend", (e) => {
      const currentTime = new Date().getTime();
      const tapLength = currentTime - lastTap;
      if (tapLength < 300 && tapLength > 0) {
        handleCompareSlot(row);
        e.preventDefault(); // prevent simulated mouse events
      }
      lastTap = currentTime;
    });


    resultsDiv.appendChild(card);
  });

  if (matches.length > limit) {
    const panelDelta = document.createElement("div");
    panelDelta.className = "panel-delta";
  
    const footerDelta = document.createElement("div");
    footerDelta.className = "delta-item";
    footerDelta.innerHTML = `
      <span>Note:</span>
      <span>Only first ${limit} of ${matches.length} shown</span>
    `;
  
    panelDelta.appendChild(footerDelta);
    resultsDiv.appendChild(panelDelta);
  }

  scrollPanelBody();
}
