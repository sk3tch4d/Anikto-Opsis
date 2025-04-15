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
// NORMALIZATION HELPER
// ==============================

function normalize(str) {
  return String(str || "")
    .toLowerCase()
    .replace(/[-_]/g, " ")   // treat hyphens and underscores as spaces
    .replace(/\s+/g, " ")    // collapse multiple spaces
    .trim();
}


// ==============================
// SEARCH FUNCTIONALITY
// ==============================
function doSenioritySearch() {
  const input = document.getElementById("seniority-search");
  const resultsDiv = document.getElementById("seniority-results");
  const query = input.value.trim();

  if (!query) {
    resultsDiv.innerHTML = "<p>Please enter a name, position, or keyword to search.</p>";
    return;
  }

  const data = window.seniorityData || [];

  // Match if any value in the row contains the normalized query
  const matches = data.filter(row =>
    Object.values(row).some(val =>
      normalize(val).includes(normalize(query))
    )
  );

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
}
