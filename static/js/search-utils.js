// ==============================
// SEARCH-UTILS.JS
// ==============================

import { openPanel, scrollPanel } from './panels/panels_core.js';
import { removeFocus } from "./helpers.js";
import { showToast, hapticFeedback } from "./ui-utils.js";

// ==============================
// DEBOUNCE
// ==============================
export function debounce(fn, wait) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn.apply(this, args), wait);
  };
}

// ==============================
// CLEAR TEXT SELECTION
// ==============================
export function clearTextSelect() {
  if (window.getSelection) {
    const sel = window.getSelection();
    if (sel && !sel.isCollapsed) {
      sel.removeAllRanges();
    }
  } else if (document.selection) {
    document.selection.empty();
  }
}

// ==============================
// TRIGGER SEARCH FROM STAT
// ==============================
export function searchFromStat(inputId, value) {
  const input = document.getElementById(inputId);
  if (input) {
    input.value = value;
    input.dispatchEvent(new Event("input"));
    const panelId = `${inputId}-panel`;
    openPanel(panelId);
  }
}

// ==============================
// PARSE TO SEARCH MODULE (Event Delegation)
// ==============================
export function setupParseStats(selector, inputId, attr, filterId = null, filterAttr = "data-filter") {
  let pressTimer = null;

  const inputEl = document.getElementById(inputId);
  const filterEl = filterId ? document.getElementById(filterId) : null;
  const panelId = `${inputId}-panel`;

  // ====== Normal Click to Search ======
  document.addEventListener("click", function (e) {
    const matchTarget = e.target.closest(selector);
    if (!matchTarget) return;

    const searchValue = matchTarget.getAttribute(attr);
    const filterValue = matchTarget.getAttribute(filterAttr);

    if (filterEl) {
      if (filterValue && Array.from(filterEl.options).some(opt => opt.value === filterValue)) {
        filterEl.value = filterValue;
      } else {
        filterEl.value = "All";
      }
      filterEl.dispatchEvent(new Event("change"));
    }

    if (inputEl && searchValue) {
      inputEl.value = searchValue;
      inputEl.dispatchEvent(new Event("input"));
    }

    const panelEl = document.getElementById(panelId);
    if (panelEl && !panelEl.classList.contains("open")) {
      openPanel(panelId);
    }

    scrollPanel();
    removeFocus(matchTarget);
  }, { passive: true });

  // ====== Long Press Reset ======
  document.addEventListener("mousedown", startLongPress);
  document.addEventListener("touchstart", startLongPress);
  document.addEventListener("mouseup", clearLongPress);
  document.addEventListener("touchend", clearLongPress);
  document.addEventListener("mouseleave", clearLongPress);

  function startLongPress(e) {
    const inputMatch = e.target.closest(`#${inputId}`);
    const filterMatch = filterId ? e.target.closest(`#${filterId}`) : null;

    if (inputMatch) {
      pressTimer = setTimeout(() => {
        inputEl.value = "";
        inputEl.dispatchEvent(new Event("input"));
        hapticFeedback();
        showToast("Search cleared");
      }, 600);
    }

    if (filterMatch && filterEl) {
      pressTimer = setTimeout(() => {
        filterEl.value = "All";
        filterEl.dispatchEvent(new Event("change"));
        removeFocus(filterEl);
        hapticFeedback();
        showToast("Filter reset");
      }, 600);
    }
  }

  function clearLongPress() {
    clearTimeout(pressTimer);
    pressTimer = null;
  }
}



// ==============================
// MATCH HIGHLIGHTING
// ==============================
export function highlightMatch(text, term) {
  if (!term || !text) return escapeHtml(text);

  const safeText = escapeHtml(text);
  const safeTerm = escapeRegExp(term);

  const regex = new RegExp(`(${safeTerm})`, "ig");
  return safeText.replace(regex, `<span class="highlight">$1</span>`);
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
