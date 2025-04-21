// ==============================
// DEBUGGING
// ==============================
export function initDebugToggle() {
  const debugToggle = document.getElementById("debug-toggle");
  if (!debugToggle) return;

  const enabled = localStorage.getItem("DEBUG_MODE") === "true";
  debugToggle.checked = enabled;

  debugToggle.addEventListener("change", () => {
    localStorage.setItem("DEBUG_MODE", debugToggle.checked);
    alert(`Debug Mode ${debugToggle.checked ? "enabled" : "disabled"}. Reload a page to apply.`);
  });
}
