// ==============================
// DROP_DEV.JS
// ==============================

import { refreshDropUI, getActionLabelForFiles } from './drop_utils.js';

// ==============================
// FADE ELEMENTS
// ==============================
function fadeOutAndHide(el) {
  el.style.display = "block"; // Ensure not hidden
  el.style.opacity = "1"; // Reset opacity

  // Force reflow: make opacity change visible
  void el.offsetWidth;
  
  el.classList.add("hidden-fade");
  let handled = false;
  const hide = () => {
    if (!handled) {
      el.style.display = "none";
      el.removeEventListener("transitionend", handler);
      handled = true;
    }
  };

  const handler = (e) => {
    if (e.propertyName === "opacity") hide();
  };

  el.addEventListener("transitionend", handler);

  // Fallback to transitionend missed
  setTimeout(hide, 500);
}
function showWithFade(el) {
  el.style.display = "block";
  requestAnimationFrame(() => el.classList.remove("hidden-fade"));
}

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
      if (dropZone) fadeOutAndHide(dropZone);
      const generateBtn = document.getElementById("generate");
      if (generateBtn) fadeOutAndHide(generateBtn);

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

      // Hidden file input
      const fileInput = document.createElement("input");
      fileInput.type = "file";
      fileInput.id = "dev-file-input";
      fileInput.accept = ".xlsx,.pdf,.db";
      fileInput.style.display = "none";
      
      // Upload Button
      const uploadBtn = document.createElement("button");
      uploadBtn.textContent = "Upload File";
      uploadBtn.type = "button";
      uploadBtn.classList.add("button", "full-width-on");
      uploadBtn.style.marginTop = "1rem";
      
      let pressTimer = null;
      
      // open file selection or submit form
      uploadBtn.addEventListener("click", () => {
        if (uploadBtn.textContent === "Upload File") {
          fileInput.click();
        } else {
          // Simulate generate behavior
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
      
        let devInput = document.getElementById("dev-upload-input");
        if (!devInput) {
          devInput = document.createElement("input");
          devInput.type = "file";
          devInput.name = "dev_files";
          devInput.multiple = true;
          devInput.id = "dev-upload-input";
          devInput.style.display = "none";
          form.appendChild(devInput);
        }
        
        const dt = new DataTransfer();
        for (const file of fileInput.files) dt.items.add(file);
        devInput.files = dt.files;
      
        uploadBtn.textContent = getActionLabelForFiles(fileNames);
        refreshDropUI();
      });
      
      // Attach to panel
      panel.appendChild(uploadBtn);
      panel.appendChild(fileInput);

      // Main Menu Button
      const logout = document.createElement("button");
      logout.textContent = "Main Menu";
      logout.type = "button";
      logout.classList.add("button", "full-width-on");
      logout.style.marginTop = "3rem";
      logout.onclick = () => {
        fetch("/logout-dev")
          .then(() => {
            const panel = document.getElementById("dev-panel");
            const dropZone = document.getElementById("drop-zone");
            const generateBtn = document.getElementById("generate");

            if (panel) panel.remove();
            if (dropZone) showWithFade(dropZone);
            if (generateBtn) showWithFade(generateBtn);
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
    input.classList.add("input", "full-width");
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

  form.addEventListener("submit", (e) => {
      e.preventDefault(); // prevent reload
    
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
            form.classList.add("hidden-fade");
              setTimeout(() => {
                form.remove();
                renderDevPanel(); // after fade-out
              }, 400); // match CSS transition duration
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

  dropZone.addEventListener("mousedown", startPress);
  dropZone.addEventListener("mouseup", cancelPress);
  dropZone.addEventListener("mouseleave", cancelPress);
  dropZone.addEventListener("touchstart", startPress);
  dropZone.addEventListener("touchend", cancelPress);
  dropZone.addEventListener("touchcancel", cancelPress);
}
