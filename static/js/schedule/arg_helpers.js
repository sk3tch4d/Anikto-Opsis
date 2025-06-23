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

    const clickedText = e.target.textContent?.trim() || "";
    const fullText = delta.textContent?.trim() || "";
    const nameText = delta.dataset.name || fullText;

    const isCodeClick = /^D\d{3}$/i.test(clickedText);
    const isNameClick = clickedText.includes(",");

    let valueToSearch, selectId, panelId;

    if (isCodeClick) {
      valueToSearch = clickedText;
      selectId = "info-select";
      panelId = "arg-info-panel";
    } else if (isNameClick) {
      valueToSearch = clickedText;
      selectId = "lookup-select";
      panelId = "arg-lookup-panel";
    } else {
      if (nameText.includes(",")) {
        valueToSearch = nameText;
        selectId = "lookup-select";
        panelId = "arg-lookup-panel";
      } else {
        return;
      }
    }

    const select = document.getElementById(selectId);
    if (!select) return;

    // DEBUGGING
    console.log("🟪 Clicked text:", JSON.stringify(clickedText));
    console.log("🧬 valueToSearch:", JSON.stringify(valueToSearch));
    console.log("🟦 Matched values:", Array.from(select.options).map(o => o.value));

    const matchOption = Array.from(select.options).find(
      (opt) => opt.value.toLowerCase() === valueToSearch.toLowerCase()
    );
    if (!matchOption) return;

    select.value = matchOption.value;
    select.dispatchEvent(new Event("change"));

    openPanel(panelId);
  });
}
