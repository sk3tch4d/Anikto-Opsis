// ==============================
// SEARCH_HISTORY.JS
// Search History Renderer
// ==============================

//
 
function formatFriendlyTimestamp(date) {
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();

  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();

  const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (isToday) return `Today at ${time}`;
  if (isYesterday) return `Yesterday at ${time}`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) + ` at ${time}`;
}

export function addSearchToHistory(term, uslFilter, results) {
  const container = document.getElementById("search-history-list");
  if (!container || !results.length) return;

  const uniqueNums = [...new Set(results.map(r => r.Num))];
  const now = new Date();
  const friendlyTimestamp = formatFriendlyTimestamp(now);

  const card = document.createElement("div");
  card.className = "compare-card";

  // Timestamp
  const timeLine = document.createElement("div");
  timeLine.className = "search-timestamp";
  timeLine.style.fontSize = "0.75em";
  timeLine.style.color = "#888";
  timeLine.style.marginBottom = "4px";
  timeLine.textContent = friendlyTimestamp;
  card.appendChild(timeLine);

  // Search term
  const header = document.createElement("div");
  header.innerHTML = `<span class="tag-label">Search:</span> ${term}`;
  card.appendChild(header);

  // Filter term
  const filterLine = document.createElement("div");
  filterLine.innerHTML = `<span class="tag-label">Filter:</span> ${uslFilter}`;
  filterLine.style.marginBottom = "4px";
  card.appendChild(filterLine);

  // Toggle for matches
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
