// ==============================
// DROP_UTILS MODULE
// Handles Button/Loading Text
// ==============================

import { LoaderManager } from './loading.js';
import { displayRandomQuote } from './quotes.js';

// ==============================
// FILE TYPE MATCHERS
// ==============================
const CATALOG_REGEX = /(catalog|inventory|cat[_-]?v[\d.]+).*?\.(xlsx|db)$/i;
const ARG_REGEX = /(arg|flowsheet).*?\.(pdf)$/i;
const SENIORITY_REGEX = /(cupe).*seniority.*(list)?.*\.xlsx$/i;
const UNCLEANED_REGEX = /(list|ven|vendor|cost|usl|cc).*\.xlsx$/i;

const isCatalogFile = name => CATALOG_REGEX.test(name);
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
  const existingCheckboxes = document.querySelectorAll('input[name="existing_pdfs"]:checked');
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
    { label: "Generate Catalog", match: isCatalogFile },
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
  const existingCheckboxes = document.querySelectorAll('input[name="existing_pdfs"]:checked');
  const existingFiles = Array.from(existingCheckboxes).map(cb => cb.value);

  const allFiles = uploadedFiles.map(f => f.name.trim())
    .concat(existingFiles.map(name => name.trim()))
    .filter(isValidFile);

  const typeMatchers = [
    { key: "arg", match: isArgFile },
    { key: "catalog", match: isCatalogFile },
    { key: "seniority", match: isSeniorityFile },
    { key: "uncleaned", match: isUncleanedFile }
  ];

  const matched = typeMatchers.find(t => allFiles.some(t.match));
  return matched ? matched.key : 'default';
}

// ==============================
// START FORM LOADING UI
// ==============================
export function startFormLoadingUI() {
  const typeKey = detectFileTypeKey();
  const uploadForm = document.getElementById("upload-form");

  // Create and show the spinner manually
  LoaderManager.create('spinner', {
    id: 'form-loading-spinner',
    parent: document.body
  });
  LoaderManager.toggle('spinner', true, 'form-loading-spinner');

  // Show status and quote updates
  updateGenText(typeKey);
  displayRandomQuote();

  // Hide form UI while loader is active
  if (uploadForm) uploadForm.style.display = 'none';
}
