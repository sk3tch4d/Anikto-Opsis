// ==============================
// HISTORY_CARD.JS
// ==============================

import { attachChevron, formatTimestamp } from '../ui-utils.js';

// ==============================
// ADD SEARCH HISTORY CARD
// ==============================
export function addSearchHistoryCard({
  containerId = "search-history-list",
  historyKey = "defaultSearchHistory",
  term = "",
  filter = "All",
  results = [],
  chevronColor = "#0a0b0f"
}) {
  const container = document.getElementById(containerId);
  if (!container || !results.length) return;

  const uniqueNums = [...new Set(results.map(r => r.Num))];
  const timestamp = formatTimestamp(new Date());

  window[historyKey] = window[historyKey] || [];
  window[historyKey].unshift({
    timestamp,
    search: term,
    filter,
    matches: uniqueNums.join(", ")
  });

  const card = document.createElement("div");
  card.className = "panel-card";

  const timeLine = document.createElement("div");
  timeLine.className = "search-timestamp";
  timeLine.textContent = timestamp;
  card.appendChild(timeLine);

  const header = document.createElement("div");
  header.innerHTML = `<span class="tag-label">Search:</span> ${term}<br><span class="tag-label">Filter:</span> ${filter}`;
  card.appendChild(header);

  const matchesToggle = document.createElement("span");
  matchesToggle.className = "tag-label tag-toggle clickable-toggle";
  matchesToggle.innerHTML = `Matches (${uniqueNums.length}) <span class="chevron">▼</span>`;

  const matchesWrapper = document.createElement("div");
  matchesWrapper.className = "toggle-wrapper";

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
  card.appendChild(matchesToggle);
  card.appendChild(matchesWrapper);

  requestAnimationFrame(() =>
    attachChevron({ root: card, chevronColor })
  );

  container.prepend(card);
}
