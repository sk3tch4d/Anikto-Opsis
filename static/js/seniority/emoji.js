// ==============================
// EMOJI.JS
// Status Icon Assignment Logic
// ==============================

// ==============================
// STATUS ICON HELPER
// ==============================
export function getSeniorityEmoji(status, position) {
  if ((position || "").toUpperCase().includes("HOLD")) return "🔴";
  if ((status || "").toLowerCase().includes("full")) return "🟢";
  if ((status || "").toLowerCase().includes("part")) return "🟡";
  return "⚪";
}
