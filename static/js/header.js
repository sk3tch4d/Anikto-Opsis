// ==============================
// (ROTATING) TYPEWRITER EFFECT
// ==============================
export function initTypewriter() {
  const el = document.getElementById("typed-text");
  if (!el) return;

  const raw = el.dataset.words || "Loading";
  const words = raw.split("|");

  let wordIndex = 0;
  let charIndex = 0;
  let typing = true;

  function update() {
    const word = words[wordIndex];
    if (typing) {
      el.textContent = word.slice(0, charIndex++);
      if (charIndex > word.length) {
        typing = false;
        setTimeout(update, 10000); // Pause full word
        return;
      }
    } else {
      el.textContent = word.slice(0, charIndex--);
      if (charIndex === 0) {
        typing = true;
        wordIndex = (wordIndex + 1) % words.length;
        setTimeout(update, 300); // Pause before next
        return;
      }
    }
    setTimeout(update, 80);
  }

  update();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initTypewriter);
} else {
  initTypewriter();
}
