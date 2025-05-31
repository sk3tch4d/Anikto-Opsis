// ==============================
// DATALIST.JS
// ==============================


// ==============================
// ATTACH AUTOCOMPLETE TO INPUTS
// ==============================
function attachAutocompleteToInput(input, names) {
  const container = document.createElement("div");
  container.className = "autocomplete-list";
  container.style.display = "none";
  container.style.position = "absolute";
  container.style.zIndex = "1000";
  document.body.appendChild(container);

  input.removeAttribute("list");
  input.setAttribute("autocomplete", "off");
  input.setAttribute("spellcheck", "false");

  let currentFocus = -1;

  input.addEventListener("input", function () {
    const val = this.value.toLowerCase();
    container.innerHTML = "";
    currentFocus = -1;

    if (!val) {
      container.style.display = "none";
      return;
    }

    const matches = names
      .filter(name => name.toLowerCase().includes(val))
      .slice(0, 10);

    if (matches.length === 0) {
      container.style.display = "none";
      return;
    }

    matches.forEach((name, index) => {
      const item = document.createElement("div");
      item.className = "autocomplete-item";
      item.textContent = name;

      item.addEventListener("click", () => {
        input.value = name;
        input.dispatchEvent(new Event("input", { bubbles: true })); // Re-validate selection
        container.innerHTML = "";
        container.style.display = "none";
      });

      container.appendChild(item);
    });

    const rect = input.getBoundingClientRect();
    container.style.top = `${rect.top + rect.height + window.scrollY}px`;
    container.style.left = `${rect.left + window.scrollX}px`;
    container.style.width = `${rect.width}px`;
    container.style.display = "block";
  });

  input.addEventListener("keydown", function (e) {
    const items = container.querySelectorAll(".autocomplete-item");
    if (!items.length) return;

    if (e.key === "ArrowDown") {
      currentFocus++;
      if (currentFocus >= items.length) currentFocus = 0;
      setActive(items, currentFocus);
      e.preventDefault();
    } else if (e.key === "ArrowUp") {
      currentFocus--;
      if (currentFocus < 0) currentFocus = items.length - 1;
      setActive(items, currentFocus);
      e.preventDefault();
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (currentFocus > -1 && items[currentFocus]) {
        items[currentFocus].click();
      }
    }
  });

  function setActive(items, index) {
    items.forEach((el, i) => {
      el.classList.toggle("active", i === index);
      if (i === index) {
        el.scrollIntoView({ block: "nearest" }); // Keep selected visible
      }
    });
  }

  document.addEventListener("click", function (e) {
    if (e.target !== input) {
      container.innerHTML = "";
      container.style.display = "none";
    }
  });

  window.addEventListener("resize", () => container.style.display = "none");
  window.addEventListener("scroll", () => container.style.display = "none");
}

// ==============================
// INIT AUTOCOMPLETE
// ==============================
export function initCompareAutocomplete() {
  if (!window.seniorityData) return;

  const names = window.seniorityData.map(row => `${row["First Name"]} ${row["Last Name"]}`);
  const inputs = [
    document.getElementById("compare-input-1"),
    document.getElementById("compare-input-2")
  ];

  inputs.forEach(input => {
    if (input) {
      attachAutocompleteToInput(input, names);
    }
  });
}
