// ==============================
// QUOTES.JS
// ==============================

let quotes = [];
let quotesLoaded = false;

async function fetchQuotes() {
  if (quotesLoaded) return; // prevent double fetching

  try {
    const response = await fetch('/static/quotes.json');
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    quotes = await response.json();
    quotesLoaded = true;
  } catch (error) {
    console.error("[Quotes] Failed to load quotes:", error);
    quotes = ["Stay positive. Stay strong."]; // fallback
    quotesLoaded = true;
  }
}

function displayRandomQuote() {
  const quoteEl = document.getElementById("quote");
  if (!quoteEl) {
    console.error("[Quotes] Could not find #quote element.");
    return;
  }

  if (!quotes.length) {
    quoteEl.textContent = "Keep going!";
  } else {
    const index = Math.floor(Math.random() * quotes.length);
    quoteEl.textContent = quotes[index];
  }

  quoteEl.style.display = 'block';
}

// Export
export { fetchQuotes, displayRandomQuote };
