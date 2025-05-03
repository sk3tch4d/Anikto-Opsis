// ==============================
// OPT_STATS.JS — Stats Panel for Optimization Summary
// ==============================

export function setupStats() {
  const statsContainer = document.getElementById("optimization-stats");
  if (!statsContainer) return;

  function renderStats(data) {
    const count = data.length;
    const totalROP = data.reduce((sum, row) => sum + (parseFloat(row.site_suggested_rop) || 0), 0);
    const totalROQ = data.reduce((sum, row) => sum + (parseFloat(row.site_suggested_roq) || 0), 0);
    const totalCost = data.reduce((sum, row) => sum + (parseFloat(row.ma_price) || 0), 0);
    const avgCost = count ? (totalCost / count).toFixed(2) : 0;

    statsContainer.innerHTML = `
      <li><strong>Total Items:</strong> ${count}</li>
      <li><strong>Total ROP:</strong> ${totalROP}</li>
      <li><strong>Total ROQ:</strong> ${totalROQ}</li>
      <li><strong>Total Cost:</strong> $${totalCost.toFixed(2)}</li>
      <li><strong>Average Cost:</strong> $${avgCost}</li>
    `;
  }

  // Listen for search results
  window.addEventListener("optimization:search", e => {
    renderStats(e.detail || []);
  });

  // Trigger default
  if (window.optimizationData) {
    renderStats(window.optimizationData);
  }
}
