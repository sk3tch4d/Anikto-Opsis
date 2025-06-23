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
  console.log("🟢 setupDeltaToLookup initialized");

  document.addEventListener("click", (e) => {
    const delta = e.target.closest(".delta-item");
    if (!delta) {
      console.log("❌ Clicked element is not inside a .delta-item");
      return;
    }

    console.log("🟡 .delta-item clicked:", delta);

    const rawText = e.target.textContent?.trim();
    const nameText = delta.dataset.name || delta.textContent?.trim();

    console.log("🔤 rawText:", rawText);
    console.log("🔤 nameText (from delta):", nameText);

    if (!nameText || nameText.length > 60) {
      console.log("❌ nameText is invalid or too long");
      return;
    }

    const isCode = /^D\d{3}$/i.test(rawText); // e.g., D306
    const isName = nameText.includes(",");

    let valueToSearch = nameText;
    let selectId = "lookup-select";
    let panelId = "arg-lookup-panel";

    if (isCode) {
      valueToSearch = `Assignment ${rawText}`;
      selectId = "info-select";
      panelId = "arg-info-panel";
    } else if (isName) {
      selectId = "lookup-select";
      panelId = "arg-lookup-panel";
    }

    console.log("🔍 valueToSearch:", valueToSearch);
    console.log("🧭 Target select:", selectId);
    console.log("📦 Target panel:", panelId);

    const select = document.getElementById(selectId);
    if (!select) {
      console.log(`❌ Select element #${selectId} not found`);
      return;
    }

    const matchOption = Array.from(select.options).find(
      (opt) => opt.value.toLowerCase() === valueToSearch.toLowerCase()
    );

    if (!matchOption) {
      console.log("❌ No matching option in select for:", valueToSearch);
      return;
    }

    console.log("✅ Match found:", matchOption.value);

    select.value = matchOption.value;
    select.dispatchEvent(new Event("change"));

    const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (isMobile && matchOption.dataset.full?.length > 18) {
      matchOption.textContent = matchOption.dataset.short;
    } else {
      matchOption.textContent = matchOption.dataset.full;
    }

    console.log("📂 Opening panel:", panelId);
    openPanel(panelId);
  });
}
