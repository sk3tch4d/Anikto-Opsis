// ==============================
// HELPERS.JS
// Reusable Utility Helpers
// ==============================


// ==============================
// TITLE CASE STRING
// ==============================
export function toTitleCase(str) {
  return str.replace(/\w\S*/g, txt => txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase());
}

// ==============================
// FORMAT NUMBER (e.g., 12345.678 → 12,345.68)
// ==============================
export function formatNumber(value, decimals = 2) {
  return Number(value).toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}

// ==============================
// FORMAT WHOLE NUMBER (e.g., 12345 → 12,345)
// ==============================
export function formatInteger(value) {
  return Number(value).toLocaleString("en-US");
}
