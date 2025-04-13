// ==============================
// LOAD QUOTES
// ==============================
function loadQuotes() {
  fetch('/static/quotes.json')
    .then(response => response.json())
    .then(data => {
      quotes = data;
      const quoteEl = document.getElementById("quote");
      if (quoteEl) {
        quoteEl.textContent = quotes[Math.floor(Math.random() * quotes.length)];
      }
    })
    .catch(error => {
      console.error("Failed to load quotes:", error);
    });
}
export { displayRandomQuote };
