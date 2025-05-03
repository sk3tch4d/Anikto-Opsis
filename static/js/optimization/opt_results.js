// ==============================
// OPT_RESULTS.JS — Full Results Panel
// ==============================

export function setupResults() {
  const container = document.getElementById("optimization-results");
  const sortDropdown = document.querySelector("#optimization-stats-panel select");

  if (!container) return;

  const getSorted = (items, key = "rop", dir = "desc") => {
    return [...items].sort((a, b) => {
      const A = parseFloat(a[key]) || 0;
      const B = parseFloat(b[key]) || 0;
      return dir === "asc" ? A - B : B - A;
    });
  };

  const renderResults = (data) => {
    container.innerHTML = "";
    if (!data.length) {
      document.getElementById("no-results").style.display = "block";
      return;
    }
    document.getElementById("no-results").style.display = "none";
  
    for (const row of data) {
      const el = document.createElement("li");
      el.className = "inv-card";
      el.innerHTML = `
        <div><strong>Number:</strong> ${row.material || "N/A"}</div>
        <div><strong>Description:</strong> ${row.material_description || ""}</div>
        <div><strong>Location:</strong> ${row.bin || "-"}</div>
        <div><strong>ROP:</strong> ${row.site_suggested_rop || "-"}</div>
        <div><strong>ROQ:</strong> ${row.site_suggested_roq || "-"}</div>
        <div><strong>Cost:</strong> ${row.ma_price || 0} / ${row.bun_of_measure || "EA"}</div>
        <button class="button tiny save-btn">Save</button>
      `;
  
      // Save button logic
      el.querySelector(".save-btn").addEventListener("click", () => {
        window.dispatchEvent(new CustomEvent("optimization:save", { detail: row }));
      });
  
      container.appendChild(el);
    }
  };


  // Bind search event
  window.addEventListener("optimization:search", (e) => {
    const sorted = getSorted(e.detail, "site_suggested_rop", "desc");
    renderResults(sorted);
  });

  // Default to all if no trigger
  if (window.optimizationData) {
    renderResults(getSorted(window.optimizationData));
  }
}
