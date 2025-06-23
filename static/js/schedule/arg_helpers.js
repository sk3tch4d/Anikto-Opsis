// ==============================
// ARG_HELPERS.JS
// ==============================

import { openPanel } from '../panels/panels_core.js';

// ==============================
// FORMAT NAME
// ==============================
export function formatName(raw) {
  if (!raw.includes(",")) return raw;
  const [last, firstPart] = raw.split(",").map(s => s.trim().toLowerCase());
  if (!firstPart || !last) return raw;

  const titleCase = str => str.split(" ").map(
    word => word.charAt(0).toUpperCase() + word.slice(1)
  ).join(" ");

  return `${titleCase(firstPart)} ${titleCase(last)}`;
}

// ==============================
// FORMAT SHORT NAME FOR SELECT
// ==============================
export function formatShortName(raw) {
  if (!raw.includes(",")) return raw;
  const [last, first] = raw.split(",").map(s => s.trim().toLowerCase());
  if (!first || !last) return raw;
  return `${first[0].toUpperCase() + first.slice(1)} ${last[0].toUpperCase()}.`;
}

// ==============================
// SET DELTA TO LOOKUP
// ==============================
export function setupDeltaToLookup() {
  document.addEventListener("click", (e) => {
    const delta = e.target.closest(".delta-item");
    if (!delta) return;

    const nameText = delta.dataset.name;
    if (!nameText) return;

    // Clear and readable logic
    const isAssignment = nameText.startsWith("Assignment");
    const isPersonName = nameText.includes(",");

    // Reject anything that's neither
    if (!isAssignment && !isPersonName) return;

    // Optional: guard against malformed or garbage data
    if (nameText.length > 60) return;

    const selectId = isAssignment ? "info-select" : "lookup-select";
    const panelId = isAssignment ? "arg-info-panel" : "arg-lookup-panel";

    const select = document.getElementById(selectId);
    if (!select) {
      console.warn(`❌ Missing <select id="${selectId}">`);
      return;
    }

    const matchOption = Array.from(select.options).find(
      (opt) => opt.value.toLowerCase() === nameText.toLowerCase()
    );

    if (!matchOption) {
      console.warn(`❌ No match for "${nameText}" in #${selectId}`);
      return;
    }

    select.value = matchOption.value;
    select.dispatchEvent(new Event("change"));

    const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (isMobile && matchOption.dataset.full?.length > 18) {
      matchOption.textContent = matchOption.dataset.short;
    } else {
      matchOption.textContent = matchOption.dataset.full;
    }

    openPanel(panelId);
  });
}
