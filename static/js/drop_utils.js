// ==============================
// DROP_UTILS MODULE
// Handles Button/Loading Text
// ==============================

import { toggleLoadingState } from './loading.js';
import { displayRandomQuote } from './quotes.js';
import Immersive from './immersiveHelper.js';

// ==============================
// FILE TYPE MATCHERS
// ==============================
const OPTIMIZE_REGEX = /^KG01-[A-Z0-9]{1,4}-.*\.xlsx$/i;
const CLEAN_REGEX = /.*clean.*\.xlsx$/i;
const CATALOG_REGEX = /(catalog|inventory|cat[_-]?v[\d.]+).*?\.(xlsx|db)$/i;
const ZWDISEG_REGEX = /.*zwdiseg.*\.xlsx$/i;
const ARG_REGEX = /(arg|flowsheet).*?\.(pdf)$/i;
const SENIORITY_REGEX = /(cupe).*seniority.*(list)?.*\.xlsx$/i;
const UNCLEANED_REGEX = /(list|ven|vendor|cost|usl|cc).*\.xlsx$/i;

const isOptimizationFile = name => OPTIMIZE_REGEX.test(name);
const isCleaningFile = name => CLEAN_REGEX.test(name);
const isCatalogFile = name => CATALOG_REGEX.test(name);
const isZwdisegFile = name => ZWDISEG_REGEX.test(name);
const isArgFile = name => ARG_REGEX.test(name);
const isSeniorityFile = name => SENIORITY_REGEX.test(name);
const isUncleanedFile = name => UNCLEANED_REGEX.test(name);

const isValidFile = name => /\.(pdf|xlsx|db)$/i.test(name);

// ==============================
// REFRESH DROPZONE UI
// ==============================
export function refreshDropUI() {
  updateGenerateButtonText();
}

// ==============================
// UPDATE BUTTON TEXT
// ==============================
function updateGenerateButtonText() {
  const fileInput = document.getElementById("file-input");
  const generateBtn = document.getElementById("generate");
  if (!generateBtn) return;

  const uploadedFiles = fileInput?.files ? Array.from(fileInput.files) : [];
  const existingCheckboxes = document.querySelectorAll('input[name="existing_files"]:checked');
  const existingFiles = Array.from(existingCheckboxes).map(cb => cb.value);

  const allFiles = uploadedFiles.map(f => f.name.trim())
    .concat(existingFiles.map(name => name.trim()))
    .filter(isValidFile);

  if (allFiles.length === 0) {
    generateBtn.textContent = "Generate";
    generateBtn.disabled = true;
    return;
  }

  const typeMatchers = [
    //{ label: "Generate Optimization", match: isOptimizationFile },
    { label: "Clean Uploaded File", match: isCleaningFile},
    { label: "Generate Catalog", match: isCatalogFile },
    { label: "Analyze Zwdiseg", match: isZwdisegFile },
    { label: "Generate Seniority Summary", match: isSeniorityFile },
    { label: "Generate ARG Summary", match: isArgFile },
    { label: "Generate Cleaned File", match: isUncleanedFile }
  ];

  const match = typeMatchers.find(t => allFiles.some(t.match));
  generateBtn.textContent = match ? match.label : "Generate";
  generateBtn.disabled = false;

  // Focus the button after updating text
  generateBtn.focus();
  generateBtn.classList.add("select");
}

// ==============================
// GEN TEXT HANDLING
// ==============================
let upTexts = {};

export function initUpTexts() {
  fetch('/static/drop_text.json')
    .then(response => response.json())
    .then(data => {
      upTexts = data;
    })
    .catch(error => {
      console.error("Failed to load drop texts:", error);
    });
}

export function updateGenText(typeKey) {
  const statusEl = document.getElementById("processing");
  if (!statusEl) return;

  const matchingTexts = upTexts[typeKey];
  if (!Array.isArray(matchingTexts) || matchingTexts.length === 0) {
    statusEl.textContent = "Generating your report...";
    return;
  }

  statusEl.textContent = matchingTexts[Math.floor(Math.random() * matchingTexts.length)];

  // Optional: smooth fade
  statusEl.classList.remove('show');
  void statusEl.offsetWidth;
  statusEl.classList.add('show');
}

// ==============================
// DETECT FILE TYPE
// ==============================
function detectFileTypeKey() {
  const fileInput = document.getElementById("file-input");
  const uploadedFiles = fileInput?.files ? Array.from(fileInput.files) : [];
  const existingCheckboxes = document.querySelectorAll('input[name="existing_files"]:checked');
  const existingFiles = Array.from(existingCheckboxes).map(cb => cb.value);

  const allFiles = uploadedFiles.map(f => f.name.trim())
    .concat(existingFiles.map(name => name.trim()))
    .filter(isValidFile);

  const typeMatchers = [
    { key: "arg", match: isArgFile },
    { key: "clean", match: isCleaningFile },
    { key: "catalog", match: isCatalogFile },
    { key: "zwdiseg", match: isZwdisegFile },
    { key: "seniority", match: isSeniorityFile },
    { key: "uncleaned", match: isUncleanedFile }
  ];

  const matched = typeMatchers.find(t => allFiles.some(t.match));
  return matched ? matched.key : 'default';
}

// ==============================
// LOAD DB / LOAD SETTINGS
// ==============================
export function enableAutoIndexTrigger() {
  const form = document.querySelector("form");
  const dbTrigger = document.getElementById("drop-zone");
  const title = document.querySelector("h1");

  if (!form || !dbTrigger || !title) return;

  // Inject Checkbox
  const autoCheckbox = document.createElement("input");
  autoCheckbox.type = "checkbox";
  autoCheckbox.name = "existing_files";
  autoCheckbox.value = "Cat_V7.7.db";
  autoCheckbox.id = "autofile";
  autoCheckbox.style.display = "none";
  form.appendChild(autoCheckbox);

  // Utility function
  const pressHold = (targetElement, action, holdTime = 2000) => {
    let pressTimer;

    const start = () => {
      pressTimer = setTimeout(action, holdTime);
    };

    const cancel = () => clearTimeout(pressTimer);

    targetElement.addEventListener("touchstart", start);
    targetElement.addEventListener("touchend", cancel);
    targetElement.addEventListener("touchcancel", cancel);
    targetElement.addEventListener("mousedown", start);
    targetElement.addEventListener("mouseup", cancel);
    targetElement.addEventListener("mouseleave", cancel);
  };

  // Redirect on h1 hold
  pressHold(title, () => {
    window.location.href = "/1902";
  });

  // Trigger db load on drop-zone hold
  pressHold(dbTrigger, () => {
    autoCheckbox.checked = true;
    refreshDropUI();
  });
}

// ==============================
// START FORM LOADING UI
// ==============================
export function startFormLoadingUI() {
  Immersive.enter(); // Mobile-only

  toggleLoadingState(true, {
    show: [document.getElementById("loading")],
    hide: [document.getElementById("upload-form")]
  });

  const typeKey = detectFileTypeKey();
  updateGenText(typeKey);
  displayRandomQuote();
}
