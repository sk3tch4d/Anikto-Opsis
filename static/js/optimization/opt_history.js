// ==============================
// OPT_HISTORY.JS — Search History Renderer
// ==============================

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

export function addOptimizationSearchToHistory(term, cartFilter, results) {
  const container = document.getElementById("search-history-list");
  if (!container || !results.length) return;

  const uniqueMaterials = [...new Set(results.map(r => r.material))];
  const now = new Date();
  const friendlyTimestamp = formatFriendlyTimestamp(now);

  // Init global history cache
  window.optimizationSearchHistory = window.optimizationSearchHistory || [];

  // Save this search to memory
  window.optimizationSearchHistory.unshift({
    timestamp: friendlyTimestamp,
    search: term,
    filter: cartFilter || "All",
    matches: uniqueMaterials.join(", ")
  });

  // ===== Build Card =====
  const card = document.createElement("div");
  card.className = "compare-card";

  const timeLine = document.createElement("div");
  timeLine.className = "search-timestamp";
  timeLine.style.fontSize = "0.75em";
  timeLine.style.color = "#888";
  timeLine.style.marginBottom = "4px";
  timeLine.textContent = friendlyTimestamp;
  card.appendChild(timeLine);

  const header = document.createElement("div");
  header.innerHTML = `<span class="tag-label">Search:</span> ${term}<br><span class="tag-label">Filter:</span> ${cartFilter || "All"}`;
  card.appendChild(header);

  const matchesToggle = document.createElement("span");
  matchesToggle.className = "tag-label tag-toggle clickable-toggle";
  matchesToggle.innerHTML = `Matches (${uniqueMaterials.length}) <span class="chevron">▼</span>`;

  const matchesWrapper = document.createElement("div");
  matchesWrapper.className = "usl-wrapper";

  const matchContainer = document.createElement("div");
  matchContainer.className = "clickable-match-container";

  uniqueMaterials.forEach(material => {
    const span = document.createElement("span");
    span.className = "clickable-match";
    span.setAttribute("data-value", material);
    span.textContent = material;
    matchContainer.appendChild(span);
  });

  matchesWrapper.appendChild(matchContainer);

  matchesToggle.addEventListener("click", () => {
    matchesWrapper.classList.toggle("show");
    matchesToggle.classList.toggle("toggle-open");
  });

  card.appendChild(matchesToggle);
  card.appendChild(matchesWrapper);

  container.prepend(card);
}

// ==============================
// SETUP PANEL INIT
// ==============================
export function setupHistory() {
  const container = document.getElementById("search-history-list");
  container.innerHTML = "<p style='text-align:center;'>Search something to begin logging history.</p>";
}
