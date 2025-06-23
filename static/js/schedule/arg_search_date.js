// ==============================
// ARG_SEARCH_DATE.JS
// ==============================

import { withLoadingToggle, createBounceLoader } from "../loading.js";
import { scrollPanel } from '../panels/panels_core.js';
import { formatDate } from '../utils/format_date.js';
import { formatName } from "./arg_helpers.js";

// ==============================
// DEBOUNCE LET
// ==============================
let fetchController = null;
let debounceTimer = null;

// ==============================
// DEBOUNCE FETCH WORKING DATE
// ==============================
export function fetchWorkingOnDateDebounced() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => fetchWorkingOnDate(), 300);
}

// ==============================
// FETCH SCHEDULE DATA
// ==============================
export async function fetchWorkingOnDate() {
  const dateInput = document.getElementById('working-date');
  const filterInput = document.getElementById('emp-filter');
  const resultsDiv = document.getElementById('working-date-results');
  const panelBody = document.querySelector('#arg-date-search-panel .panel-body');

  if (!dateInput || !dateInput.value || !resultsDiv || !panelBody) return;

  // Abort previous request
  if (fetchController) fetchController.abort();
  fetchController = new AbortController();

  const dateStr = dateInput.value;
  const filterValue = filterInput?.value || 'all';
  const loader = createBounceLoader(panelBody);

  withLoadingToggle(
    {
      show: [loader],
      hide: [resultsDiv]
    },
    async () => {
      resultsDiv.innerHTML = "";

      try {
        const response = await fetch(
          `/api/working_on_date?date=${dateStr}&filter=${filterValue}`,
          { signal: fetchController.signal }
        );
        const data = await response.json();
        const shiftIcons = { Day: '☀️', Evening: '🌇', Night: '🌙' };
        let html = '';

        if (data.error) {
          html = `<p class="error">${data.error}</p>`;
        } else {
          ['Day', 'Evening', 'Night'].forEach(type => {
            if (data[type]?.length) {
              html += `<h4>${shiftIcons[type]} <span class="badge badge-${type.toLowerCase()}">${type}</span></h4><div class="panel-delta">`;
              data[type].forEach(([name, shift]) => {
                const formatted = formatName(name);
                html += `
                  <div class="delta-item" data-name="${name}" data-shift="${shift}">
                    <span class="delta-name">${formatted}</span>
                    <span class="delta-code">(${shift})</span>
                  </div>
                `.trim();
              });
              html += `</div>`;
            }
            scrollPanel();
          });
          if (!html) html = "<p>No employees scheduled for this date.</p>";
        }

        resultsDiv.innerHTML = html;

      } catch (err) {
        if (err.name !== "AbortError") {
          resultsDiv.innerHTML = `<p class="error">Error fetching data</p>`;
        }
      }
    }
  );
}

// ==============================
// INIT INPUT EVENT LISTENERS
// ==============================
export function initScheduleUI() {
  const dateInput = document.getElementById("working-date");
  const customText = document.getElementById("custom-date-text");
  if (!dateInput || !customText) return;

  const filterInput = document.getElementById("emp-filter");
  if (filterInput) {
    filterInput.addEventListener("change", fetchWorkingOnDateDebounced);
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const isoDate = today.toISOString().split('T')[0];
  dateInput.value = isoDate;

  const [y, m, d] = isoDate.split('-').map(Number);
  const localToday = new Date(y, m - 1, d);
  customText.textContent = formatDate(localToday, 'short-long', { relative: true });

  fetchWorkingOnDate();

  const updateTextFromInput = () => {
    const [y, m, d] = dateInput.value.split('-').map(Number);
    const selected = new Date(y, m - 1, d);
    customText.textContent = formatDate(selected, 'short-long', { relative: true });
  };

  dateInput.addEventListener("change", () => {
    updateTextFromInput();
    fetchWorkingOnDateDebounced();
  });

  dateInput.addEventListener("input", updateTextFromInput);

  // Arrow navigation logic
  const adjustDateBy = (days) => {
    const current = new Date(dateInput.value);
    current.setDate(current.getDate() + days);
    const newISO = current.toISOString().split('T')[0];
    dateInput.value = newISO;

    const [y, m, d] = newISO.split('-').map(Number);
    const newDate = new Date(y, m - 1, d);
    customText.textContent = formatDate(newDate, 'short-long', { relative: true });

    fetchWorkingOnDateDebounced();
  };

  document.getElementById("prev-day")?.addEventListener("click", (e) => {
    e.stopPropagation();
    adjustDateBy(-1);
  });

  document.getElementById("next-day")?.addEventListener("click", (e) => {
    e.stopPropagation();
    adjustDateBy(1);
  });
}
