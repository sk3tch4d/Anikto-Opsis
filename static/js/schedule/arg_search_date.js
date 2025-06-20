// ==============================
// ARG_SEARCH_DATE.JS
// ==============================

import { withLoadingToggle, createBounceLoader } from "../loading.js";
import { scrollPanel } from '../panels/panels_core.js';

// ==============================
// FETCH SCHEDULE DATA
// ==============================
export async function fetchWorkingOnDate() {
  const dateInput = document.getElementById('working-date');
  const filterInput = document.getElementById('emp-filter');
  const resultsDiv = document.getElementById('working-date-results');
  const panelBody = document.querySelector('#arg-date-search-panel .panel-body');

  if (!dateInput || !dateInput.value || !resultsDiv || !panelBody) return;

  const dateStr = dateInput.value;
  const filterValue = filterInput?.value || 'all';  // Fallback to 'all'
  const loader = createBounceLoader(panelBody);

  withLoadingToggle(
    {
      show: [loader],
      hide: [resultsDiv]
    },
    async () => {
      resultsDiv.innerHTML = "";

      try {
        const response = await fetch(`/api/working_on_date?date=${dateStr}&filter=${filterValue}`);
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
                html += `<div class="delta-item">${name} <span>(${shift})</span></div>`;
              });
              html += `</div>`;
            }
            scrollPanel();
          });
          if (!html) html = "<p>No employees scheduled for this date.</p>";
        }

        resultsDiv.innerHTML = html;

      } catch (err) {
        resultsDiv.innerHTML = `<p class="error">Error fetching data</p>`;
      }
    }
  );
}

// ==============================
// DATE LABEL FORMATTER
// ==============================
export function updateCustomDateText(date, element) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  date.setHours(0, 0, 0, 0);

  if (date.getTime() === today.getTime()) {
    element.textContent = "Today";
    return;
  } else if (date.getTime() === tomorrow.getTime()) {
    element.textContent = "Tomorrow";
    return;
  }

  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];
  const getOrdinal = (n) => {
    if (n > 3 && n < 21) return "th";
    switch (n % 10) {
      case 1: return "st";
      case 2: return "nd";
      case 3: return "rd";
      default: return "th";
    }
  };

  const weekday = dayNames[date.getDay()];
  const month = monthNames[date.getMonth()];
  const day = date.getDate();
  element.textContent = `${weekday} ${month} ${day}${getOrdinal(day)}`;
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
    filterInput.addEventListener("change", () => {
      fetchWorkingOnDate();
    });
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const isoDate = today.toISOString().split('T')[0];
  dateInput.value = isoDate;

  const [y, m, d] = isoDate.split('-').map(Number);
  const localToday = new Date(y, m - 1, d);
  updateCustomDateText(localToday, customText);
  fetchWorkingOnDate();

  dateInput.addEventListener("change", () => {
    const [y, m, d] = dateInput.value.split('-').map(Number);
    const selected = new Date(y, m - 1, d);
    updateCustomDateText(selected, customText);
    fetchWorkingOnDate();
  });

  dateInput.addEventListener("input", () => {
    const [y, m, d] = dateInput.value.split('-').map(Number);
    const selected = new Date(y, m - 1, d);
    updateCustomDateText(selected, customText);
  });
}
