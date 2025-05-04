// ==============================
// TYPING.JS - TYPED TEXT +ROTATE
// ==============================
export function initTypewriter() {
  const elements = document.querySelectorAll(".typed-text");
  if (!elements.length) return;

  elements.forEach(el => {
    const raw = el.dataset.title || "Loading..";
    const words = raw.split("|");

    let wordIndex = 0;
    let charIndex = 0;
    let typing = true;

    function typeLoop() {
      const word = words[wordIndex];
      el.textContent = typing
        ? word.slice(0, charIndex++)
        : word.slice(0, --charIndex);

      if (typing && charIndex > word.length) {
        typing = false;
        setTimeout(typeLoop, 4000);
      } else if (!typing && charIndex === 0) {
        wordIndex = (wordIndex + 1) % words.length;
        typing = true;
        setTimeout(typeLoop, 500);
      } else {
        setTimeout(typeLoop, typing ? 80 : 30);
      }
    }

    typeLoop();
  });
}
