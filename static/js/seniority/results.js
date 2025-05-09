// ==============================
// RESULTS.JS
// Render Search Result Entries
// ==============================
import { getStatusDot } from '../statusdot.js';

// ==============================
// RENDER MATCHED RESULTS
// ==============================
export function renderResults(matches) {
  console.log("Rendering", matches.length, "results");
  
  const resultsDiv = document.getElementById("seniority-results");
  if (!matches || matches.length === 0) {
    resultsDiv.innerHTML = "<p>No matching entries found.</p>";
    return;
  }

  let html = "";

  matches.forEach(row => {
    const first = row["First Name"] || "";
    const last = row["Last Name"] || "";
    const position = row["Position"] || "";
    const status = row["Status"] || "";
    const years = parseFloat(row["Years"] || 0);
    const statusDot = getStatusDot({ status, position });

    html += `
      <div class="panel-card">
        <strong>${first} ${last}</strong><br>
        ${statusDot} ${status}<br>
        <em>${position}</em><br>
        ${years.toFixed(2)} Years
      </div>
    `;
  });

  resultsDiv.innerHTML = html;
  resultsDiv.scrollTop = 0;
}

