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
        updatesContainer.innerHTML = "<li>No updates found.</li>";
        return;
      }

      updatesContainer.innerHTML = data
        .map(entry => `<li>${entry}</li>`)
        .join("");
    })
    .catch(err => {
      updatesContainer.innerHTML = "<li>Unable to fetch updates.</li>";
      console.error("[info.js] Error fetching updates.json:", err);
    });
}
