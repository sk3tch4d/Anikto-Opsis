// ==============================
// SENIORITY.JS — Client-side Lookup Tool
// ==============================

export function initSenioritySearch() {
  const button = document.getElementById("seniority-search-button");
  if (button) {
    button.addEventListener("click", doSenioritySearch);
  }
}


// ==============================
// SEARCH FUNCTIONALITY
// ==============================
function doSenioritySearch() {
  const input = document.getElementById("seniority-search");
  const resultsDiv = document.getElementById("seniority-results");
  const query = input.value.trim().toLowerCase();

  if (!query) {
    resultsDiv.innerHTML = "<p>Please enter a name to search.</p>";
    return;
  }

  const data = window.seniorityData || [];

  const matches = data.filter(row => {
    const first = row["Unnamed: 1"] || "";
    const last = row["CUPE Combined Seniority List"] || "";
    const fullName = `${first} ${last}`.toLowerCase();
    return fullName.includes(query);
  });

  if (matches.length === 0) {
    resultsDiv.innerHTML = "<p>No matching entries found.</p>";
    return;
  }

  // ==============================
  // Render Results
  // ==============================
  let html = "<ul style='list-style: none; padding-left: 0;'>";

  matches.forEach(row => {
    const first = row["Unnamed: 1"] || "";
    const last = row["CUPE Combined Seniority List"] || "";
    const position = row["Unnamed: 2"] || "";
    const status = row["Unnamed: 3"] || "";
    const years = parseFloat(row["Unnamed: 4"] || 0);
    const hours = Math.round(years * 1950 * 100) / 100;

    html += "<li style='margin-bottom: 1em;'>";
    html += `<strong>${first} ${last}</strong><br>`;
    html += `${status}<br>`;
    html += `<em>${position}</em><br>`;
    html += `${years.toFixed(2)} Years - (${hours.toFixed(2)} Hrs)`;
    html += "</li>";
  });

  html += "</ul>";
  resultsDiv.innerHTML = html;
}
