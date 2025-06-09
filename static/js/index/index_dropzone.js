// ==============================
// INDEX_DROPZONE.JS
// ==============================

import { refreshDropUI, processSelectedFiles, startFormLoadingUI, initUpTexts } from './index_utils.js';

// ==============================
// INIT DROPZONE
// ==============================
export function initDropzone() {
  const dropZone = document.getElementById("drop-zone");
  const fileInput = document.getElementById("file-input");
  const fileList = document.getElementById("file-list");

  setupFormBehavior();
  setupFileInput(fileInput, fileList);
  setupDragAndDrop(dropZone, fileInput);
  bindChangeEvents();
}

// ==============================
// FORM SUBMISSION BEHAVIOR
// ==============================
function setupFormBehavior() {
  const form = document.querySelector("form");
  if (!form) return;

  form.addEventListener("submit", () => {
    startFormLoadingUI();
  });
}

// ==============================
// FILE INPUT BEHAVIOR
// ==============================
function setupFileInput(fileInput, fileList) {
  if (!fileInput || !fileList) return;

  const dropZone = document.getElementById("drop-zone");

  fileInput.addEventListener("change", () => {
    if (fileInput.files.length === 0) return;

    if (dropZone) dropZone.style.display = "none";
    fileList.innerHTML = "";

    const file = fileInput.files[0];
    const li = document.createElement("li");
    const link = document.createElement("a");

    link.className = "upload-zone";
    link.href = "#";
    link.textContent = file.name;

    li.appendChild(link);
    fileList.appendChild(li);

    link.addEventListener("click", (e) => {
      e.preventDefault();
      fileInput.click();
    });
  });
}

// ==============================
// DRAG & DROP SUPPORT
// ==============================
function setupDragAndDrop(dropZone, fileInput) {
  if (!dropZone || !fileInput) return;

  dropZone.addEventListener("dragover", e => {
    e.preventDefault();
    dropZone.classList.add("active");
  });

  dropZone.addEventListener("dragleave", e => {
    e.preventDefault();
    dropZone.classList.remove("active");
  });

  dropZone.addEventListener("drop", e => {
    e.preventDefault();
    processSelectedFiles({ files: e.dataTransfer.files }, fileInput);
    fileInput.dispatchEvent(new Event("change"));
    dropZone.classList.remove("active");
  });
}

// ==============================
// BIND FILE CHANGE EVENTS
// ==============================
function bindChangeEvents() {
  const fileInput = document.getElementById("file-input");
  fileInput?.addEventListener("change", refreshDropUI);

  const checkboxes = document.querySelectorAll('input[name="existing_files"]');
  checkboxes.forEach(cb => {
    cb.addEventListener("change", refreshDropUI);
  });

  refreshDropUI(); // Set button on load if anything is pre-checked
}

// ==============================
// RENDER DROPZONE UI
// ==============================
export function renderDropzoneUI() {
  if (document.body.dataset.page !== "index") return;

  const form = document.querySelector("form");
  if (!form) return;

  // ===== Dropzone =====
  if (!document.getElementById("drop-zone")) {
    const dropLabel = document.createElement("label");
    dropLabel.id = "drop-zone";
    dropLabel.className = "drop-zone";
    dropLabel.innerHTML = `
      <span class="drop-text">Tap or Drop files here</span>
      <input type="file" id="file-input" name="uploads" multiple accept=".pdf,.xlsx" />
    `;
    form.prepend(dropLabel);
  }

  // ===== File List =====
  if (!document.getElementById("file-list")) {
    const fileList = document.createElement("ul");
    fileList.id = "file-list";
    fileList.className = "file-box";
    const before = form.querySelector(".panel-animate");
    if (before) form.insertBefore(fileList, before);
    else form.appendChild(fileList);
  }

  // ===== Generate Button =====
  if (!document.getElementById("generate")) {
    const generateWrapper = document.createElement("div");
    generateWrapper.className = "panel-animate no-shadow";

    const generateBtn = document.createElement("button");
    generateBtn.id = "generate";
    generateBtn.type = "submit";
    generateBtn.className = "button full-width";
    generateBtn.textContent = "Generate";

    generateWrapper.appendChild(generateBtn);
    form.appendChild(generateWrapper);

    // Place download panel after the button if it exists
    const downloadPanel = document.getElementById("download-panel");
    if (downloadPanel) {
      generateWrapper.insertAdjacentElement('afterend', downloadPanel);
    }

    // Focus the button after render
    setTimeout(() => generateBtn.focus(), 0);
  }

  // ===== Initialize Dropzone Logic =====
  initDropzone();
  refreshDropUI();
  initUpTexts();
}
