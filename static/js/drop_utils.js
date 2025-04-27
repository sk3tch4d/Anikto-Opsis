// ==============================
// DROP_UTILS MODULE
// Handles button text, loading quotes, loading screen control
// ==============================

import { toggleLoadingState } from './loading.js';
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
// REFRESH DROPZONE UI (on file change)
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
}

// ==============================
// UPDATE LOADING TEXT (smart based on file)
// ==============================
function updateLoadingText() {
  const quoteEl = document.getElementById("quote");
  if (!quoteEl) return;

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
  const typeKey = matched ? matched.key : 'default';

  uploadTextSettings(typeKey);
}

// ==============================
// UPLOAD TEXT SETTINGS (dynamic smart file quotes)
// ==============================
let upTexts = {};

export function initUpTexts() {
  fetch('/static/drop_texts.json')
    .then(response => response.json())
    .then(data => {
      upTexts = data;
    })
    .catch(error => {
      console.error("Failed to load drop texts:", error);
    });
}

function uploadTextSettings(typeKey) {
  const quoteEl = document.getElementById("quote");
  if (!quoteEl) return;

  const matchingTexts = upTexts[typeKey];
  if (!Array.isArray(matchingTexts) || matchingTexts.length === 0) {
    quoteEl.textContent = "Generating your report...";
    return;
  }

  quoteEl.textContent = matchingTexts[Math.floor(Math.random() * matchingTexts.length)];
}

// ==============================
// START FORM LOADING UI (handles everything when form submitted)
// ==============================
export function startFormLoadingUI() {
  toggleLoadingState(true, {
    show: [document.getElementById("loading")],
    hide: [document.getElementById("upload-form")]
  });
  
  updateLoadingText();
  displayRandomQuote();
}
