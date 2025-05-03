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

const HISTORY_KEY = "optimization_search_history";

// ==============================
// ADD SEARCH TO HISTORY
// ==============================
export function addOptimizationSearchToHistory(term, cartFilter, results) {
  const container = document.getElementById("search-history-list");
  if (!container || !results.length) return;

  const uniqueMaterials = [...new Set(results.map(r => r.material))];
  const now = new Date();
  const friendlyTimestamp = formatFriendlyTimestamp(now);

  // Load existing history
  let history = [];
  try {
    history = JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];
  } catch {
    history = [];
  }

  // Push new entry
  const newEntry = {
    timestamp: friendlyTimestamp,
    search: term,
    filter: cartFilter || "All",
    matches: uniqueMaterials.join(", ")
  };
  history.unshift(newEntry);

  // Save updated
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));

  // Add to DOM
  renderEntry(container, newEntry, uniqueMaterials);
}

// ==============================
// RENDER SINGLE ENTRY
// ==============================
function renderEntry(container, entry, materialList = []) {
  const card = document.createElement("div");
  card.className = "compare-card";

  const timeLine = document.createElement("div");
  timeLine.className = "search-timestamp";
  timeLine.style.fontSize = "0.75em";
  timeLine.style.color = "#888";
  timeLine.style.marginBottom = "4px";
  timeLine.textContent = entry.timestamp;
  card.appendChild(timeLine);

  const header = document.createElement("div");
  header.innerHTML = `<span class="tag-label">Search:</span> ${entry.search}<br><span class="tag-label">Filter:</span> ${entry.filter}`;
  card.appendChild(header);

  const matchesToggle = document.createElement("span");
  matchesToggle.className = "tag-label tag-toggle clickable-toggle";
  matchesToggle.innerHTML = `Matches (${materialList.length || entry.matches.split(",").length}) <span class="chevron">▼</span>`;

  const matchesWrapper = document.createElement("div");
  matchesWrapper.className = "usl-wrapper";

  const matchContainer = document.createElement("div");
  matchContainer.className = "clickable-match-container";

  const matchItems = materialList.length ? materialList : (entry.matches || "").split(",");

  matchItems.forEach(material => {
    const span = document.createElement("span");
    span.className = "clickable-match";
    span.setAttribute("data-value", material.trim());
    span.textContent = material.trim();
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
// INIT HISTORY PANEL
// ==============================
export function setupHistory() {
  const container = document.getElementById("search-history-list");
  container.innerHTML = "<p style='text-align:center;'>Search something to begin logging history.</p>";

  try {
    const stored = JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];
    for (const entry of stored.reverse()) {
      const matchList = (entry.matches || "").split(",");
      renderEntry(container, entry, matchList);
    }
  } catch {
    // ignore
  }
}
