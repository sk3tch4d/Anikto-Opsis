// ==============================
// (ROTATING) TYPEWRITER EFFECT
// ==============================
export function initTypewriter() {
  const el = document.getElementById("typed-text");
  if (!el) return;

  const text = el.dataset.title || "Loading...";
  let i = 0;

  function type() {
    if (i <= text.length) {
      el.textContent = text.slice(0, i++);
      setTimeout(type, 80);
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    setTimeout(type, 100);
  });
}
