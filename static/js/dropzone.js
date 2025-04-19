// ==============================
// DROPZONE MODULE //
// File Input
// Drag-drop
// Form Transitions
// ==============================


// ==============================
// INIT FUNCTION
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
import { displayRandomQuote } from './quotes.js';
// ==============================
function setupFormBehavior() {
  const form = document.querySelector("form");
  if (!form) return;

  form.addEventListener("submit", function () {
    const uploadForm = document.getElementById("upload-form");
    const loading = document.getElementById("loading");

    if (uploadForm) uploadForm.style.display = "none";
    if (loading) loading.style.display = "block";

    displayRandomQuote(); // ✅ this handles quote logic properly
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

    // Hide the dropzone
    if (dropZone) dropZone.style.display = "none";

    // Clear previous file list
    fileList.innerHTML = "";

    // Display selected file name
    const file = fileInput.files[0];
    const li = document.createElement("li");
    const link = document.createElement("a");
    link.className = "file-action uploaded";
    link.href = "#";
    link.textContent = file.name;
    li.appendChild(link);
    fileList.appendChild(li);

    // Reopen file selector on filename click
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
  if (!generateBtn) return; // Guard clause: button not found

  const uploadedFiles = fileInput?.files ? Array.from(fileInput.files) : [];
  const existingCheckboxes = document.querySelectorAll('input[name="existing_pdfs"]:checked');
  const existingFiles = Array.from(existingCheckboxes).map(cb => cb.value);

  const fileNames = uploadedFiles.map(f => f.name.toLowerCase())
    .concat(existingFiles.map(name => name.toLowerCase()));

  // --- Early return if no files selected ---
  if (fileNames.length === 0) {
    generateBtn.textContent = "Generate";
    generateBtn.disabled = true;
    return;
  }

  // --- Update label based on file type ---
  if (fileNames.some(name => name.endsWith(".xlsx"))) {
    generateBtn.textContent = "Generate Seniority";
  } else if (fileNames.some(name => name.endsWith(".pdf"))) {
    generateBtn.textContent = "Generate ARG";
  } else {
    generateBtn.textContent = "Generate";
  }

  generateBtn.disabled = false;
}

// ==============================
// BIND CHANGE EVENTS
// ==============================
document.addEventListener("DOMContentLoaded", () => {
  const fileInput = document.getElementById("file-input");
  fileInput?.addEventListener("change", updateGenerateButtonText);

  const checkboxNodeList = document.querySelectorAll('input[name="existing_pdfs"]');
  checkboxNodeList.forEach(cb => {
    cb.addEventListener("change", updateGenerateButtonText);
  });

  // Run on initial load
  updateGenerateButtonText();
});
