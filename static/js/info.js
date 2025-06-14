// ==============================
// INFO.JS
// ==============================

import { attachChevron } from './ui-utils.js';

// ==============================
// LOAD INFO SECTION
// ==============================
function loadInfoSection({ elementId, url, errorMsg }) {
  const container = document.getElementById(elementId);
  if (!container) return;

  fetch(url)
    .then(res => {
      if (!res.ok) throw new Error(`Failed to load data from ${url}`);
      return res.json();
    })
    .then(data => {
      const wrapper = document.createElement("div");

      if (!Array.isArray(data) || data.length === 0) {
        const fallback = document.createElement("div");
        fallback.className = "info-card";
        fallback.textContent = "No data found.";
        wrapper.appendChild(fallback);
      } else {
        data.forEach(entry => {
          const [mainTitle, restRaw] = entry.split(/:(.+)/);  // Safe: only two parts
          const rest = (restRaw || "").trim();

          const sentences = rest.split(".").map(s => s.trim()).filter(Boolean);
          const subTitle = sentences[0] || "";
          const bulletPoints = sentences.slice(1);

          // === Build card ===
          const card = document.createElement("div");
          card.className = "info-card";

          // Subtitle with chevron toggle
          const titleEl = document.createElement("div");
          titleEl.className = "card-title";
          titleEl.textContent = mainTitle.trim();

          // Subtitle
          const subtitleEl = document.createElement("div");
          subtitleEl.className = "card-subtitle clickable-toggle toggle-open";
          subtitleEl.innerHTML = `${subTitle} <span class="chevron">▼</span>`;

          // Bulleted list (initially hidden)
          const listWrapper = document.createElement("div");
          listWrapper.className = "toggle-wrapper";

          if (bulletPoints.length) {
            const ul = document.createElement("ul");
            ul.className = "card-list";

            bulletPoints.forEach(point => {
              const li = document.createElement("li");
              li.textContent = point;
              ul.appendChild(li);
            });

            listWrapper.appendChild(ul);
          }

          card.appendChild(titleEl);
          if (subTitle) card.appendChild(subtitleEl);
          if (bulletPoints.length) card.appendChild(listWrapper);

          wrapper.appendChild(card);
        });
      }

      // Appended Cards to Wrapper
      container.innerHTML = "";
      container.appendChild(wrapper);

      // Attach Toggle
      attachChevron({ root: wrapper });
    })
    .catch(err => {
      container.innerHTML = `<div class="info-card">${errorMsg}</div>`;
      console.error(`[info.js] Error loading ${url}:`, err);
    });
}

// ==============================
// LOAD INFO FEATURES
// ==============================
export function loadInfoFeatures() {
  loadInfoSection({
    elementId: "info-features",
    url: "/static/features.json",
    errorMsg: "Unable to fetch features."
  });
}

// ==============================
// LOAD INFO UPDATES
// ==============================
export function loadInfoUpdates() {
  loadInfoSection({
    elementId: "info-updates",
    url: "/static/updates.json",
    errorMsg: "Unable to fetch updates."
  });
}
