// ==============================
// DEBUGGING.JS
// ==============================


// ==============================
// LOCAL DEBUG MODE
// ==============================
export function initDebugToggle() {
  const toggleSwitch = document.getElementById("debug-toggle");
  if (!toggleSwitch) return;

  const enabled = localStorage.getItem("DEBUG_MODE") === "true";
  toggleSwitch.checked = enabled;

  toggleSwitch.addEventListener("change", () => {
    const isEnabled = toggleSwitch.checked;
    localStorage.setItem("DEBUG_MODE", isEnabled);
    console.log(`[DEBUG] Debug Mode ${isEnabled ? "Enabled" : "Disabled"}`);
    // Reload the page to apply the new debug mode everywhere
    location.reload();
  });

  console.log(`[DEBUG] Debug Mode is currently ${enabled ? "ENABLED" : "DISABLED"}`);
}
