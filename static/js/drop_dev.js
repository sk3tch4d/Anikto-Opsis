// ==============================
// DROP_DEV.JS
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
      if (dropZone) dropZone.style.display = "none";
      const generateBtn = document.getElementById("generate");
      if (generateBtn) generateBtn.style.display = "none";
      const h3 = document.querySelector("h3");
      if (h3) h3.style.display = "none";

      // CREATE Dev Panel
      const panel = document.createElement("div");
      panel.id = "dev-panel";
      panel.style.textAlign = "center";
      panel.style.display = "flex";
      panel.style.flexDirection = "column";
      panel.style.alignItems = "center";

      const buttons = [
        { label: "Inventory Catalog", file: "Cat_V7.7.db" },
        { label: "Seniority Viewer", file: "Sen_lst.xlsx" }
      ];

      buttons.forEach(({ label, file }) => {
        const btn = document.createElement("button");
        btn.textContent = label;
        btn.type = "submit";
        btn.dataset.file = file;
        btn.classList.add("button", "full-width");
        btn.style.marginBottom = "0.5rem";
        panel.appendChild(btn);
      });

      // Spacer
      const spacer = document.createElement("div");
      spacer.style.height = "1.5rem";
      panel.appendChild(spacer);

      // Main Menu Button
      const logout = document.createElement("button");
      logout.textContent = "Main Menu";
      logout.type = "button";
      logout.classList.add("button", "full-width");
      logout.onclick = () => window.location.href = "/logout-dev";
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
    form.style.position = "fixed";
    form.style.top = "40%";
    form.style.left = "50%";
    form.style.transform = "translate(-50%, -50%)";
    form.style.background = "#222";
    form.style.padding = "2rem";
    form.style.borderRadius = "12px";
    form.style.zIndex = 9999;
    form.style.color = "#fff";
    form.style.textAlign = "center";

    const closeBtn = document.createElement("div");
    closeBtn.textContent = "×";
    closeBtn.style.position = "absolute";
    closeBtn.style.top = "10px";
    closeBtn.style.right = "15px";
    closeBtn.style.cursor = "pointer";
    closeBtn.style.fontSize = "1.2rem";
    closeBtn.onclick = () => form.remove();

    const label = document.createElement("label");
    label.textContent = "Enter Access Token";
    label.style.fontSize = "1.2rem";

    const input = document.createElement("input");
    input.type = "password";
    input.name = "token";
    input.style.padding = "0.5rem";
    input.style.width = "100%";
    input.style.margin = "1rem 0";

    const submit = document.createElement("button");
    submit.type = "submit";
    submit.textContent = "Developer Mode";
    submit.style.padding = "0.5rem 1.5rem";

    form.appendChild(label);
    form.appendChild(document.createElement("br"));
    form.appendChild(document.createElement("br"));
    form.appendChild(input);
    form.appendChild(document.createElement("br"));
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
