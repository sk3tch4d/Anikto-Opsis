// ==============================
// PARSE TO SEARCH MODULE
// ==============================

export function setupClickableStats(selector, inputId, attribute = "data-name") {
  document.querySelectorAll(selector).forEach(elem => {
    elem.addEventListener("click", () => {
      const value = elem.getAttribute(attribute);
      const input = document.getElementById(inputId);
      if (input && value) {
        input.value = value;
        input.dispatchEvent(new Event("input"));
      }
    });
  });
}
