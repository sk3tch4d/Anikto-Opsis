// ==============================
// DROP_DEV.JS
// ==============================

import { refreshDropUI } from './drop_utils.js';

// ==============================
// RENDER DEV PANEL
// ==============================
export function renderDevPanel() {
  fetch("/check-dev")
    .then(res => res.json())
    .then(data => {
      if (!data.dev) return;

      const form = document.querySelector("form");
      if (!form || document.getElementById("dev-panel")) return;

      // HIDE existing UI      
      const dropZone = document.getElementById("drop-zone");
      if (dropZone) dropZone.classList.add("hidden-fade");
      const generateBtn = document.getElementById("generate");
      if (generateBtn) generateBtn.classList.add("hidden-fade");

      // CREATE Dev Panel
      const panel = document.createElement("div");
      panel.id = "dev-panel";

      const buttons = [
        { label: "Inventory Catalog", file: "Cat_V7.7.db" },
        { label: "Seniority Viewer", file: "Sen_lst.xlsx" }
      ];

      buttons.forEach(({ label, file }) => {
        const btn = document.createElement("button");
        btn.textContent = label;
        btn.type = "submit";
        btn.dataset.file = file;
        btn.classList.add("button", "full-width-on");
        btn.style.marginTop = "1rem";
        panel.appendChild(btn);
      });

      // Main Menu Button
      const logout = document.createElement("button");
      logout.textContent = "Main Menu";
      logout.type = "button";
      logout.classList.add("button", "full-width-on");
      logout.style.marginTop = "3rem";
      logout.onclick = () => {
        const panel = document.getElementById("dev-panel");
        const dropZone = document.getElementById("drop-zone");
        const generateBtn = document.getElementById("generate");
      
        if (panel) panel.remove();
        if (dropZone) dropZone.classList.remove("hidden-fade");
        if (generateBtn) generateBtn.classList.remove("hidden-fade");
      };
      panel.appendChild(logout);

      // Attach Panel
      form.appendChild(panel);

      panel.addEventListener("click", (e) => {
        const button = e.target.closest("button[data-file]");
        if (!button) return;
        e.preventDefault();

        const fileName = button.dataset.file;

        const existing = document.getElementById("autofile");
        if (existing) existing.remove();

        const hidden = document.createElement("input");
        hidden.type = "checkbox";
        hidden.name = "existing_files";
        hidden.value = fileName;
        hidden.id = "autofile";
        hidden.checked = true;
        hidden.style.display = "none";
        form.appendChild(hidden);

        refreshDropUI();
        form.submit();
      });
    });
}

// ==============================
// ENABLE DEV MODE
// ==============================
export function enableDevModeTrigger() {
  const dropZone = document.getElementById("drop-zone");
  if (!dropZone) return;

  let pressTimer;

  const injectDevForm = () => {
    if (document.getElementById("dev-form")) return;

    const form = document.createElement("form");
    form.id = "dev-form";
    form.action = "/dev-mode";
    form.method = "post";
    form.classList.add("dev-popup-form");

    const closeBtn = document.createElement("div");
    closeBtn.textContent = "×";
    closeBtn.classList.add("close-btn");
    closeBtn.onclick = () => form.remove();

    const label = document.createElement("label");
    label.textContent = "Enter Access Token";
    label.style.fontSize = "1.2rem";

    const input = document.createElement("input");
    input.classList.add("input full-width");
    input.type = "password";
    input.name = "token";
    input.required = true;
    input.minLength = 1;

    const submit = document.createElement("button");
    submit.type = "submit";
    submit.textContent = "Developer Mode";
    submit.classList.add("button", "full-width-on");
    submit.disabled = true;

    // Enable button if input is not empty
    input.addEventListener("input", () => {
      submit.disabled = input.value.trim().length === 0;
    });

  form.appendChild(label);
  form.appendChild(document.createElement("br"));
  form.appendChild(document.createElement("br"));
  form.appendChild(input);
  form.appendChild(submit);
  form.appendChild(closeBtn);

  document.body.appendChild(form);
};

  const startPress = () => {
    pressTimer = setTimeout(injectDevForm, 3000);
  };

  const cancelPress = () => clearTimeout(pressTimer);

  dropZone.addEventListener("mousedown", startPress);
  dropZone.addEventListener("mouseup", cancelPress);
  dropZone.addEventListener("mouseleave", cancelPress);
  dropZone.addEventListener("touchstart", startPress);
  dropZone.addEventListener("touchend", cancelPress);
  dropZone.addEventListener("touchcancel", cancelPress);
}
