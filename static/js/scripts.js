// ==============================
//  Shared Scripts
// ==============================

// === HEADER TYPEWRITER ===
const text = "ARG Analyzer";
const speed = 100;
const target = document.getElementById("typed-text");

let i = 0;
function typeWriter() {
  if (i < text.length) {
    target.innerHTML += text.charAt(i);
    i++;
    setTimeout(typeWriter, speed);
  }
}

window.addEventListener("DOMContentLoaded", typeWriter);

// === DROPZONE FUNCTIONALITY ===
const dropZone = document.getElementById("drop-zone");
const fileInput = document.getElementById("file-input");
const fileList = document.getElementById("file-list");

// FIXED: Quotes scope
let quotes = [];

fetch('/static/quotes.json')
  .then(response => response.json())
  .then(data => {
    quotes = data;
    const quote = quotes[Math.floor(Math.random() * quotes.length)];
    document.getElementById("quote").textContent = quote;
  })
  .catch(error => {
    console.error("Failed to load quotes:", error);
  });

document.querySelector("form")?.addEventListener("submit", function () {
  document.getElementById("upload-form")?.style?.display = "none";
  document.getElementById("loading")?.style?.display = "block";
  document.getElementById("quote").textContent = quotes[Math.floor(Math.random() * quotes.length)];
});

fileInput?.addEventListener("change", () => {
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

dropZone?.addEventListener("dragover", e => {
  e.preventDefault();
  dropZone.classList.add("active");
});

dropZone?.addEventListener("dragleave", e => {
  e.preventDefault();
  dropZone.classList.remove("active");
});

dropZone?.addEventListener("drop", e => {
  e.preventDefault();
  fileInput.files = e.dataTransfer.files;
  fileInput.dispatchEvent(new Event("change"));
  dropZone.classList.remove("active");
});

// === MERGED PANEL TOGGLE FUNCTION ===
function togglePanel(header) {
  const panel = header.parentElement;
  const body = header.nextElementSibling;

  const isOpen = panel.classList.toggle('open');
  header.classList.toggle('open', isOpen);
  if (body) body.classList.toggle('open', isOpen);

  if (!isOpen) {
    setTimeout(() => {
      const resetTarget = document.getElementById('mobile-focus-reset');
      if (resetTarget) {
        resetTarget.focus();
      }
    }, 10);
  }

  header.classList.remove('bounce');
  void header.offsetWidth;
  header.classList.add('bounce');
}

// === Single shared panel-body open reset ===
document.querySelectorAll('.panel-body').forEach(e => {
  e.classList.remove('open');
});
