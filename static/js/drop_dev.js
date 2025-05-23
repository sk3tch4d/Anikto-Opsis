// ==============================
// DROP_DEV.JS
// ==============================


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

      const panel = document.createElement("div");
      panel.id = "dev-panel";
      panel.style.marginTop = "2rem";
      panel.style.textAlign = "center";

      const buttons = [
        { label: "Inventory", file: "Cat_V7.7.db" },
        { label: "Seniority", file: "Seniority_List.xlsx" }
      ];

      buttons.forEach(({ label, file }) => {
        const btn = document.createElement("button");
        btn.textContent = label;
        btn.type = "submit";
        btn.dataset.file = file;
        btn.style.margin = "0.5rem";
        btn.style.padding = "0.75rem 1.5rem";
        btn.style.fontSize = "1rem";
        btn.classList.add("button");
        panel.appendChild(btn);
      });

      form.appendChild(panel);

      panel.addEventListener("click", (e) => {
        const button = e.target.closest("button[data-file]");
        if (!button) return;

        e.preventDefault();

        const fileName = button.dataset.file;

        // Remove any existing hidden checkbox
        const existing = document.getElementById("autofile");
        if (existing) existing.remove();
        
        // Inject fresh hidden checkbox
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

    form.innerHTML = `
      <label style="font-size: 1.2rem;">Enter Access Token</label><br><br>
      <input type="password" name="token" style="padding: 0.5rem; width: 100%; margin-bottom: 1rem;"><br>
      <button type="submit" style="padding: 0.5rem 1.5rem;">Developer Mode</button>
    `;

    form.appendChild(closeBtn);
    document.body.appendChild(form);
  };

  const startPress = () => {
    pressTimer = setTimeout(injectDevForm, 3000); // 3s hold
  };

  const cancelPress = () => clearTimeout(pressTimer);

  dropZone.addEventListener("mousedown", startPress);
  dropZone.addEventListener("mouseup", cancelPress);
  dropZone.addEventListener("mouseleave", cancelPress);
  dropZone.addEventListener("touchstart", startPress);
  dropZone.addEventListener("touchend", cancelPress);
  dropZone.addEventListener("touchcancel", cancelPress);
}
