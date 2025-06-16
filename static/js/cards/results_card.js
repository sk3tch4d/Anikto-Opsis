// ==============================
// RESULTS_CARD.JS
// UI Line Renderer for Stat Cards
// ==============================

import { highlightMatch } from "../search-utils.js";

/** ==============================

 * Renders a labeled line or group of inline fields for stats panels.
 * Supports highlighting and inline grouping of label-value pairs.
 * 
 * @param {string|Array} labelOrArray - Single label string or array of [label, value] pairs
 * @param {*} value - Value (only used for single label mode)
 * @param {Object} options - Configuration options
 * @param {string|null} options.term - Search term for highlight
 * @param {boolean} options.highlight - Enable highlightMatch
 * @param {string} options.suffix - Text to append to value
 * @param {string} options.prefix - Text to prepend to value
 * @param {*} options.fallback - Value to return if input is invalid
 * @param {Function|null} options.formatter - Function to format value
 * @returns {string} Rendered HTML line
 * Renders a labeled line or group of inline label-value pairs.
 
 * Supports three modes:
 *  - Single: "Label: value"
 *  - Grouped: [["Label1", val1], ["Label2", val2]]
 *  - Combined: [["Label", val, extra]] → "Label: val / extra"
 */

// ==============================
// RENDER LINE
// ==============================
export function renderLine(labelOrArray, value = null, {
  term = null,
  highlight = false,
  suffix = "",
  prefix = "",
  fallback = null,
  formatter = null,
  joiner = " / ",
} = {}) {
  if (Array.isArray(labelOrArray)) {
    const parts = labelOrArray.map(entry => {
      const [label, val, extra] = entry;

      if (
        val === null ||
        val === undefined ||
        (typeof val === "string" && val.trim() === "")
      ) return "";

      let content = String(val);

      if (extra !== undefined && extra !== null && String(extra).trim() !== "") {
        content += `${joiner}${String(extra)}`;
      }

      return `<span class="tag-label">${label}:</span> ${content}`;
    }).filter(Boolean);

    return parts.length ? parts.join(" ") + "<br>" : "";
  }

  if (
    value === null ||
    value === undefined ||
    (typeof value === "string" && value.trim() === "")
  ) {
    return fallback ?? "";
  }

  let content = formatter ? formatter(value) : String(value);
  if (highlight && term) {
    content = highlightMatch(content, term);
  }

  if (typeof labelOrArray === "string" && labelOrArray.trim() === "") {
    return `${prefix}${content}${suffix}<br>`;
  }
  return `<span class="tag-label">${labelOrArray}:</span> ${prefix}${content}${suffix}<br>`;
}
