// ==============================
// (ROTATING) TYPEWRITER EFFECT
// ==============================
export function initTypewriter() {
  const el = document.getElementById("typed-text");
  if (!el) return;

  const raw = el.dataset.title || "Loading..";
  const titles = raw.split("|");

  let titleIndex = 0;
  let charIndex = 0;
  let typing = true;

  function update() {
    const title = titles[titleIndex];
    if (typing) {
      el.textContent = title.slice(0, charIndex++);
      if (charIndex > title.length) {
        typing = false;
        setTimeout(update, 10000); // Pause full title
        return;
      }
    } else {
      el.textContent = title.slice(0, charIndex--);
      if (charIndex === 0) {
        typing = true;
        titleIndex = (titleIndex + 1) % titles.length;
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
