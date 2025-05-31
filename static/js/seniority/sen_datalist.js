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
  input.parentNode.appendChild(container);

  input.setAttribute("autocomplete", "off");

  input.addEventListener("input", function () {
    const val = this.value.toLowerCase();
    container.innerHTML = "";
    if (!val) {
      container.style.display = "none";
      return;
    }

    const matches = names.filter(name => name.toLowerCase().includes(val)).slice(0, 10);
    if (matches.length === 0) {
      container.style.display = "none";
      return;
    }

    matches.forEach(name => {
      const item = document.createElement("div");
      item.className = "autocomplete-item";
      item.textContent = name;
      item.addEventListener("click", () => {
        input.value = name;
        container.innerHTML = "";
        container.style.display = "none";
      });
      container.appendChild(item);
    });

    container.style.position = "absolute";
    container.style.top = (input.offsetTop + input.offsetHeight) + "px";
    container.style.left = input.offsetLeft + "px";
    container.style.width = input.offsetWidth + "px";
    container.style.zIndex = "999";
    container.style.display = "block";
  });

  document.addEventListener("click", function (e) {
    if (e.target !== input) {
      container.innerHTML = "";
      container.style.display = "none";
    }
  });
}

// ==============================
// INIT AUTOCOMPLETE
// ==============================
export function initCompareAutocomplete() {
  if (!window.seniorityData) return;

  const names = window.seniorityData.map(row => `${row["First Name"]} ${row["Last Name"]}`);
  const inputs = [document.getElementById("compare-input-1"), document.getElementById("compare-input-2")];

  inputs.forEach(input => {
    if (input) {
      attachAutocompleteToInput(input, names);
    }
  });
}
