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
          const [mainTitle, ...restRaw] = entry.split(/:(.+)/);
          const rest = (restRaw || "").trim();

          const sentences = rest.split(".").map(s => s.trim()).filter(Boolean);
          const subTitle = sentences[0] || "";
          const bulletPoints = sentences.slice(1);

          // === Build elements ===
          const card = document.createElement("div");
          card.className = "info-card";

          const titleEl = document.createElement("div");
          titleEl.className = "card-title clickable-toggle toggle-open";
          titleEl.innerHTML = `${mainTitle.trim()}<span class="chevron">▼</span>`;

          const subtitleEl = document.createElement("div");
          subtitleEl.className = "card-subtitle";
          subtitleEl.textContent = subTitle;

          const listWrapper = document.createElement("div");
          listWrapper.className = "usl-wrapper show"; // start expanded

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

          // === Attach toggle behavior ===
          titleEl.addEventListener("click", () => {
            listWrapper.classList.toggle("show");
            titleEl.classList.toggle("toggle-open");
          });

          card.appendChild(titleEl);
          if (subTitle) card.appendChild(subtitleEl);
          if (bulletPoints.length) card.appendChild(listWrapper);

          wrapper.appendChild(card);
        });
      }

      container.innerHTML = "";
      container.appendChild(wrapper);
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
