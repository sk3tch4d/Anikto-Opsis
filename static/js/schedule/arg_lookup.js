// ==============================
// ARG_LOOKUP.JS
// ==============================

import { withLoadingToggle, createBounceLoader, toggleLoadingState } from "../loading.js";
import { scrollPanel } from '../panels/panels_core.js';
import { formatName, formatShortName } from "./arg_helpers.js";
import { formatDate } from '../utils/format_date.js';

let bounceLoader;

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
      placeholder.textContent = "Select Name ▼";
      placeholder.disabled = true;
      placeholder.selected = true;
      select.appendChild(placeholder);

      const sorted = data.names.sort((a, b) => {
        const [la, fa] = a.split(',').map(s => s.trim().toLowerCase());
        const [lb, fb] = b.split(',').map(s => s.trim().toLowerCase());
        return fa.localeCompare(fb);
      });
      
      sorted.forEach(name => {
        const opt = document.createElement("option");
        const full = formatName(name);
        opt.value = name;
        opt.textContent = full;
        opt.title = full;
        opt.dataset.full = full;
        opt.dataset.short = formatShortName(name);
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

    // Only update display if on mobile AND name is long
    const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    const selectedIndex = select.selectedIndex;
    const opt = select.options[selectedIndex];

    if (isMobile && opt && opt.dataset.full && opt.dataset.full.length > 18) {
      opt.textContent = opt.dataset.short;
    } else if (opt && opt.dataset.full) {
      opt.textContent = opt.dataset.full;
    }

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
      header.innerHTML = `📅 Total Shifts: <span>${data.shifts.length}</span>`;
      container.appendChild(header);

      const spacer = document.createElement("div");
      spacer.style.margin = "10px 0";
      container.appendChild(spacer);

      const shiftIcons = { Day: '☀️', Evening: '🌇', Night: '🌙' };

      data.shifts.forEach(({ date, shift, type }) => {
        const icon = shiftIcons[type] || '';
        const friendly = formatDate(new Date(date), 'long', { relative: true });
      
        const div = document.createElement("div");
        div.className = "delta-item";
        div.setAttribute("data-shift", shift);
      
        div.innerHTML = `
          <span class="delta-inline">
            ${icon} <span class="delta-code">${shift}</span>
          </span>
          <span class="delta-date">${friendly}</span>
        `.trim();
      
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

  select.addEventListener("change", renderSchedule);
  filterSelect.addEventListener("change", renderSchedule);
}
