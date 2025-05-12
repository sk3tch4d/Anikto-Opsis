// ==============================
// DROPZONE MODULE
// Handles File Uploads
// ==============================

import { refreshDropUI, startFormLoadingUI, enableAutoIndexTrigger } from './drop_utils.js';
import Immersive from './immersive.js';

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
  enableAutoIndexTrigger();
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
  
  fileInput.addEventListener("click", () => {
    Immersive.enter();  // Mobile Only
  });

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
      fileInput.click();  // Re-triggers immersive if clicked again
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
    fileInput.files = e.dataTransfer.files;
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
