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

  function step() {
    const title = titles[titleIndex];
    if (!title) return;

    if (typing) {
      el.textContent = title.slice(0, charIndex++);
      if (charIndex > title.length) {
        typing = false;
        setTimeout(() => requestAnimationFrame(step), 1000);
        return;
      }
    } else {
      el.textContent = title.slice(0, charIndex--);
      if (charIndex < 0) {
        typing = true;
        titleIndex = (titleIndex + 1) % titles.length;
        setTimeout(() => requestAnimationFrame(step), 300);
        return;
      }
    }

    requestAnimationFrame(step);
  }

  // Final trigger — after paint
  window.addEventListener("load", () => {
    setTimeout(() => {
      requestAnimationFrame(step);
    }, 200);
  });
}
