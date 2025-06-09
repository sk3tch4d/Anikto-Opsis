// ==============================
// INDEX_UTILS.JS
// ==============================

import { toggleLoadingState } from '../loading.js';
import { displayRandomQuote } from '../quotes.js';

// ==============================
// FILE TYPE MATCHERS
// ==============================
const OPTIMIZE_REGEX = /^KG01-[A-Z0-9]{1,4}-.*\.xlsx$/i;
const CLEAN_REGEX = /.*clean.*\.xlsx$/i;
const CATALOG_REGEX = /(catalog|inventory|cat[_-]?v[\d.]+).*?\.(xlsx|db)$/i;
const ZWDISEG_REGEX = /.*zwdiseg.*\.xlsx$/i;
const ARG_REGEX = /(arg|flowsheet).*?\.(pdf)$/i;
const SENIORITY_REGEX = /(cupe|opseu)?[^/\\]*?(seniority|sen)[\s_-]*(list|lists|lst)?[^/\\]*\.xlsx$/i;
const UNCLEANED_REGEX = /(list|ven|vendor|cost|usl|cc).*\.xlsx$/i;

const isOptimizationFile = name => OPTIMIZE_REGEX.test(name);
const isCleaningFile = name => CLEAN_REGEX.test(name);
const isCatalogFile = name => CATALOG_REGEX.test(name);
const isZwdisegFile = name => ZWDISEG_REGEX.test(name);
const isArgFile = name => ARG_REGEX.test(name);
const isSeniorityFile = name => SENIORITY_REGEX.test(name);
const isUncleanedFile = name => UNCLEANED_REGEX.test(name);

const isValidFile = name => /\.(pdf|xlsx|db)$/i.test(name);

// SHARED MATCHERS ARRAY
const typeMatchers = [
  { key: "clean", label: "Clean Uploaded File", match: isCleaningFile },
  { key: "catalog", label: "Generate Catalog", match: isCatalogFile },
  { key: "zwdiseg", label: "Analyze Zwdiseg", match: isZwdisegFile },
  { key: "seniority", label: "Generate Seniority Summary", match: isSeniorityFile },
  { key: "arg", label: "Generate ARG Summary", match: isArgFile },
  { key: "uncleaned", label: "Generate Cleaned File", match: isUncleanedFile }
];

// ==============================
// REFRESH DROPZONE UI
// ==============================
export function refreshDropUI() {
  updateGenerateButtonText();
}

// ==============================
// PROCESS SELECTED FILES
// ==============================
export function processSelectedFiles(sourceInput, targetInput) {
  if (!sourceInput || !targetInput || sourceInput.files.length === 0) return;

  const dt = new DataTransfer();
  Array.from(sourceInput.files).forEach(file => dt.items.add(file));
  targetInput.files = dt.files;
}

// ==============================
// GET ACTION LABEL FOR FILES
// ==============================
export function getActionLabelForFiles(fileNames) {
  const validFiles = fileNames.filter(isValidFile);
  if (validFiles.length === 0) return "Generate";

  const match = typeMatchers.find(t => validFiles.some(t.match));
  return match ? match.label : "Generate Cleaned File";
}

// ==============================
// UPDATE GENERATE BUTTON TEXT
// ==============================
function updateGenerateButtonText() {
  const fileInput = document.getElementById("file-input");
  const generateBtn = document.getElementById("generate");
  if (!generateBtn) return;

  const uploadedFiles = fileInput?.files ? Array.from(fileInput.files) : [];
  const existingCheckboxes = document.querySelectorAll('input[name="existing_files"]:checked');
  const existingFiles = Array.from(existingCheckboxes).map(cb => cb.value);

  const allFiles = uploadedFiles.map(f => f.name.trim()).concat(existingFiles);
  const label = getActionLabelForFiles(allFiles);

  generateBtn.textContent = label;
  generateBtn.disabled = allFiles.length === 0;

  if (allFiles.length === 0) {
    generateBtn.classList.remove("select");
  } else {
    generateBtn.classList.add("select");
  }
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

  const matched = typeMatchers.find(t => allFiles.some(t.match));
  return matched ? matched.key : 'default';
}

// ==============================
// START FORM LOADING UI
// ==============================
export function startFormLoadingUI() {
  toggleLoadingState(true, {
    show: [document.getElementById("loading")],
    hide: [document.getElementById("upload-form")]
  });

  const typeKey = detectFileTypeKey();
  updateGenText(typeKey);
  displayRandomQuote();
}
