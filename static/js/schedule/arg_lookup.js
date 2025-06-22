// ==============================
// ARG_LOOKUP.JS
// ==============================

import { withLoadingToggle, createBounceLoader, toggleLoadingState } from "../loading.js";
import { scrollPanel } from '../panels/panels_core.js';
import { formatDate } from '../utils/format_date.js';

let bounceLoader;

// ==============================
// FORMAT NAME
// ==============================
function formatName(raw) {
  if (!raw.includes(",")) return raw;
  const [last, first] = raw.split(",").map(s => s.trim().toLowerCase());
  if (!first || !last) return raw;
  return `${first[0].toUpperCase() + first.slice(1)} ${last[0].toUpperCase() + last.slice(1)}`;
}

// ==============================
// POPULATE LOOKUP DROPDOWN
// ==============================
export async function populateLookupDropdown() {
  const select = document.getElementById("lookup-select");
  if (!select) return;

  try {
    const res = await fetch("/api/lookup_names");
    const data = await res.json();

    if (data.names && Array.isArray(data.names)) {
      const placeholder = document.createElement("option");
      placeholder.value = "";
      placeholder.textContent = "-- Select a name --";
      placeholder.disabled = true;
      placeholder.selected = true;
      select.appendChild(placeholder);

      data.names.forEach(name => {
        const opt = document.createElement("option");
        opt.value = name;
        opt.textContent = formatName(name);
        select.appendChild(opt);
      });
      scrollPanel();
    }
  } catch (err) {
    console.error("Failed to fetch lookup names:", err);
  }
}

// ==============================
// INIT LOOKUP DISPLAY
// ==============================
export function initLookupUI() {
  const select = document.getElementById("lookup-select");
  const container = document.getElementById("lookup-container");
  const panelBody = document.querySelector("#arg-lookup-panel .panel-body");
  const filterSelect = document.getElementById("lookup-filter");

  if (!select || !container || !panelBody || !filterSelect) return;

  bounceLoader = createBounceLoader(panelBody);
  populateLookupDropdown();

  async function renderSchedule() {
    const name = select.value;
    const filter = filterSelect.value;
  
    if (!name) return;
  
    toggleLoadingState(true, { show: [bounceLoader], hide: [container] });
  
    try {
      const res = await fetch(`/api/lookup_schedule?name=${encodeURIComponent(name)}&filter=${filter}`);
      const data = await res.json();
  
      container.innerHTML = "";
  
      if (!data.shifts || !data.shifts.length) {
        container.innerHTML = "<div class='delta-item'>No shifts found.</div>";
        return;
      }
  
      data.shifts.sort((a, b) => new Date(a.date) - new Date(b.date));
  
      const header = document.createElement("div");
      header.className = "delta-item";
      header.innerHTML = `📅 Total shifts: <span>${data.shifts.length}</span>`;
      container.appendChild(header);
  
      data.shifts.forEach(({ date, shift }) => {
        const div = document.createElement("div");
        div.className = "delta-item";
        div.innerHTML = `${shift} <span>${date}</span>`;
        container.appendChild(div);
      });
  
      scrollPanel();
    } catch (err) {
      console.error("Lookup fetch failed", err);
      container.innerHTML = "<div class='delta-item'>Error loading shifts.</div>";
    } finally {
      toggleLoadingState(false, { show: [bounceLoader], hide: [container] });
    }
  }

  // Trigger render on both name or filter change
  select.addEventListener("change", renderSchedule);
  filterSelect.addEventListener("change", renderSchedule);
}
