// ==============================
// SENIORITY.JS — Client-side Lookup Tool
// ==============================
// This handles live searching of uploaded seniority XLSX data
// Displays matching names and their record line in styled format
// ==============================


// ==============================
// INIT ON LOAD
// ==============================
document.addEventListener("DOMContentLoaded", () => {
  window.seniorityData = window.seniorityData || [];
});


// ==============================
// SEARCH FUNCTIONALITY
// ==============================
async function doSenioritySearch() {
  const input = document.getElementById("seniority-search");
  const resultsDiv = document.getElementById("seniority-results");
  const query = input.value.trim().toLowerCase();

  if (!query) {
    resultsDiv.innerHTML = "<p>Please enter a name to search.</p>";
    return;
  }

  const data = window.seniorityData || [];
  const matches = data.filter(row =>
    Object.values(row).some(val =>
      String(val).toLowerCase().includes(query)
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
    html += "<li style='margin-bottom: 1em;'>";
    html += "<strong>" + (row["Name"] || "Unknown") + "</strong><br>";
    for (const [key, val] of Object.entries(row)) {
      if (key !== "Name") {
        html += `<span style="font-size: 0.95em;"><em>${key}</em>: ${val}</span><br>`;
      }
    }
    html += "</li>";
  });
  html += "</ul>";

  resultsDiv.innerHTML = html;
}
