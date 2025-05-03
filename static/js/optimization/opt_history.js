// ==============================
// OPT_HISTORY.JS — Search History Log for Optimization
// ==============================

export function setupHistory() {
  const container = document.getElementById("search-history-list");
  const searchInput = document.getElementById("optimization-search");
  const HISTORY_KEY = "optimization_search_history";
  const historySet = new Set();

  if (!container || !searchInput) return;

  // ==============================
  // Load from localStorage
  // ==============================
  function loadHistory() {
    const stored = localStorage.getItem(HISTORY_KEY);
    try {
      const parsed = JSON.parse(stored);
      for (const term of parsed || []) {
        historySet.add(term);
      }
    } catch {
      // fallback
    }
  }

  // ==============================
  // Save to localStorage
  // ==============================
  function persistHistory() {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(Array.from(historySet)));
  }

  // ==============================
  // Render History List
  // ==============================
  function renderHistory() {
    container.innerHTML = "";
    [...historySet].reverse().forEach(term => {
      const el = document.createElement("li");
      el.textContent = term;
      el.className = "history-tag";
      el.onclick = () => {
        searchInput.value = term;
        searchInput.dispatchEvent(new Event("input"));
      };
      container.appendChild(el);
    });
  }

  // ==============================
  // Listen to search events
  // ==============================
  window.addEventListener("optimization:history", e => {
    const term = (e.detail || "").trim();
    if (term && !historySet.has(term)) {
      historySet.add(term);
      persistHistory();
      renderHistory();
    }
  });

  // Initial boot
  loadHistory();
  renderHistory();
}
