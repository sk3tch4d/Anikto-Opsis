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
  const sortBy = document.getElementById("sort-by") || { value: "QTY" };
  const sortDirButton = document.getElementById("sort-direction");
  const resultsList = document.getElementById("inventory-results");
  const noResults = document.getElementById("no-results");

  let sortDirection = "desc";

  // Fetch USLs
  fetch("/inventory-usls")
    .then(res => {
      if (!res.ok) {
        console.error("USL fetch failed:", res.status, res.statusText);
        return null;
      }
      return res.json();
    })
    .then(usls => {
      if (!Array.isArray(usls)) {
        console.warn("USL response not array:", usls);
        return;
      }
  
      console.log("USLS Response:", usls);
      usls.sort().forEach(usl => {
        const opt = document.createElement("option");
        opt.value = usl;
        opt.textContent = usl;
        uslFilter.appendChild(opt);
      });
    })
    .catch(err => {
      console.error("USL fetch error:", err);
    });


  // Toggle sort direction
  sortDirButton.addEventListener("click", () => {
    sortDirection = sortDirection === "desc" ? "asc" : "desc";
    sortDirButton.textContent = sortDirection === "desc" ? "↓" : "↑";
    doSearch();
  });


  // ==============================
  // MAIN SEARCH FUNCTION
  // ==============================
  function doSearch() {
    const term = searchInput.value.trim().toLowerCase();
    const usl = uslFilter.value;
    const sort = sortBy.value;

    document.getElementById("loading").style.display = "block";
    resultsList.innerHTML = "";
    noResults.style.display = "none";

    fetch(`/inventory-search?term=${encodeURIComponent(term)}&usl=${encodeURIComponent(usl)}&sort=${encodeURIComponent(sort)}&dir=${encodeURIComponent(sortDirection)}`)
      .then(res => res.json())
      .then(data => {
        document.getElementById("loading").style.display = "none";

        if (!data || data.length === 0) {
          noResults.style.display = "block";
          return;
        }

        data.forEach(item => {
          const li = document.createElement("li");

          let html = `<b>${item.Old ? "Number" : "Stores Number"}:</b> ${highlightMatch(String(item.Num ?? ""), term)}<br>`;

          if (item.Old?.trim()) {
            html += `<b>Old:</b> ${highlightMatch(item.Old, term)}<br>`;
          }
          
          if (item.Description?.trim()) {
            html += `<b>Description:</b> ${highlightMatch(item.Description, term)}<br>`;
          }
          
          if (item.USL?.trim() || item.Bin?.trim()) {
            html += `<b>Location:</b>`;
            if (item.USL?.trim()) html += ` ${highlightMatch(item.USL, term)}`;
            if (item.Bin?.trim()) html += ` - ${highlightMatch(item.Bin, term)}`;
            html += `<br>`;
          }
          
          if (item.QTY || item.UOM?.trim()) {
            html += `<b>Quantity: </b> ~${item.QTY}`;
          }
          
          if (item.Cost !== undefined && item.Cost !== null && item.Cost !== "") {
            html += `<b>Cost:</b> ${item.Cost}<br>`;
            if (item.UOM?.trim()) html += ` / ${highlightMatch(item.UOM, term)}`;
            html += `<br>`;
          }

          if (item.Cost_Center?.trim()) {
            html += `<b>Cost Center:</b> ${highlightMatch(item.Cost_Center, term)}<br>`;
          }
          
          if (item.Group?.trim()) {
            html += `<b>Group:</b> ${highlightMatch(item.Group, term)}`;
          }


          li.innerHTML = html;
          resultsList.appendChild(li);
        });
      })
      .catch(() => {
        document.getElementById("loading").style.display = "none";
        noResults.style.display = "block";
      });

      // Restore scroll position on load
      const savedScroll = localStorage.getItem("inventoryScrollTop");
      if (savedScroll) {
        setTimeout(() => {
          window.scrollTo(0, parseInt(savedScroll));
        }, 50);
      }
  }

  searchInput.addEventListener("input", () => {
    clearTimeout(window._searchDebounce);
    window._searchDebounce = setTimeout(doSearch, 200);
  });

uslFilter.addEventListener("change", doSearch);
  if (sortBy) sortBy.addEventListener("change", doSearch);
  // Trigger initial search on load
  doSearch();
});

// Save scroll position before page unload
window.addEventListener("beforeunload", () => {
  localStorage.setItem("inventoryScrollTop", window.scrollY);
});
