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
logInfo("setupDeltaToLookup initialized");

document.addEventListener("click", (e) => {
  const delta = e.target.closest(".delta-item");
  if (!delta) {
    logWarn("Clicked element is not inside a .delta-item");
    return;
  }

  logDebug(".delta-item clicked", delta);

  const rawText = e.target.textContent?.trim();
  const nameText = delta.dataset.name || delta.textContent?.trim();

  logDebug("rawText", rawText);
  logDebug("nameText (from delta)", nameText);

  if (!nameText || nameText.length > 60) {
    logWarn("nameText is invalid or too long");
    return;
  }

  const isCode = /^D\d{3}$/i.test(rawText);
  const isName = nameText.includes(",");

  let valueToSearch = nameText;
  let selectId = "lookup-select";
  let panelId = "arg-lookup-panel";

  if (isCode) {
    valueToSearch = `Assignment ${rawText}`;
    selectId = "info-select";
    panelId = "arg-info-panel";
  }

  logDebug("valueToSearch", valueToSearch);
  logDebug("Target select", selectId);
  logDebug("Target panel", panelId);

  const select = document.getElementById(selectId);
  if (!select) {
    logError(`Select element #${selectId} not found`);
    return;
  }

  const matchOption = Array.from(select.options).find(
    (opt) => opt.value.toLowerCase() === valueToSearch.toLowerCase()
  );

  if (!matchOption) {
    logWarn("No matching option in select for", valueToSearch);
    return;
  }

  logInfo("Match found", matchOption.value);

  select.value = matchOption.value;
  select.dispatchEvent(new Event("change"));

  const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  matchOption.textContent = (isMobile && matchOption.dataset.full?.length > 18)
    ? matchOption.dataset.short
    : matchOption.dataset.full;

  logInfo("Opening panel", panelId);
  openPanel(panelId);
});
