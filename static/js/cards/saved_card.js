// ==============================
// SAVED_CARD.JS
// ==============================

import { showToast, hapticFeedback, attachChevron } from '../ui-utils.js';
import { clearTextSelect } from '../search-utils.js';


// ==============================
// CREATE SAVED CARD TOGGLE
// ==============================
/**
 * Create a toggle handler to save/remove a card.
 * @param {Map} savedItems - The Map object that tracks saved items.
 * @param {Function} updateSavedPanel - A function to update the corresponding saved panel.
 */
export function createSavedCardToggle(savedItems, updateSavedPanel) {
  return function(card, base, matching = null) {
    const key = base?.Num;
    if (!key) return;

    if (savedItems.has(key)) {
      savedItems.delete(key);
      card.classList.remove("saved-card");
      showToast("Removed!");
    } else {
      const clone = card.cloneNode(true);
      const data = matching ? { card: clone, data: matching } : clone;
      savedItems.set(key, data);
      card.classList.add("saved-card");
      showToast("Saved!");
    }

    hapticFeedback();
    clearTextSelect();
    updateSavedPanel();
  };
}

// ==============================
// CREATE SAVED CARD UPDATER
// ==============================
/**
 * Create a function to update the saved panel UI.
 * 
 * @param {Object} options
 * @param {string} options.selector - Query selector for the panel body.
 * @param {Map} options.savedItems - The same Map used by toggle.
 */
export function createSavedCardUpdater({
  selector,
  savedItems,
  emptyHTML = "<p>No items saved yet.</p><br><br><p>Double click a tile to save!</p>",
  chevronColor = "#0a0b0f",
  searchSetup = null
}) {
  return function () {
    const savedPanel = document.querySelector(selector);
    if (!savedPanel) return;

    savedPanel.innerHTML = "";

    const entries = Array.from(savedItems.values()).map(entry => entry.card || entry).reverse();

    if (entries.length === 0) {
      savedPanel.innerHTML = emptyHTML;
      return;
    }

    entries.forEach(clone => {
      const freshClone = clone.cloneNode(true);
      savedPanel.appendChild(freshClone);
    });

    requestAnimationFrame(() => {
      const toggles = savedPanel.querySelectorAll(".clickable-toggle");
      toggles.forEach(toggle => {
        toggle.addEventListener("click", () => {
          const wrapper = toggle.nextElementSibling;
          if (wrapper?.classList.contains("toggle-wrapper")) {
            wrapper.classList.toggle("open");
            const chevron = toggle.querySelector(".chevron");
            if (chevron) chevron.classList.toggle("rotated");
          }
        });
      });

      if (typeof searchSetup === "function") {
        searchSetup(); // optional
      }
    });
  };
}
