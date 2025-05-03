// ==============================
// OPT_SAVED.JS — Saved Items Panel for Optimization
// ==============================

export function setupSavedItems() {
  const SAVED_KEY = "optimization_saved_items";
  const container = document.querySelector("#optimization-saved-panel .panel-body");  // ✅ fixed selector
  const savedItems = new Map();

  // ==============================
  // Load from localStorage
  // ==============================
  function loadSaved() {
    const stored = localStorage.getItem(SAVED_KEY);
    try {
      const parsed = JSON.parse(stored);
      for (const item of parsed || []) {
        savedItems.set(item.material, item);
      }
    } catch {
      // No saved
    }
  }

  // ==============================
  // Save to localStorage
  // ==============================
  function persist() {
    localStorage.setItem(SAVED_KEY, JSON.stringify(Array.from(savedItems.values())));
  }

  // ==============================
  // Render Saved Panel
  // ==============================
  function render() {
    if (!container) return;
    container.innerHTML = "";

    if (!savedItems.size) {
      container.innerHTML = `<p style="text-align:center;">No saved items yet.</p>`;
      return;
    }

    for (const item of savedItems.values()) {
      const li = document.createElement("div");
      li.className = "inv-card";
      li.innerHTML = `
        <div><strong>${item.material}</strong> — ${item.material_description || ""}</div>
        <div><strong>ROP:</strong> ${item.site_suggested_rop}</div>
        <div><strong>ROQ:</strong> ${item.site_suggested_roq}</div>
        <button class="button tiny" data-remove="${item.material}">Remove</button>
      `;
      container.appendChild(li);
    }

    container.querySelectorAll("button[data-remove]").forEach(btn => {
      btn.addEventListener("click", () => {
        savedItems.delete(btn.dataset.remove);
        persist();
        render();
      });
    });
  }

  // ==============================
  // Listen for save events
  // ==============================
  window.addEventListener("optimization:save", e => {
    const item = e.detail;
    if (!item || !item.material) return;
    savedItems.set(item.material, item);
    persist();
    render();
  });

  // ==============================
  // Download CSV
  // ==============================
  const downloadBtn = document.getElementById("optimization-history-download");
  if (downloadBtn) {
    downloadBtn.addEventListener("click", () => {
      const csv = Array.from(savedItems.values());
      if (!csv.length) return alert("No saved items.");
      const content = convertToCSV(csv);
      triggerDownload(content, "saved_items.csv");
    });
  }

  function convertToCSV(data) {
    const keys = Object.keys(data[0]);
    const lines = [keys.join(",")];
    for (const row of data) {
      lines.push(keys.map(k => `"${(row[k] ?? "").toString().replace(/"/g, '""')}"`).join(","));
    }
    return lines.join("\n");
  }

  function triggerDownload(content, filename) {
    const blob = new Blob([content], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Init on load
  loadSaved();
  render();
}
