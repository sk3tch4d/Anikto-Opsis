// ==============================
// OPT_SEARCH.JS — Cart Filter + Text Search
// ==============================

export function setupSearch() {
  const searchInput = document.getElementById("optimization-search");
  const filterSelect = document.getElementById("opsh-filter");

  if (!searchInput || !filterSelect) return;

  // Populate cart filters
  const cartOptions = ["All", "Cart 1", "Cart 2", "Cart 3", "Cart 4", "Cart 5"];
  filterSelect.innerHTML = cartOptions
    .map(cart => `<option value="${cart}">${cart}</option>`) 
    .join("");

  function getData() {
    try {
      const table = window.optimizationData || [];
      return Array.isArray(table) ? table : [];
    } catch {
      return [];
    }
  }

  function filterData() {
    const term = searchInput.value.toLowerCase();
    const cartFilter = filterSelect.value;
    const data = getData();

    const results = data.filter(row => {
      // Cart filter based on Bin column prefix
      if (cartFilter !== "All") {
        const cartNum = cartFilter.split(" ")[1];
        const bin = (row["bin"] || "").toString().toUpperCase();
        if (!bin.startsWith(cartNum)) return false;
      }

      // Search term match against all string fields
      const values = Object.values(row).map(v => (v || "").toString().toLowerCase());
      return values.some(v => v.includes(term));
    });

    // Fire event to update other panels
    const event = new CustomEvent("optimization:search", { detail: results });
    window.dispatchEvent(event);
  }

  searchInput.addEventListener("input", filterData);
  filterSelect.addEventListener("change", filterData);

  // Initial trigger
  filterData();
}
