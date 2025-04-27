// ==============================
// DROP_UTILS.JS - HANDLE DYNAMIC
// ==============================

let upTexts = {};
const drop_text = '/static/drop_texts.json';

// ==============================
// LOAD ALL DYNAMIC TEXTS
// ==============================
export function initUpTexts() {
  fetch(drop_text)
    .then(response => response.json())
    .then(data => {
      upTexts = data;
    })
    .catch(error => {
      console.error("Failed to load up texts:", error);
    });
}

// ==============================
// DYNAMIC SET UPLOAD SETTINGS
// ==============================
export function uploadTextSettings(typeKey) {
  const quoteEl = document.getElementById("quote");
  if (!quoteEl || !upTexts) return;

  const matchingTexts = upTexts[typeKey];
  
  if (!Array.isArray(matchingTexts) || matchingTexts.length === 0) {
    quoteEl.textContent = "Generating your report...";
    return;
  }

  quoteEl.textContent = matchingTexts[Math.floor(Math.random() * matchingTexts.length)];
}
