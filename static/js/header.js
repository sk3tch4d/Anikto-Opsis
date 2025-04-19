// ==============================
// (ROTATING) TYPEWRITER EFFECT
// ==============================
export function initTypewriter() {
  const el = document.getElementById("typed-text");
  if (!el) return;

  const raw = el.dataset.title || "Loading..";
  const titles = raw.split("|").map(t => t.trim()).filter(Boolean);

  let titleIndex = 0;
  let charIndex = 0;
  let typing = true;

  function update() {
    const title = titles[titleIndex];
    if (!title) return;

    el.textContent = typing
      ? title.slice(0, charIndex++)
      : title.slice(0, charIndex--);

    if (typing && charIndex > title.length) {
      typing = false;
      setTimeout(update, 1200); // pause after typing
    } else if (!typing && charIndex < 0) {
      typing = true;
      titleIndex = (titleIndex + 1) % titles.length;
      setTimeout(update, 300); // pause before next title
    } else {
      setTimeout(update, 75); // typing speed
    }
  }

  setTimeout(update, 500); // delay initial trigger (mobile-safe)
}

document.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => {
    initTypewriter();
  }, 300); // slight delay to ensure paint + dataset availability
});
