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

  fileInput.addEventListener("change", () => {
    fileList.innerHTML = "";
    [...fileInput.files].forEach(file => {
      const li = document.createElement("li");
      const link = document.createElement("a");
      link.className = "file-action uploaded";
      link.href = "#";
      link.textContent = file.name;
      li.appendChild(link);
      fileList.appendChild(li);
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
