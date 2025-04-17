// ==============================
// SENIORITY.JS — Client-side Lookup Tool
// ==============================

export function initSenioritySearch() {
  const input = document.getElementById("seniority-search");
  const button = document.getElementById("seniority-search-button");

  if (!input || !button) return;

  button.style.display = "none";

  input.addEventListener("focus", () => {
    button.style.display = "block";
    input.value = ""; // Auto-clear
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

  input.value = "Supply Assistant";
  doSenioritySearch();
  populateMobileSelects(window.seniorityData || []);
}


// ==============================
// NORMALIZATION
// ==============================
function normalize(str) {
  return String(str || "")
    .toLowerCase()
    .replace(/[-_]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isMobile() {
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}


// ==============================
// SEARCH
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
  const isMob = isMobile();
  const input1 = normalize(
    (isMob
      ? document.getElementById("compare-select-1").value
      : document.getElementById("compare-input-1").value
    ).trim()
  );
  const input2 = normalize(
    (isMob
      ? document.getElementById("compare-select-2").value
      : document.getElementById("compare-input-2").value
    ).trim()
  );
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
      <li>
        <p style="text-align: left"><strong>Years:</strong> ${deltaYears.toFixed(2)}</p>
        <p style="text-align: left"><strong>Months:</strong> ${totalMonths.toFixed(1)}</p>
        <p style="text-align: left"><strong>Weeks:</strong> ${totalWeeks.toFixed(1)}</p>
        <p style="text-align: left"><strong>Days:</strong> ${totalDays.toFixed(0)}</p>
        <p style="text-align: left"><strong>Hours:</strong> ${totalHours.toFixed(0)}</p>
      </li>
    </ul>
  `;
}


// ==============================
// STATS
// ==============================
function populateStats(data) {
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
    const first = row["First Name"] || "";
    const last = row["Last Name"] || "";
    const position = row["Position"] || "";
    const status = row["Status"] || "";
    const years = parseFloat(row["Years"] || 0);
    const emoji = getSeniorityEmoji(status, position);

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


// ==============================
// MOBILE SELECT DROPDOWNS
// ==============================
function populateMobileSelects(data) {
  const select1 = document.getElementById("compare-select-1");
  const select2 = document.getElementById("compare-select-2");
  const input1 = document.getElementById("compare-input-1");
  const input2 = document.getElementById("compare-input-2");

  if (!select1 || !select2 || !input1 || !input2) return;
  if (!isMobile()) return;

  input1.style.display = "none";
  input2.style.display = "none";
  select1.style.display = "block";
  select2.style.display = "block";

  const options = data.map(row => {
    const name = `${row["First Name"] || ""} ${row["Last Name"] || ""}`.trim();
    return `<option value="${name}">${name}</option>`;
  });

  select1.innerHTML = `<option value="">Select first person</option>` + options.join("");
  select2.innerHTML = `<option value="">Select second person</option>` + options.join("");
}


// ==============================
// STATUS ICON LOGIC
// ==============================
function getSeniorityEmoji(status, position) {
  if ((position || "").toUpperCase().includes("HOLD")) return "🔴";
  if ((status || "").toLowerCase().includes("full")) return "🟢";
  if ((status || "").toLowerCase().includes("part")) return "🟡";
  return "⚪";
}
