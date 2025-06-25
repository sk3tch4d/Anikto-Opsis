// ==============================
// ARG_INFO.JS
// ==============================

import { scrollPanel } from '../panels/panels_core.js';
import { updateNavButtons } from '../utils/nav_buttons.js';

// ==============================
// GLOBAL CONSTANT
// ==============================

const NAV_BUTTON_MODE = "fade";

// ==============================
// POPULATE DROPDOWN INFO
// ==============================
export async function populateDropdownInfo() {
  const select = document.getElementById("info-select");
  if (!select) return;

  try {
    const res = await fetch("/static/arg_shifts.json");
    const data = await res.json();

    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = "Select Assignment ▼";
    placeholder.disabled = true;
    placeholder.selected = true;
    select.appendChild(placeholder);

    Object.keys(data).sort().forEach(key => {
      const opt = document.createElement("option");
      opt.value = key;
      opt.textContent = `Assignment ${key}`;
      select.appendChild(opt);
    });

    select.addEventListener("change", () => {
      renderAssignmentInfo(data, select.value);
      updateNavButtons(select, "prev-info", "next-info", NAV_BUTTON_MODE);
    });

    document.getElementById("prev-info")?.addEventListener("click", (e) => {
    e.stopPropagation();
    const current = select.selectedIndex;
    if (current > 1) {
      select.selectedIndex = current - 1;
      select.dispatchEvent(new Event("change"));
    }
  });

  document.getElementById("next-info")?.addEventListener("click", (e) => {
    e.stopPropagation();
    const current = select.selectedIndex;
    if (current < select.options.length - 1) {
      select.selectedIndex = current + 1;
      select.dispatchEvent(new Event("change"));
    }
  });

  } catch (err) {
    console.error("Failed to load assignment data:", err);

    if (select) {
      select.innerHTML = "";
      const failOpt = document.createElement("option");
      failOpt.textContent = "⚠️ Failed to load assignments";
      failOpt.disabled = true;
      failOpt.selected = true;
      select.appendChild(failOpt);
    }
  }

  updateNavButtons(select, "prev-info", "next-info", NAV_BUTTON_MODE);
}

// ==============================
// RENDER ASSIGNMENT INFO
// ==============================
function renderAssignmentInfo(data, key) {
  const container = document.getElementById("info-container");
  container.innerHTML = "";

  if (!data[key]) {
    container.innerHTML = "<div class='delta-item'>No data available.</div>";
    return;
  }

  const assignment = data[key];

  const spacerTop = document.createElement("div");
  spacerTop.style.margin = "10px 0";
  container.appendChild(spacerTop);

  let isFirst = true;

  Object.entries(assignment).forEach(([subkey, value]) => {
    const div = document.createElement("div");
    div.className = "delta-item";

    const label = document.createElement("strong");
    label.textContent = `${subkey}: `;

    const valueWrapper = document.createElement("span");

    if (subkey === "Shift") {
      let parts;
    
      if (value.includes(" - ")) {
        parts = value.split(" - ");
      } else {
        const timePattern = /\b\d{1,2}-\d{1,2}\b/;
        const match = value.match(timePattern);
        if (match) {
          const time = match[0];
          const prefix = value.replace(time, "").trim();
          parts = [prefix, time];
        } else {
          parts = [value];
        }
      }
    
      parts.forEach(part => {
        const partSpan = document.createElement("span");
        partSpan.textContent = part;
        partSpan.style.marginRight = "8px";
        partSpan.style.padding = "4px 8px";
        partSpan.style.display = "inline-block";
        valueWrapper.appendChild(partSpan);
      });
    } else {
      valueWrapper.textContent = value;
    }

    div.appendChild(label);
    div.appendChild(valueWrapper);
    container.appendChild(div);

    if (isFirst) {
      const spacer = document.createElement("div");
      spacer.style.margin = "10px 0";
      container.appendChild(spacer);
      isFirst = false;
    }
  });

  scrollPanel();
}
