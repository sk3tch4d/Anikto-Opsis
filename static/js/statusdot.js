// ==============================
// STATUSDOT.JS
// Status Icon Assignment Logic
// ==============================


// ==============================
// MATCH CONST RULES
// ==============================
const defaultFieldRules = [
  { field: ["changed", "mvt"], match: "includes", value: ["201", "yes", "true"], color: "green" },
  { field: ["changed", "mvt"], match: "includes", value: ["202", "no", "false"], color: "red" },

  { field: ["position", "status"], match: "includes", value: ["full", "full-time"], color: "green" },
  { field: ["position", "status"], match: "includes", value: ["part", "part-time"], color: "yellow" },
  { field: ["position", "status"], match: "includes", value: ["casual", ""], color: "gray" },
  { field: ["position", "status"], match: "includes", value: ["hold", "off", "no"], color: "red" },

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
// EVALUATE MATCH
// ==============================
function evaluateMatch(str, match, value) {
  const values = Array.isArray(value) ? value : [value];
  str = (str || "").toLowerCase();

  return typeof match === "function"
    ? match(str)
    : match === "includes"
      ? values.some(v => str.includes(v.toLowerCase()))
      : match === "equals"
        ? values.some(v => str === v.toLowerCase())
        : match === "startsWith"
          ? values.some(v => str.startsWith(v.toLowerCase()))
          : match === "endsWith"
            ? values.some(v => str.endsWith(v.toLowerCase()))
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
/**
 * Evaluates structured data against field-specific matching rules
 * and returns a colored status dot with optional tooltip.
 *
 * @param {Object} data - Object containing named fields (e.g., { status, position, MVT, remarks }).
 * @param {Array} [rules=defaultFieldRules] - Optional array of rule objects using field, match type, and values.
 * @param {Object} [options={}] - Display settings.
 * @param {boolean|string} [options.tooltip] - If true, generates default tooltip; if a string, uses custom text.
 * @returns {string} - HTML string for a <span> element with the status-dot class and optional tooltip.
 */

export function getStatusDot(data, rules = defaultFieldRules, options = {}) {
  let color = "gray";
  let tooltipText = "";

  outer: for (const rule of rules) {
    const { field, match, value, color: ruleColor } = rule;
    const fields = Array.isArray(field) ? field : [field];

    for (const f of fields) {
      const fieldValue = (data[f] || "").toLowerCase();
      if (evaluateMatch(fieldValue, match, value)) {
        color = ruleColor;
        tooltipText = generateTooltip(`${f.charAt(0).toUpperCase() + f.slice(1)}: ${fieldValue}`, options, true);
        break outer;
      }
    }
  }

  const titleAttr = tooltipText ? ` title="${tooltipText}"` : "";
  return `<span class="status-dot ${color}"${titleAttr}></span>`;
}

// ==============================
// MATCH STATUS DOT
// ==============================
/**
 * Evaluates a single string against match rules (e.g., includes, startsWith)
 * and returns a colored status dot with optional tooltip.
 *
 * @param {string} input - The raw input string to evaluate.
 * @param {Array} [rules=defaultMatchRules] - Optional match rule set.
 * @param {Object} [options={}] - Display settings.
 * @param {boolean|string} [options.tooltip] - If true, generates default tooltip; if a string, uses custom text.
 * @returns {string} - HTML string for a <span> element with the status-dot class and optional tooltip.
 */

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

  const titleAttr = tooltipText ? ` title="${tooltipText}"` : "";
  return `<span class="status-dot ${color}"${titleAttr}></span>`;
}
