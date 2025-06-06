// ==============================
// INFO.JS
// ==============================


// ==============================
// LOAD INFO UPDATES
// ==============================
export function loadInfoUpdates() {
  const updatesContainer = document.getElementById("info-updates");
  if (!updatesContainer) return;

  fetch("/static/updates.json")
    .then(res => {
      if (!res.ok) throw new Error("Failed to load updates");
      return res.json();
    })
    .then(data => {
      if (!Array.isArray(data) || data.length === 0) {
        updatesContainer.innerHTML = "<div class='panel-delta'><div class='delta-item'>No updates found.</div></div>";
        return;
      }

      const wrapper = document.createElement("div");
      wrapper.className = "panel-delta";

      data.forEach(entry => {
        const item = document.createElement("div");
        item.className = "delta-item";
        item.textContent = entry;
        wrapper.appendChild(item);
      });

      updatesContainer.innerHTML = "";
      updatesContainer.appendChild(wrapper);
    })
    .catch(err => {
      updatesContainer.innerHTML = "<div class='panel-delta'><div class='delta-item'>Unable to fetch updates.</div></div>";
      console.error("[info.js] Error fetching updates.json:", err);
    });
}

