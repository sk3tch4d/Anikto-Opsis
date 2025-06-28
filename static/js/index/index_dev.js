// ==============================
// INDEX_DEV.JS
// ==============================

import { renderDropzoneUI } from './index_dropzone.js';
import { refreshDropUI, processSelectedFiles, getActionLabelForFiles, startFormLoadingUI } from './index_utils.js';

// ==============================
// RENDER DEV PANEL
// ==============================
export function renderDevPanel() {
  if (document.body.dataset.page !== "index") return Promise.resolve(false);
  
  return fetch("/check-dev")
    .then(res => res.json())
    .then(data => {
      if (!data.dev) return false;

      const form = document.querySelector("form");
      if (!form || document.getElementById("dev-panel")) return;

      // REMOVE Existing UI      
      ["drop-zone", "generate", "file-list", "dev-icon"].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.remove();
      });

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
        btn.classList.add("button", "full-width-on", "panel-animate");
        btn.style.marginTop = "1rem";
        panel.appendChild(btn);
      });

      // Hidden file input
      const fileInput = document.createElement("input");
      fileInput.type = "file";
      fileInput.name = "uploads";
      fileInput.id = "dev-file-input";
      fileInput.accept = ".xlsx,.pdf,.db";
      fileInput.style.display = "none";
      
      // Upload Button
      const uploadBtn = document.createElement("button");
      uploadBtn.textContent = "Upload File";
      uploadBtn.type = "button";
      uploadBtn.classList.add("button", "full-width-on", "panel-animate");
      uploadBtn.style.marginTop = "1rem";
      
      let pressTimer = null;
      
      // Open file selection or submit form
      uploadBtn.addEventListener("click", () => {
        if (uploadBtn.textContent === "Upload File") {
          fileInput.click();
        } else {
          form.enctype = "multipart/form-data";
          startFormLoadingUI();
          form.submit();
        }
      });
      
      // Long Press Reset Button
      const resetButton = () => {
        uploadBtn.textContent = "Upload File";
        fileInput.value = "";
      };
      
      uploadBtn.addEventListener("mousedown", () => {
        pressTimer = setTimeout(resetButton, 2000);
      });
      uploadBtn.addEventListener("mouseup", () => clearTimeout(pressTimer));
      uploadBtn.addEventListener("mouseleave", () => clearTimeout(pressTimer));
      uploadBtn.addEventListener("touchstart", () => {
        pressTimer = setTimeout(resetButton, 2000);
      });
      uploadBtn.addEventListener("touchend", () => clearTimeout(pressTimer));
      uploadBtn.addEventListener("touchcancel", () => clearTimeout(pressTimer));
      
      // Handle File Selection
      fileInput.addEventListener("change", () => {
        const fileNames = Array.from(fileInput.files).map(f => f.name.trim());
      
        if (fileInput.files.length === 0) {
          uploadBtn.textContent = "Upload File";
          return;
        }
      
        processSelectedFiles(fileInput, document.getElementById("file-input"));
      
        uploadBtn.textContent = getActionLabelForFiles(fileNames);
        refreshDropUI();

        uploadBtn.focus();
      });
      
      // Attach to panel
      panel.appendChild(uploadBtn);
      panel.appendChild(fileInput);

      // Main Menu Button
      const logout = document.createElement("button");
      logout.textContent = "Main Menu";
      logout.type = "button";
      logout.classList.add("button", "full-width-on", "panel-animate");
      logout.style.marginTop = "3rem";
      logout.onclick = () => {
        fetch("/logout-dev")
          .then(() => {
            const panel = document.getElementById("dev-panel");
            if (panel) panel.remove();
      
            // Rebuild Dropzone UI
            renderDropzoneUI();
            enableDevModeTrigger();
          });
      };

      panel.appendChild(logout);

      // Attach Panel
      form.appendChild(panel);

      panel.addEventListener("click", (e) => {
        const button = e.target.closest("button[data-file]");
        if (!button) return;
        e.preventDefault();
      
        const fileName = button.dataset.file;
      
        // Remove any previous hidden checkbox
        const existing = document.getElementById("autofile");
        if (existing) existing.remove();
      
        // Add new hidden checkbox
        const hidden = document.createElement("input");
        hidden.type = "checkbox";
        hidden.name = "existing_files";
        hidden.value = fileName;
        hidden.id = "autofile";
        hidden.checked = true;
        hidden.style.display = "none";
        form.appendChild(hidden);
      
        // Refresh UI so Button logic updates
        refreshDropUI();

        // Loading UI
        startFormLoadingUI();
      
        // Submit form
        form.submit();
      });

      return true;
    })
    .catch(() => false);
}

// ==============================
// ENABLE DEV MODE
// ==============================
export function enableDevModeTrigger() {
  const dropZone = document.getElementById("drop-zone");
  const devIcon = document.getElementById("dev-icon");
  if (!dropZone && !devIcon) return;

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
    input.classList.add("input", "full-width");
    input.type = "password";
    input.name = "token";
    input.required = true;
    input.minLength = 1;

    const submit = document.createElement("button");
    submit.type = "submit";
    submit.textContent = "Developer Mode";
    submit.classList.add("button", "full-width-on", "panel-animate");
    submit.disabled = true;

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
    requestAnimationFrame(() => input.focus());

    form.addEventListener("submit", (e) => {
      e.preventDefault();

      const token = input.value.trim();
      if (!token) return;

      fetch("/dev-mode", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ token })
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            form.remove();
            renderDevPanel();
          } else {
            alert("Invalid access token.");
          }
        })
        .catch(() => alert("Something went wrong. Please try again."));
    });
  };

  const startPress = () => {
    pressTimer = setTimeout(injectDevForm, 3000);
  };

  const cancelPress = () => clearTimeout(pressTimer);

  if (dropZone) {
    dropZone.addEventListener("mousedown", startPress);
    dropZone.addEventListener("mouseup", cancelPress);
    dropZone.addEventListener("mouseleave", cancelPress);
    dropZone.addEventListener("touchstart", startPress);
    dropZone.addEventListener("touchend", cancelPress);
    dropZone.addEventListener("touchcancel", cancelPress);
  }

  if (devIcon) {
    devIcon.addEventListener("click", injectDevForm);
  }
}

// ==============================
// INIT DROPZONE IF NOT IN DEV
// ==============================
export function initDropzoneIfNotDev() {
  const form = document.querySelector("form");
  if (!form) return;

  renderDevPanel().then(isDev => {
    if (!isDev) {
      renderDropzoneUI();
      enableDevModeTrigger();
    }
  });
}
