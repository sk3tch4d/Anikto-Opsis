// ==============================
// OPT_HISTORY.JS — Search History Log
// ==============================

export function setupHistory() {
  const container = document.getElementById("search-history-list");
  const history = new Set();

  if (!container) return;

  function renderHistory() {
    container.innerHTML = "";
    [...history].reverse().forEach(term => {
      const el = document.createElement("li");
      el.textContent = term;
      el.className = "history-tag";
      el.onclick = () => {
        document.getElementById("optimization-search").value = term;
        document.getElementById("optimization-search").dispatchEvent(new Event("input"));
      };
      container.appendChild(el);
    });
  }

  window.addEventListener("optimization:history", e => {
    const term = (e.detail || "").trim();
    if (term && !history.has(term)) {
      history.add(term);
      renderHistory();
    }
  });
}
