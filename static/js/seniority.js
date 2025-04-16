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
    return;
  }

  const matches = data.filter(row =>
    Object.values(row).some(val =>
      normalize(val).includes(query)
    )
  );

  renderResults(matches);
}


// ==============================
// STATS PANEL POPULATION
// ==============================
function populateStats(data) {
  const statsDiv = document.getElementById("seniority-stats");
  if (!statsDiv || !data || !data.length) return;

  let total = 0;
  let fullTime = 0;
  let partTime = 0;
  let totalYears = 0;
  let mostSenior = { name: "", years: 0 };

  data.forEach(row => {
    const status = (row["Unnamed: 3"] || "").toLowerCase();
    const years = parseFloat(row["Unnamed: 4"] || 0);
    const name = `${row["Unnamed: 1"] || ""} ${row["CUPE Combined Seniority List"] || ""}`.trim();

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
    <strong>Total Employees:</strong> ${total}<br>
    <strong>Full-Time:</strong> ${fullTime}<br>
    <strong>Part-Time:</strong> ${partTime}<br>
    <strong>Average Seniority:</strong> ${avgYears} Years<br>
    <strong>Top Senior:</strong> ${mostSenior.name} — ${mostSenior.years.toFixed(2)} Years<br>
    <strong>Total Combined:</strong> ${totalYears.toFixed(2)} Years
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
