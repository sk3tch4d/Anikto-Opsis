// ==============================
// DROP_UTILS MODULE
// Button text logic and file type matchers
// ==============================

const DEBUG_MODE = false;

// ==============================
// FILE TYPE MATCHERS
// ==============================
const CATALOG_REGEX = /(catalog|inventory|cat[_-]?v[\d.]+).*?\.(xlsx|db)$/i;
const ARG_REGEX = /(arg|flowsheet).*?\.(pdf)$/i;
const SENIORITY_REGEX = /(cupe).*seniority.*(list)?.*\.xlsx$/i;
const UNCLEANED_REGEX = /(list|ven|vendor|cost|usl|cc).*\.xlsx$/i;

export const isCatalogFile = name => CATALOG_REGEX.test(name);
export const isArgFile = name => ARG_REGEX.test(name);
export const isSeniorityFile = name => SENIORITY_REGEX.test(name);
export const isUncleanedFile = name => UNCLEANED_REGEX.test(name);
export const isValidFile = name => /\.(pdf|xlsx|db)$/i.test(name);

// ==============================
// UPDATE GENERATE BUTTON TEXT
// ==============================
export function updateGenerateButtonText() {
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

  // Declarative matching
  const typeMatchers = [
    { label: "Generate Catalog", match: isCatalogFile },
    { label: "Generate Seniority Summary", match: isSeniorityFile },
    { label: "Generate ARG Summary", match: isArgFile },
    { label: "Generate Cleaned File", match: isUncleanedFile }
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
