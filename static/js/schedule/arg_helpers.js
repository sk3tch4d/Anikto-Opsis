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

    const rawClickedText = e.target.textContent?.trim();
    if (!rawClickedText) return;

    // Step 1: Decide if it's a code (e.g. D103) or a name
    const isCode = /^[A-Z]\d{3,4}$/.test(rawClickedText); // Match something like D103, N204, etc.
    const isInitialNameFormat = /^[A-Z][a-z]+, [A-Z]/.test(rawClickedText); // Last, First

    let valueKey = "";
    let selectId = "";
    let panelId = "";

    if (isCode) {
      valueKey = `Assignment ${rawClickedText}`;
      selectId = "info-select";
      panelId = "arg-info-panel";
    } else if (isInitialNameFormat) {
      valueKey = rawClickedText;
      selectId = "lookup-select";
      panelId = "arg-lookup-panel";
    } else {
      console.warn("Unrecognized click format:", rawClickedText);
      return;
    }

    const select = document.getElementById(selectId);
    if (!select) return;

    const matchOption = Array.from(select.options).find(
      (opt) => opt.value.toLowerCase() === valueKey.toLowerCase()
    );
    if (!matchOption) {
      console.warn(`No match found in #${selectId} for:`, valueKey);
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
