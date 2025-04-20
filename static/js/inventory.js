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
  const resultsList = document.getElementById("inventory-results");
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
    
      // 🔄 Show loading spinner
      document.getElementById("loading").style.display = "block";
    
      resultsList.innerHTML = "";
      noResults.style.display = "none";
    
      fetch(`/inventory-search?term=${encodeURIComponent(term)}&usl=${encodeURIComponent(usl)}`)
        .then(res => res.json())
        .then(data => {
          // ✅ Hide loading spinner
          document.getElementById("loading").style.display = "none";
    
          if (data.length === 0) {
            noResults.style.display = "block";
            return;
          }
    
          data.forEach(item => {
            const li = document.createElement("li");
    
            let html = `<b>${item.Old ? "Number" : "Stores Number"}:</b> ${item.Num}<br>`;
            if (item.Old) html += `<b>Old:</b> ${item.Old}<br>`;
            html += `<b>Description:</b> ${item.Description}<br>`;
            html += `<b>Location:</b> ${item.USL} - ${item.Bin}<br>`;
            html += `<b>Quantity:</b> ${item.QTY}<br>`;
            html += `<b>Quantity:</b> ${item.Cost} / ${item.UOM}<br>`;
            if (item.Cost_Center) html += `<b>Cost Center:</b> ${item.Cost_Center}<br>`;
            if (item.Group) html += `<b>Group:</b> ${item.Group}`;
    
            li.innerHTML = html;
            resultsList.appendChild(li);
          });
        })
        .catch(() => {
          document.getElementById("loading").style.display = "none";
          noResults.style.display = "block";
        });
    }


  searchInput.addEventListener("input", doSearch);
  uslFilter.addEventListener("change", doSearch);
});
