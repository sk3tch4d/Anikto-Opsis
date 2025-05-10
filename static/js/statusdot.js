// ==============================
// STATUSDOT.JS (Sanitized Version)
// Status Icon Assignment Logic
// ==============================

// ==============================
// MATCH CONST RULES
// ==============================
const defaultFieldRules = [
  { field: ["changed", "mvt"], match: "includes", value: ["201", "yes", "true"], color: "green" },
  { field: ["changed", "mvt"], match: "includes", value: ["202", "no", "false"], color: "red" },

  { field: ["position", "status"], match: "includes", value: ["hold", "off", "no"], color: "red" },
  { field: ["position", "status"], match: "includes", value: ["full", "full-time"], color: "green" },
  { field: ["position", "status"], match: "includes", value: ["part", "part-time"], color: "yellow" },
  { field: ["position", "status"], match: "includes", value: ["casual", ""], color: "gray" },

  { field: "remarks", match: "startsWith", value: ["urgent", "immediate"], color: "orange" },
  { field: "other", match: "equals", value: ["123", "456"], color: "purple" }
];

const defaultMatchRules = [
  { match: "includes", value: ["fail", "error"], color: "red" },
  { match: "startsWith", value: ["warn", "caution"], color: "yellow" },
  { match: "endsWith", value: ["ok", "ready"], color: "green" },
  { match: "equals", value: ["success", "done"], color: "white" }
];

// ==============================
// HELPER: Escape HTML
// ==============================
function escapeHtml(str) {
  return String(str).replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ==============================
// EVALUATE MATCH
// ==============================
function evaluateMatch(str, match, value) {
  const values = Array.isArray(value) ? value : [value];
  str = String(str || "").toLowerCase();

  return typeof match === "function"
    ? match(str)
    : match === "includes"
      ? values.some(v => str.includes(String(v).toLowerCase()))
      : match === "equals"
        ? values.some(v => str === String(v).toLowerCase())
        : match === "startsWith"
          ? values.some(v => str.startsWith(String(v).toLowerCase()))
          : match === "endsWith"
            ? values.some(v => str.endsWith(String(v).toLowerCase()))
            : false;
}

// ==============================
// GENERATE TOOLTIP
// ==============================
function generateTooltip(fieldOrContent, options, showField = true) {
  if (typeof options.tooltip === "string") return options.tooltip;
  if (options.tooltip === true) {
    return showField ? `Matched: ${fieldOrContent}` : fieldOrContent;
  }
  return "";
}

// ==============================
// GET STATUS DOT
// ==============================
export function getStatusDot(data, rules = defaultFieldRules, options = {}) {
  let color = "gray";
  let tooltipText = "";

  outer: for (const rule of rules) {
    const { field, match, value, color: ruleColor } = rule;
    const fields = Array.isArray(field) ? field : [field];

    for (const f of fields) {
      const fieldValue = typeof data[f] === 'string'
        ? data[f].toLowerCase()
        : String(data[f] || '').toLowerCase();

      if (evaluateMatch(fieldValue, match, value)) {
        color = ruleColor;
        tooltipText = generateTooltip(`${f.charAt(0).toUpperCase() + f.slice(1)}: ${fieldValue}`, options, true);
        break outer;
      }
    }
  }

  const titleAttr = tooltipText ? ` title="${escapeHtml(tooltipText)}"` : "";
  const sanitizedColor = color.replace(/[^a-z\-]/gi, ''); // Basic CSS class sanitization
  return `<span class="status-dot ${sanitizedColor}"${titleAttr}></span>`;
}

// ==============================
// MATCH STATUS DOT
// ==============================
export function matchStatusDot(input, rules = defaultMatchRules, options = {}) {
  let color = "gray";
  let tooltipText = "";

  for (const rule of rules) {
    if (evaluateMatch(input, rule.match, rule.value)) {
      color = rule.color;
      tooltipText = generateTooltip(input, options, false);
      break;
    }
  }

  const titleAttr = tooltipText ? ` title="${escapeHtml(tooltipText)}"` : "";
  const sanitizedColor = color.replace(/[^a-z\-]/gi, '');
  return `<span class="status-dot ${sanitizedColor}"${titleAttr}></span>`;
}
