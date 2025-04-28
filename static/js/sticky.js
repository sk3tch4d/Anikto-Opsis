// ==============================
// STICKY.JS 
// Sticky Bar, Scroll Fading
// ==============================


// ==============================
// APPLY FADE ON SCROLL
// ==============================
export function fadeOnScroll(stickyBar, scrollContainer, timeout = 150) {
  let scrollTimeout;

  scrollContainer.addEventListener("scroll", () => {
    stickyBar.classList.add("sticky-faded");

    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      stickyBar.classList.remove("sticky-faded");
    }, timeout);
  });
}

// ==============================
// INIT: STICKY BARS
// ==============================
export function initStickyBars() {
  document.querySelectorAll(".sticky-bar").forEach(sticky => {
    const scrollContainer = sticky.closest(".panel")?.querySelector(".scrollable-panel");
    if (scrollContainer) {
      fadeOnScroll(sticky, scrollContainer);
    }
  });
}
