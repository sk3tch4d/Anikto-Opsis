// ==============================
// AUTOCOMPLETE.JS
// Search Autocomplete
// ==============================


// ==============================
// INIT AUTOCOMPLETE
// ==============================
export function initAutocomplete(inputId, suggestionListId) {
  const input = document.getElementById(inputId);
  const container = document.getElementById(suggestionListId);

  input.setAttribute("autocomplete", "off");

  input.addEventListener("input", () => {
    const query = input.value.trim().toLowerCase();
    container.innerHTML = "";

    if (!query) return;

    const matches = (window.seniorityData || []).filter(row => {
      const fullName = `${row["First Name"]} ${row["Last Name"]}`.toLowerCase();
      return fullName.includes(query);
    });

    matches.slice(0, 6).forEach(match => {
      const name = `${match["First Name"]} ${match["Last Name"]}`;
      const item = document.createElement("div");
      item.className = "autocomplete-item";
      item.textContent = name;

      item.addEventListener("click", () => {
        input.value = name;
        container.innerHTML = "";
        input.dispatchEvent(new Event("input")); // trigger any listeners
      });

      container.appendChild(item);
    });
  });

  document.addEventListener("click", (e) => {
    if (!container.contains(e.target) && e.target !== input) {
      container.innerHTML = "";
    }
  });
}
