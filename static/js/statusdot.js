// ==============================
// STATUSDOT.JS
// Status Icon Assignment Logic
// ==============================


// ==============================
// STATUS DOT HELPER
// ==============================
export function getStatusDot(status, position) {
  let color = "gray"; // fallback

  if ((position || "").toUpperCase().includes("HOLD")) {
    color = "red";
  } else if ((status || "").toLowerCase().includes("full")) {
    color = "green";
  } else if ((status || "").toLowerCase().includes("part")) {
    color = "yellow";
  }

  return `<span class="status-dot ${color}"></span>`;
}
