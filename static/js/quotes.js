// ==============================
// QUOTES.JS
// ==============================

let quotes = [];
let quotesLoaded = false;

async function fetchQuotes() {
  if (quotesLoaded) return;
  try {
    const response = await fetch('/static/quotes.json');
    if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
    quotes = await response.json();
    quotesLoaded = true;
  } catch (error) {
    console.error("[Quotes] Failed to load quotes:", error);
    quotes = ["Stay positive. Stay strong."];
    quotesLoaded = true;
  }
}

async function displayRandomQuote() {
  const quoteEl = document.getElementById("quote");
  if (!quoteEl) {
    console.error("[Quotes] Could not find #quote element.");
    return;
  }

  if (!quotesLoaded) {
    await fetchQuotes();
  }

  const quote = quotes.length ? quotes[Math.floor(Math.random() * quotes.length)] : "Keep going!";
  quoteEl.textContent = quote;
  quoteEl.style.display = 'block';
}

// Export
export { displayRandomQuote };
