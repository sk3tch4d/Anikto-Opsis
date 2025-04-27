// ==============================
// DROPZONE MODULE
// File Input, Drag-drop, Transitions, Button Text
// ==============================

import { displayRandomQuote } from './quotes.js';
import { showLoading, hideLoading } from './loading.js';

// ==============================
// CONFIGURATION
// ==============================
const DEBUG_MODE = false;

// ==============================
// FILE TYPE MATCHERS
// ==============================
const CATALOG_REGEX = /(catalog|inventory|cat[_-]?v[\d.]+).*?\.(xlsx|db)$/i;
const ARG_REGEX = /(arg|flowsheet).*?\.(pdf)$/i;
const SENIORITY_REGEX = /(cupe).*seniority.*(list)?.*\.xlsx$/i;

const isCatalogFile = name => CATALOG_REGEX.test(name);
const isArgFile = name => ARG_REGEX.test(name);
const isSeniorityFile = name => SENIORITY_REGEX.test(name);
const isValidFile = name => /\.(pdf|xlsx|db)$/i.test(name);

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
}

// ==============================
// FORM SUBMISSION BEHAVIOR
// ==============================
function setupFormBehavior() {
  const form = document.querySelector("form");
  if (!form) return;

  form.addEventListener("submit", () => {
    const loadingTarget = document.getElementById("loading");
    const uploadForm = document.getElementById("upload-form");

    if (loadingTarget && uploadForm) {
      showLoading(loadingTarget);
      uploadForm.style.display = 'none';
    }

    displayRandomQuote();
  });
}

export { setupFormBehavior };

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

    link.className = "file-action uploaded";
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
    fileInput.files = e.dataTransfer.files;
    fileInput.dispatchEvent(new Event("change"));
    dropZone.classList.remove("active");
  });
}

// ==============================
// GENERATE BUTTON TEXT + STATE
// ==============================
function updateGenerateButtonText() {
  const fileInput = document.getElementById("file-input");
  const generateBtn = document.getElementById("generate");
  if (!generateBtn) return;

  const uploadedFiles = fileInput?.files ? Array.from(fileInput.files) : [];
  const existingCheckboxes = document.querySelectorAll('input[name="existing_pdfs"]:checked');
  const existingFiles = Array.from(existingCheckboxes).map(cb => cb.value);

  const allFiles = uploadedFiles.map(f => f.name.trim())
    .concat(existingFiles.map(name => name.trim()));

  const fileNames = allFiles
    .map(name => name.toLowerCase())
    .filter(isValidFile);

  if (DEBUG_MODE) {
    console.log("[DEBUG] Selected valid files:", fileNames);
    const invalid = allFiles.filter(name => !isValidFile(name));
    if (invalid.length) {
      console.warn("[DEBUG] Invalid file types excluded:", invalid);
    }
  }

  if (fileNames.length === 0) {
    generateBtn.textContent = "Generate";
    generateBtn.disabled = true;
    return;
  }

  const typeMatchers = [
    { label: "Generate Catalog", match: isCatalogFile },
    { label: "Generate Seniority Summary", match: isSeniorityFile },
    { label: "Generate ARG Summary", match: isArgFile }
  ];

  const match = typeMatchers.find(t => fileNames.some(t.match));
  generateBtn.textContent = match ? match.label : "Generate";

  if (DEBUG_MODE) {
    if (match) {
      console.log(`[DEBUG] Matched: ${match.label}`);
    } else {
      console.log("[DEBUG] No file type matched.");
    }
  }

  generateBtn.disabled = false;
}

// ==============================
// BIND CHANGE EVENTS
// ==============================
document.addEventListener("DOMContentLoaded", () => {
  const fileInput = document.getElementById("file-input");
  fileInput?.addEventListener("change", updateGenerateButtonText);

  const checkboxes = document.querySelectorAll('input[name="existing_pdfs"]');
  checkboxes.forEach(cb => {
    cb.addEventListener("change", updateGenerateButtonText);
  });

  updateGenerateButtonText();
});
