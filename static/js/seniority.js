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
    const nameParts = [
      row["Unnamed: 1"],
      row["Unnamed: 0"] || row["CUPE Combined Seniority List"]
    ].filter(Boolean);

    const fullName = nameParts.join(" ").toLowerCase();
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
    const firstName = row["Unnamed: 1"] || "";
    const lastName = row["Unnamed: 0"] || row["CUPE Combined Seniority List"] || "";
    const status = row["Unnamed: 3"] || "";
    const position = row["Unnamed: 2"] || "";
    const years = parseFloat(row["Limited Seniority Years"] || 0);
    const hours = Math.round(years * 1950 * 100) / 100;

    html += "<li style='margin-bottom: 1em;'>";
    html += `<strong>${firstName} ${lastName}</strong><br>`;
    html += `${status}<br>`;
    html += `<em>${position}</em><br>`;
    html += `<strong>${hours}</strong> hrs &nbsp; <span style="font-size: 0.9em;">(${years} years)</span>`;
    html += "</li>";
  });

  html += "</ul>";
  resultsDiv.innerHTML = html;
}
