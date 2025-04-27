// ==============================
// QUOTES MODULE
// ==============================

let quotes = [];

// ==============================
// INIT QUOTES (Fetch + Display One)
// ==============================
export function initQuotes() {
  fetch('/static/quotes.json')
    .then(response => response.json())
    .then(data => {
      quotes = data;
    })
    .catch(error => {
      console.error("Failed to load quotes:", error);
    });
}

// ==============================
// DISPLAY RANDOM QUOTE
// ==============================
export function displayRandomQuote() {
  const quoteEl = document.getElementById("quote");
  if (quoteEl && quotes.length) {
    quoteEl.textContent = quotes[Math.floor(Math.random() * quotes.length)];
    quoteEl.style.display = 'block'; // <--- PATCH
  }
}
