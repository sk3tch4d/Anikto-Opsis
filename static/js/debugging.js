// ==============================
// DEBUGGING
// ==============================
export function initDebugToggle() {
  const toggleSwitch = document.getElementById("debug-toggle");
  if (!toggleSwitch) return;

  const enabled = localStorage.getItem("DEBUG_MODE") === "true";
  toggleSwitch.checked = enabled;

  toggleSwitch.addEventListener("change", () => {
    localStorage.setItem("DEBUG_MODE", toggleSwitch.checked);
    console.log(`[DEBUG] Debug Mode ${toggleSwitch.checked ? "Enabled" : "Disabled"}`);
    alert(`Debug Mode ${toggleSwitch.checked ? "enabled" : "disabled"}. Reload a page to apply.`);
  });
}

  // Log current state after initialization
  console.log(`[DEBUG] Debug Mode is currently ${enabled ? "ENABLED" : "DISABLED"}`);
}
