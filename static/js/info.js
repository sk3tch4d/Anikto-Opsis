// ==============================
// INFO.JS
// ==============================


// ==============================
// LOAD INFO SECTION
// ==============================
function loadInfoSection({ elementId, url, errorMsg, formatter }) {
  const container = document.getElementById(elementId);
  if (!container) return;

  fetch(url)
    .then(res => {
      if (!res.ok) throw new Error(`Failed to load data from ${url}`);
      return res.json();
    })
    .then(data => {
      const wrapper = document.createElement("div");
      wrapper.className = "panel-delta";

      if (!Array.isArray(data) || data.length === 0) {
        wrapper.innerHTML = "<div class='delta-item'>No data found.</div>";
      } else {
        data.forEach(entry => {
          const item = formatter
            ? formatter(entry)
            : (() => {
                const el = document.createElement("div");
                el.className = "delta-item";
                el.textContent = entry;
                return el;
              })();
          wrapper.appendChild(item);
        });
      }

      container.innerHTML = "";
      container.appendChild(wrapper);
    })
    .catch(err => {
      container.innerHTML = `
        <div class='panel-delta'>
          <div class='delta-item'>${errorMsg}</div>
        </div>
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
    errorMsg: "Unable to fetch features.",
    formatter: (entry) => {
      const [title, ...rest] = entry.split(":");
      const description = rest.join(":").trim();

      const item = document.createElement("div");
      item.className = "delta-item";

      const titleEl = document.createElement("div");
      titleEl.className = "delta-title"; // style this class in your CSS
      titleEl.textContent = title.trim();

      const bodyEl = document.createElement("div");
      bodyEl.className = "delta-body"; // optional class
      bodyEl.textContent = description;

      item.appendChild(titleEl);
      item.appendChild(bodyEl);

      return item;
    }
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
