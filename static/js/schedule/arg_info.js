// ==============================
// ARG_INFO.JS
// ==============================

import { scrollPanel } from '../panels/panels_core.js';

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

    select.addEventListener("change", () => renderAssignmentInfo(data, select.value));
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

    const valueWrapper = createSpanWrapper(value);

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

// ==============================
// CREATE SPAN WRAPPER
// ==============================
function createSpanWrapper(value) {
  const wrapper = document.createElement("span");

  if (typeof value === "string" && value.includes(" - ")) {
    const parts = value.split(" - ");
    parts.forEach(part => {
      const span = document.createElement("span");
      span.textContent = part;
      span.style.marginRight = "6px"; // clean spacing
      wrapper.appendChild(span);
    });
  } else {
    wrapper.textContent = value;
  }

  return wrapper;
}
