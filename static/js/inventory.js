// ==============================
// INVENTORY.JS
// Inventory Search Panel Logic
// ==============================


// ==============================
// INIT INVENTORY SEARCH PANEL
// ==============================
document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.getElementById("inventory-search");
  const uslFilter = document.getElementById("usl-filter");
  const resultsList = document.getElementById("results-list");
  const noResults = document.getElementById("no-results");

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

  function doSearch() {
    const term = searchInput.value.trim();
    const usl = uslFilter.value;

    fetch(`/inventory-search?term=${encodeURIComponent(term)}&usl=${encodeURIComponent(usl)}`)
      .then(res => res.json())
      .then(data => {
        resultsList.innerHTML = "";
        if (data.length === 0) {
          noResults.style.display = "block";
          return;
        }
        noResults.style.display = "none";

        data.forEach(item => {
          const li = document.createElement("li");

          let html = `<b>${item.Old ? "Number" : "Stores Number"}:</b> ${item.Num}<br>`;
          if (item.Old) html += `<b>Old:</b> ${item.Old}<br>`;
          html += `<b>Description:</b> ${item.Description}<br>`;
          html += `<b>Location:</b> ${item.USL}<br>`;
          html += `<b>Quantity:</b> ${item.QTY} /${item.UOM}`;

          li.innerHTML = html;
          resultsList.appendChild(li);
        });
      });
  }

  searchInput.addEventListener("input", doSearch);
  uslFilter.addEventListener("change", doSearch);
});
