// ==============================
// DROP_UTILS.JS - HANDLE DYNAMIC
// ==============================

let upTexts = {};

// ==============================
// LOAD ALL DYNAMIC TEXTS
// ==============================
export function initUpTexts() {
  fetch('/static/up_texts.json')
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
  if (Array.isArray(matchingTexts) && matchingTexts.length > 0) {
    quoteEl.textContent = matchingTexts[Math.floor(Math.random() * matchingTexts.length)];
  } else {
    quoteEl.textContent = "Generating your report...";
  }
}
