// ==============================
//  HEADER TYPEWRITER
// ==============================

export function initTypewriter() {
  const typedTextEl = document.getElementById("typed-text");
  if (!typedTextEl) return;

  const text = typedTextEl.dataset.title || "ARG Analyzer";
  const speed = 100;
  let i = 0;

  function typeWriter() {
    if (i < text.length) {
      typedTextEl.innerHTML += text.charAt(i);
      i++;
      setTimeout(typeWriter, speed);
    }
  }

  window.addEventListener("DOMContentLoaded", typeWriter);
}
