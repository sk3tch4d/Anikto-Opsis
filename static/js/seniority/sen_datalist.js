// ==============================
// DATALIST.JS
// Fallback Mobile Compatibility
// ==============================

// ==============================
// PATCH DATALIST ON LOAD
// ==============================
export function fixMobileDatalist() {
  window.addEventListener("DOMContentLoaded", () => {
    setTimeout(() => {
      const datalist = document.getElementById("name-options");
      if (datalist && datalist.options.length === 0 && window.seniorityData) {
        datalist.innerHTML = window.seniorityData.map(row => {
          const name = `${row["First Name"]} ${row["Last Name"]}`;
          return `<option value="${name}">`;
        }).join("");
      }
    }, 300);
  });
}
