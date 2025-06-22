// ==============================
// ARG_LOOKUP.JS
// ==============================

import { withLoadingToggle, createBounceLoader } from "../loading.js";
import { scrollPanel } from '../panels/panels_core.js';
import { formatDate } from '../utils/format_date.js';

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
      // Add placeholder at the top
      const placeholder = document.createElement("option");
      placeholder.value = "";
      placeholder.textContent = "-- Select a name --";
      placeholder.disabled = true;
      placeholder.selected = true;
      select.appendChild(placeholder);

      // Add actual names
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

  if (!select || !container) return;

  // 1. Load names into dropdown
  populateLookupDropdown();

  // 2. Listener
  select.addEventListener("change", async () => {
    const name = select.value;
    if (!name) return;
  
    const loader = createBounceLoader();
    container.innerHTML = "";
    container.appendChild(loader);
  
    try {
      const res = await fetch(`/api/lookup_schedule?name=${encodeURIComponent(name)}`);
      const data = await res.json();
  
      container.innerHTML = ""; // Clear loader
  
      if (!data.shifts || !data.shifts.length) {
        container.innerHTML = "<div class='delta-item'>No shifts found.</div>";
        return;
      }
  
      // Sort oldest → newest
      data.shifts.sort((a, b) => new Date(a.date) - new Date(b.date));
  
      // Add count header
      const header = document.createElement("div");
      header.className = "delta-item";
      header.innerHTML = `📅 Total shifts: <span>${data.shifts.length}</span>`;
      container.appendChild(header);
  
      data.shifts.forEach(({ date, shift }) => {
        const div = document.createElement("div");
        div.className = "delta-item";
        div.innerHTML = `${date} <span>${shift}</span>`;
        container.appendChild(div);
      });
  
    } catch (err) {
      console.error("Lookup fetch failed", err);
      container.innerHTML = "<div class='delta-item'>Error loading shifts.</div>";
    }
  });
