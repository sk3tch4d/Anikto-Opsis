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
    }, 100); // delay so button clicks still register
  });

  // ==============================
  // EVENTS: Button click or Enter key
  // ==============================
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
  // Auto-render full list on load
  // ==============================
  renderResults(window.seniorityData || []);
}


// ==============================
// NORMALIZATION HELPER
// ==============================
function normalize(str) {
  return String(str || "")
    .toLowerCase()
    .replace(/[-_]/g, " ")      // hyphens/underscores to spaces
    .replace(/\s+/g, " ")       // collapse spaces
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
    renderResults(data);
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

  // Reset scroll position
  resultsDiv.scrollTop = 0;
}
