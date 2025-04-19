// ==============================
// (ROTATING) TYPEWRITER EFFECT
// ==============================
export function initTypewriterRotator() {
  const el = document.getElementById("typed-text");
  if (!el || !el.dataset.titles) return;

  const titles = JSON.parse(el.dataset.titles);
  let index = 0;
  let char = 0;
  let typing = true;

  function update() {
    const current = titles[index];
    el.textContent = typing
      ? current.slice(0, char++)
      : current.slice(0, --char);

    if (typing && char > current.length) {
      typing = false;
      setTimeout(update, 1200);  // Pause when full word typed
    } else if (!typing && char === 0) {
      index = (index + 1) % titles.length;
      typing = true;
      setTimeout(update, 400);  // Pause before typing next
    } else {
      setTimeout(update, typing ? 100 : 50); // Typing speed
    }
  }

  update();
}

document.addEventListener("DOMContentLoaded", initTypewriterRotator);
