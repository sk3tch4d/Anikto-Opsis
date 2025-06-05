// ==============================
// INDEX_UPDATES.JS
// ==============================


// ==============================
// TOGGLE UPDATES PANEL
// ==============================
export async function toggleUpdatesPanel() {
  const existingPanel = document.getElementById("ao-updates-panel");

  if (existingPanel) {
    existingPanel.remove();
    return;
  }

  const panelHTML = `
    <div class="panel panel-animate" id="ao-updates-panel">
      <div class="panel-header" onclick="togglePanel(this)">
        <span>Updates</span>
      </div>
      <div class="panel-scroll-container">
        <div class="panel-scroll-bar"></div>
      </div>
      <div class="panel-body scrollable-panel"></div>
    </div>
  `;

  const devPanel = document.getElementById("dev-panel");
  const form = document.getElementById("upload-form");

  if (devPanel) {
    devPanel.insertAdjacentHTML("beforeend", panelHTML);
  } else if (form) {
    form.insertAdjacentHTML("beforeend", panelHTML);
  }

  await fillUpdatesPanel();
}

// ==============================
// POPULATE UPDATES PANEL
// ==============================
async function fillUpdatesPanel() {
  const container = document.querySelector("#ao-updates-panel .panel-body");
  if (!container) return;

  try {
    const response = await fetch("/static/updates.json");
    const contentType = response.headers.get("content-type");

    if (contentType.includes("application/json")) {
      const updates = await response.json();

      if (!Array.isArray(updates) || updates.length === 0) {
        container.innerHTML = "<p>No updates found.</p>";
        return;
      }

      const panel = document.createElement("div");
      panel.className = "panel-delta";

      updates.forEach(update => {
        const item = document.createElement("div");
        item.className = "delta-item";
        item.textContent = update;
        panel.appendChild(item);
      });

      container.innerHTML = "";
      container.appendChild(panel);
    } else {
      const text = await response.text();
      container.innerHTML = `<pre>${text}</pre>`;
    }
  } catch (err) {
    container.textContent = "Failed to load updates.";
  }
}
