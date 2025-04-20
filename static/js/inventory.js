// ==============================
// INVENTORY.JS
// Inventory Search Panel Logic
// ==============================


// ==============================
// HELPERS: HIGHLIGHT MATCHED
// ==============================
function highlightMatch(text, term) {
  if (!term) return text;
  const safeTerm = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${safeTerm})`, "ig");
  return text.replace(regex, `<span class="highlight">$1</span>`);
}


// ==============================
// INIT INVENTORY SEARCH PANEL
// ==============================
document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.getElementById("inventory-search");
  const uslFilter = document.getElementById("usl-filter");
  const sortBy = document.getElementById("sort-by");
  const sortDirButton = document.getElementById("sort-dir");
  const resultsList = document.getElementById("inventory-results");
  const noResults = document.getElementById("no-results");

  let sortDirection = "desc";

  // Fetch USLs for dropdown
  fetch("/inventory-usls")
    .then(res => res.json())
    .then(usls => {
      usls.sort().forEach(usl => {
        const opt = document.createElement("option");
        opt.value = usl;
        opt.textContent = usl;
        uslFilter.appendChild(opt);
      });
    });

  // Toggle sort direction
  sortDirButton.addEventListener("click", () => {
    sortDirection = sortDirection === "desc" ? "asc" : "desc";
    sortDirButton.textContent = sortDirection === "desc" ? "↓" : "↑";
    doSearch();
  });

  function doSearch() {
    const term = searchInput.value.trim();
    const usl = uslFilter.value;
    const sort = sortBy.value;

    // 🔄 Show loading spinner
    document.getElementById("loading").style.display = "block";

    resultsList.innerHTML = "";
    noResults.style.display = "none";

    fetch(`/inventory-search?term=${encodeURIComponent(term)}&usl=${encodeURIComponent(usl)}&sort=${sort}&dir=${sortDirection}`)
      .then(res => res.json())
      .then(data => {
        document.getElementById("loading").style.display = "none";

        if (data.length === 0) {
          noResults.style.display = "block";
          return;
        }

        data.forEach(item => {
          const li = document.createElement("li");

          let html = `<b>${item.Old ? "Number" : "Stores Number"}:</b> ${highlightMatch(item.Num, term)}<br>`;
          if (item.Old) html += `<b>Old:</b> ${highlightMatch(item.Old, term)}<br>`;
          html += `<b>Description:</b> ${highlightMatch(item.Description, term)}<br>`;
          html += `<b>Location:</b> ${highlightMatch(item.USL, term)} - ${highlightMatch(item.Bin, term)}<br>`;
          html += `<b>Quantity:</b> ${item.QTY}<br>`;
          html += `<b>Cost:</b> ${item.Cost} / ${highlightMatch(item.UOM, term)}<br>`;
          if (item.Cost_Center) html += `<b>Cost Center:</b> ${highlightMatch(item.Cost_Center, term)}<br>`;
          if (item.Group) html += `<b>Group:</b> ${highlightMatch(item.Group, term)}`;

          li.innerHTML = html;
          resultsList.appendChild(li);
        });
      })
      .catch(() => {
        document.getElementById("loading").style.display = "none";
        noResults.style.display = "block";
      });
  }

  // Debounced search
  let debounceTimeout;
  searchInput.addEventListener("input", () => {
    clearTimeout(debounceTimeout);
    debounceTimeout = setTimeout(doSearch, 250);
  });

  // Immediate search on filter change
  uslFilter.addEventListener("change", doSearch);
  sortBy.addEventListener("change", doSearch);
});
