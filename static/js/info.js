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
          const [mainTitle, restRaw] = entry.split(/:(.+)/); // keep everything after first :
          const rest = (restRaw || "").trim();

          // Split into sentences
          const sentences = rest.split(".").map(s => s.trim()).filter(Boolean);
          const subTitle = sentences[0] || "";
          const bulletPoints = sentences.slice(1);

          const card = document.createElement("div");
          card.className = "info-card";

          const titleEl = document.createElement("div");
          titleEl.className = "card-title";
          titleEl.textContent = mainTitle.trim();

          const subTitleEl = document.createElement("div");
          subTitleEl.className = "card-subtitle";
          subTitleEl.textContent = subTitle;

          const ul = document.createElement("ul");
          ul.className = "card-list";
          bulletPoints.forEach(point => {
            const li = document.createElement("li");
            li.textContent = point;
            ul.appendChild(li);
          });

          card.appendChild(titleEl);
          if (subTitle) card.appendChild(subTitleEl);
          if (bulletPoints.length) card.appendChild(ul);

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
