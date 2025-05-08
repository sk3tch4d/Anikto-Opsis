// ==============================
// STATUSDOT.JS
// Status Icon Assignment Logic
// ==============================


// ==============================
// STATUS DOT HELPER
// ==============================
export function getStatusDot(status = "", context = "") {
  const normalizedStatus = status.toString().toLowerCase().trim();
  const normalizedCtx = context.toString().toLowerCase().trim();
  let color = "gray";

  // Priority Rules
  if (normalizedCtx.includes("hold") || normalizedStatus === "hold" || ["no", "false"].includes(normalizedStatus)) {
    color = "red";
  } else if (["full", "yes", "changed", "true", "x"].includes(normalizedStatus)) {
    color = "green";
  } else if (["partial", "part", "some"].includes(normalizedStatus)) {
    color = "yellow";
  } else if (["unchanged", ""].includes(normalizedStatus)) {
    color = "gray";
  }

  return `<span class="status-dot ${color}"></span>`;
}

