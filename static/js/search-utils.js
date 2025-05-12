// ==============================
// SEARCH-UTILS.JS
// Shared Search Utilities
// ==============================

import { openPanelById, scrollPanel } from "./panels.js";
import { removeFocus } from "./helpers.js";

// ==============================
// CLEAR TEXT SELECTION
// ==============================
function clearTextSelect() {
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
    openPanelById(panelId);
  }
}

// ==============================
// PARSE TO SEARCH MODULE (Event Delegation)
// ==============================
export function setupParseStats() {
  let pressTimer = null;

  // ====== Cache DOM elements ======
  const searchInput = document.getElementById("inventory-search");
  const uslFilter = document.getElementById("usl-filter");

  // ====== Normal Click to Search ======
  document.addEventListener("click", function (e) {
    const matchTarget = e.target.closest(".clickable-match, .clickable-stat");

    if (matchTarget) {
      const searchValue = matchTarget.getAttribute("data-search");
      const filterValue = matchTarget.getAttribute("data-filter");

      if (uslFilter) {
        if (filterValue && Array.from(uslFilter.options).some(opt => opt.value === filterValue)) {
          uslFilter.value = filterValue;
        } else {
          uslFilter.value = "All";
        }
        uslFilter.dispatchEvent(new Event("change"));
      }

      if (searchInput) {
        if (searchValue) {
          searchInput.value = searchValue;
          searchInput.dispatchEvent(new Event("input"));
        }
      }

      const searchPanel = document.getElementById("inventory-search-panel");
      if (searchPanel && !searchPanel.classList.contains("open")) {
        openPanelById("inventory-search-panel");
      }

      scrollPanel();
      removeFocus(matchTarget);
    }
  }, { passive: true });

  // ====== Long Press Reset ======
  document.addEventListener("mousedown", startLongPress);
  document.addEventListener("touchstart", startLongPress);
  document.addEventListener("mouseup", clearLongPress);
  document.addEventListener("touchend", clearLongPress);
  document.addEventListener("mouseleave", clearLongPress);

  function startLongPress(e) {
    const inputMatch = e.target.closest("#inventory-search");
    const filterMatch = e.target.closest("#usl-filter");

    if (inputMatch) {
      pressTimer = setTimeout(() => {
        if (searchInput) {
          searchInput.value = "";
          searchInput.dispatchEvent(new Event("input"));
          triggerVibration();
          showToast("Search cleared");
        }
      }, 600);
    }

    if (filterMatch) {
      pressTimer = setTimeout(() => {
        if (uslFilter) {
          uslFilter.value = "All";
          uslFilter.dispatchEvent(new Event("change"));
          removeFocus(uslFilter);
          triggerVibration();
          showToast("Filter reset");
        }
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

// ==============================
// HAPTIC VIBRATION
// ==============================
function triggerVibration() {
  if (navigator.vibrate) {
    navigator.vibrate(50); // Slightly longer vibration (better feedback)
  }
}

// ==============================
// TOAST FEEDBACK
// ==============================
function showToast(message) {
  let toast = document.getElementById("toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "toast";
    toast.className = "toast-message";
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add("show");
  setTimeout(() => {
    toast.classList.remove("show");
  }, 1800);
}
