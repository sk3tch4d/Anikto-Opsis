// ==============================
// SAVED_CARD.JS
// ==============================

import { showToast, hapticFeedback, attachChevron } from '../ui-utils.js';
import { clearTextSelect } from '../search-utils.js';

// ==============================
// SHOW NOTE POPUP
// ==============================
export function showNotePopup({ onSave }) {
  if (document.getElementById("note-form")) return;

  const form = document.createElement("form");
  form.id = "note-form";
  form.classList.add("popup-form");

  const closeBtn = document.createElement("div");
  closeBtn.textContent = "×";
  closeBtn.classList.add("close-btn");
  closeBtn.onclick = () => form.remove();

  const input = document.createElement("input");
  input.classList.add("input", "full-width");
  input.type = "text";
  input.placeholder = "Optional note...";
  input.maxLength = 100;
  input.required = false;

  const saveBtn = document.createElement("button");
  saveBtn.type = "submit";
  saveBtn.textContent = "Save Card";
  saveBtn.classList.add("button", "full-width-on", "panel-animate");

  form.appendChild(document.createElement("br"));
  form.appendChild(input);
  form.appendChild(saveBtn);
  form.appendChild(closeBtn);

  document.body.appendChild(form);

  requestAnimationFrame(() => input.focus());

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const note = input.value.trim();
    onSave(note);
    form.remove();
  });
}

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
      hapticFeedback();
      clearTextSelect();
      updateSavedPanel();
      return;
    }

    // Prompt for optional note before saving
    showNotePopup({
      onSave: (note) => {
        const clone = card.cloneNode(true);

        // Ensure data is always an array for compatibility with downloadTable
        // const formattedData = Array.isArray(matching) ? matching : [matching];
        const formattedData = Array.isArray(matching)
          ? matching
          : matching
            ? [matching]
            : base
              ? [base]
              : [];

        const data = {
          card: clone,
          data: formattedData,
          note: note || ""
        };

        savedItems.set(key, data);
        card.classList.add("saved-card");
        showToast("Saved!");
        hapticFeedback();
        clearTextSelect();
        updateSavedPanel();
      }
    });
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

    const entries = Array.from(savedItems.values())
      .map(entry => entry.card ? entry : { card: entry, note: "" })
      .reverse();

    if (entries.length === 0) {
      savedPanel.innerHTML = emptyHTML;
      return;
    }

    entries.forEach(({ card, note }) => {
      const freshClone = card.cloneNode(true);

      // Inject note element
      if (note) {
        const noteEl = document.createElement("div");
        noteEl.className = "saved-note";
        noteEl.innerHTML = `<span class="tag-label">Note:</span> ${note}`;
        freshClone.appendChild(noteEl);
      }

      freshClone.querySelectorAll(".clickable-toggle").forEach(toggle => {
        toggle.removeAttribute("data-toggle-bound");
      });

      savedPanel.appendChild(freshClone);
    });

    requestAnimationFrame(() => {
      attachChevron({ root: savedPanel, chevronColor });

      if (typeof searchSetup === "function") {
        searchSetup(savedPanel);
      }
    });
  };
}
