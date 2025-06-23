// ==============================
// ARG_INFO.JS
// ==============================


// ==============================
// POPULATE DROPDOWN INFO
// ==============================
export async function populateDropdownInfo() {
  const select = document.getElementById("info-select");
  if (!select) return;

  try {
    const res = await fetch("/static/arg_shifts.json");
    const data = await res.json();

    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = "Select Assignment ▼";
    placeholder.disabled = true;
    placeholder.selected = true;
    select.appendChild(placeholder);

    Object.keys(data).sort().forEach(key => {
      const opt = document.createElement("option");
      opt.value = key;
      opt.textContent = `Assignment ${key}`;
      select.appendChild(opt);
    });

    select.addEventListener("change", () => renderAssignmentInfo(data, select.value));
  } catch (err) {
    console.error("Failed to load assignment data:", err);

    if (select) {
      select.innerHTML = "";
      const failOpt = document.createElement("option");
      failOpt.textContent = "⚠️ Failed to load assignments";
      failOpt.disabled = true;
      failOpt.selected = true;
      select.appendChild(failOpt);
    }
  }
}

// ==============================
// RENDER ASSIGNMENT INFO
// ==============================
function renderAssignmentInfo(data, key) {
  const container = document.getElementById("info-container");
  container.innerHTML = "";

  if (!data[key]) {
    container.innerHTML = "<div class='delta-item'>No data available.</div>";
    return;
  }

  const assignment = data[key];
  const fragment = document.createDocumentFragment();

  // Optional: Add header
  const header = document.createElement("div");
  header.className = "delta-item";
  header.innerHTML = `<em>📋 Details for <strong>${key}</strong></em>`;
  fragment.appendChild(header);

  Object.entries(assignment).forEach(([subkey, value]) => {
    const div = document.createElement("div");
    div.className = "delta-item";
    div.innerHTML = `<strong>${subkey}</strong>: <span>${value}</span>`;
    fragment.appendChild(div);
  });

  container.appendChild(fragment);
}
