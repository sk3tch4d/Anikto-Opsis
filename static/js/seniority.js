// ==============================
// SENIORITY.JS — Client-side Lookup Tool
// ==============================

export function initSenioritySearch() {
  const input = document.getElementById("seniority-search");
  const button = document.getElementById("seniority-search-button");

  if (!input || !button) return;

  // ==============================
  // UI: Button visibility logic
  // ==============================
  button.style.display = "none";

  input.addEventListener("focus", () => {
    button.style.display = "block";
    input.value = "";  // Auto-clear
  });

  input.addEventListener("blur", () => {
    setTimeout(() => {
      button.style.display = "none";
    }, 100);
  });

  button.addEventListener("click", () => {
    doSenioritySearch();
    input.blur();
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      doSenioritySearch();
      input.blur();
    }
  });

  // ==============================
  // Auto-filter on load with predefined string
  // ==============================
  const defaultFilter = "Supply Assistant";
  input.value = defaultFilter;
  doSenioritySearch();
}


// ==============================
// NORMALIZATION HELPER
// ==============================
function normalize(str) {
  return String(str || "")
    .toLowerCase()
    .replace(/[-_]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}


// ==============================
// SEARCH FUNCTIONALITY
// ==============================
function doSenioritySearch() {
  const input = document.getElementById("seniority-search");
  const query = normalize(input.value.trim());

  const data = window.seniorityData || [];

  if (!query) {
    renderResults([]);
    populateStats([]);
    return;
  }

  const matches = data.filter(row =>
    Object.values(row).some(val =>
      normalize(val).includes(query)
    )
  );

  renderResults(matches);
  populateStats(matches);
}


// ==============================
// COMPARISON PANEL
// ==============================
document.addEventListener("DOMContentLoaded", () => {
  const compareBtn = document.getElementById("compare-button");
  if (compareBtn) {
    compareBtn.addEventListener("click", handleComparison);
  }
});

function handleComparison() {
  const input1 = normalize(document.getElementById("compare-input-1").value.trim());
  const input2 = normalize(document.getElementById("compare-input-2").value.trim());
  const resultsDiv = document.getElementById("compare-results");
  const data = window.seniorityData || [];

  if (!input1 || !input2) {
    resultsDiv.innerHTML = "<p>Please enter two names to compare.</p>";
    return;
  }

  const match1 = data.find(row => normalize(`${row["Unnamed: 1"]} ${row["CUPE Combined Seniority List"]}`).includes(input1));
  const match2 = data.find(row => normalize(`${row["Unnamed: 1"]} ${row["CUPE Combined Seniority List"]}`).includes(input2));

  if (!match1 || !match2) {
    resultsDiv.innerHTML = "<p>One or both entries not found.</p>";
    return;
  }

  const render = (row) => {
    const first = row["Unnamed: 1"] || "";
    const last = row["CUPE Combined Seniority List"] || "";
    const position = row["Unnamed: 2"] || "";
    const status = row["Unnamed: 3"] || "";
    const years = parseFloat(row["Unnamed: 4"] || 0);
    const emoji = status.toLowerCase().includes("full") ? "🟢" :
                  status.toLowerCase().includes("part") ? "🟡" : "⚪";

    return `
      <div style="flex: 1; text-align: center; padding: 1rem; border: 1px solid #3a3d42; border-radius: 8px; background-color: #2a2d33; margin: 0.5rem;">
        <strong>${first} ${last}</strong><br>
        ${emoji} ${status}<br>
        <em>${position}</em><br>
        ${years.toFixed(2)} Years
      </div>
    `;
  };

  resultsDiv.innerHTML = `
    <div style="display: flex; flex-direction: row; gap: 1rem; flex-wrap: wrap; justify-content: center;">
      ${render(match1)}
      ${render(match2)}
    </div>
  `;
}



// ==============================
// STATS PANEL POPULATION
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
    normalize(`${row["Unnamed: 1"]} ${row["CUPE Combined Seniority List"]}`).includes(input1)
  );

  const match2 = data.find(row =>
    normalize(`${row["Unnamed: 1"]} ${row["CUPE Combined Seniority List"]}`).includes(input2)
  );

  if (!match1 || !match2) {
    resultsDiv.innerHTML = "<p>One or both entries not found.</p>";
    return;
  }

  const renderListItem = (row) => {
    const first = row["Unnamed: 1"] || "";
    const last = row["CUPE Combined Seniority List"] || "";
    const position = row["Unnamed: 2"] || "";
    const status = row["Unnamed: 3"] || "";
    const years = parseFloat(row["Unnamed: 4"] || 0);
    const emoji = status.toLowerCase().includes("full") ? "🟢" :
                  status.toLowerCase().includes("part") ? "🟡" : "⚪";

    return `
      <li style="margin-bottom: 1.5em;">
        <strong>${first} ${last}</strong><br>
        ${emoji} ${status}<br>
        <em>${position}</em><br>
        ${years.toFixed(2)} Years
      </li>
    `;
  };

  const y1 = parseFloat(match1["Unnamed: 4"] || 0);
  const y2 = parseFloat(match2["Unnamed: 4"] || 0);
  const deltaYears = Math.abs(y1 - y2);
  const totalHours = deltaYears * 365.25 * 24;
  const totalDays = deltaYears * 365.25;
  const totalWeeks = totalDays / 7;
  const totalMonths = deltaYears * 12;

  resultsDiv.innerHTML = `
    <ul style="list-style: none; padding-left: 0; display: flex; gap: 2rem; justify-content: center; flex-wrap: wrap;">
      ${renderListItem(match1)}
      ${renderListItem(match2)}
    </ul>
    <ul style="list-style: none; padding-left: 0; margin-top: 2rem;">
      <li><p style="text-align: center"><strong>Difference:</strong></p></li>
      <li><p style="text-align: center">Years: ${deltaYears.toFixed(2)} </p></li>
      <li><p style="text-align: center">Months: ${totalMonths.toFixed(1)}</p></li>
      <li><p style="text-align: center">Weeks: ${totalWeeks.toFixed(1)}</p></li>
      <li><p style="text-align: center">Days: ${totalDays.toFixed(0)}</p></li>
      <li><p style="text-align: center">Hours ${totalHours.toFixed(0)}</p></li>
    </ul>
  `;
}



// ==============================
// RENDER RESULTS
// ==============================
function renderResults(matches) {
  const resultsDiv = document.getElementById("seniority-results");

  if (!matches || matches.length === 0) {
    resultsDiv.innerHTML = "<p>No matching entries found.</p>";
    return;
  }

  let html = "<ul style='list-style: none; padding-left: 0;'>";

  matches.forEach(row => {
    const first = row["Unnamed: 1"] || "";
    const last = row["CUPE Combined Seniority List"] || "";
    const position = row["Unnamed: 2"] || "";
    const status = row["Unnamed: 3"] || "";
    const years = parseFloat(row["Unnamed: 4"] || 0);
    const emoji = status.toLowerCase().includes("full") ? "🟢" :
                  status.toLowerCase().includes("part") ? "🟡" : "⚪";

    html += "<li style='margin-bottom: 1.5em;'>";
    html += `<strong>${first} ${last}</strong><br>`;
    html += `${emoji} ${status}<br>`;
    html += `<em>${position}</em><br>`;
    html += `${years.toFixed(2)} Years`;
    html += "</li>";
  });

  html += "</ul>";
  resultsDiv.innerHTML = html;
  resultsDiv.scrollTop = 0;
}
