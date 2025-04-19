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

  function loop() {
    const title = titles[titleIndex];

    if (typing) {
      el.textContent = title.slice(0, charIndex++);
      if (charIndex > title.length) {
        typing = false;
        setTimeout(loop, 1500); // Short pause before deleting
        return;
      }
    } else {
      el.textContent = title.slice(0, charIndex--);
      if (charIndex === 0) {
        typing = true;
        titleIndex = (titleIndex + 1) % titles.length;
        setTimeout(loop, 300); // Short pause before typing next
        return;
      }
    }

    setTimeout(loop, 70);
  }

  loop();
}
