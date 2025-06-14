// ==============================
// INFO.JS
// ==============================


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
          const [title, ...rest] = entry.split(":");
          const description = rest.join(":").trim();

          const card = document.createElement("div");
          card.className = "info-card";

          const titleEl = document.createElement("div");
          titleEl.className = "card-title";
          titleEl.textContent = title.trim();

          const bodyEl = document.createElement("div");
          bodyEl.className = "card-body";
          bodyEl.textContent = description;

          card.appendChild(titleEl);
          card.appendChild(bodyEl);

          wrapper.appendChild(card);
        });
      }

      container.innerHTML = "";
      container.appendChild(wrapper);
    })
    .catch(err => {
      container.innerHTML = `
        <div class="info-card">${errorMsg}</div>
      `;
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
