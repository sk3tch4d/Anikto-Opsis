// ==============================
// INV_HISTORY.JS
// Search History Renderer
// ==============================

export function addSearchToHistory(term, results) {
  const container = document.getElementById("search-history-list");
  if (!container || !results.length) return;

  const uniqueNums = [...new Set(results.map(r => r.Num))];

  const card = document.createElement("div");
  card.className = "compare-card";

  const header = document.createElement("div");
  header.innerHTML = `<span class="tag-label">Search:</span> ${term}`;
  card.appendChild(header);

  // Toggle Pill
  const matchesToggle = document.createElement("span");
  matchesToggle.className = "tag-label tag-toggle clickable-toggle";
  matchesToggle.innerHTML = `Matches (${uniqueNums.length}) <span class="chevron">▼</span>`;

  const matchesWrapper = document.createElement("div");
  matchesWrapper.className = "usl-wrapper";

  const matchContainer = document.createElement("div");
  matchContainer.className = "clickable-match-container";

  uniqueNums.forEach(num => {
    const span = document.createElement("span");
    span.className = "clickable-match";
    span.setAttribute("data-value", num);
    span.textContent = num;
    matchContainer.appendChild(span);
  });

  matchesWrapper.appendChild(matchContainer);

  matchesToggle.addEventListener("click", () => {
    matchesWrapper.classList.toggle("show");
    matchesToggle.classList.toggle("toggle-open");
  });

  card.appendChild(matchesToggle);
  card.appendChild(matchesWrapper);
  container.appendChild(card);
}
