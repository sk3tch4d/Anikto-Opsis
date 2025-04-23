// ========================
// Sticky Bar Scroll Fading
// ========================


// ------------------------
// Apply fade effect on scroll
// ------------------------
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

// ------------------------
// Initialize all sticky bars
// ------------------------
export function initStickyBars() {
  document.querySelectorAll(".sticky-bar").forEach(sticky => {
    const scrollContainer = sticky.closest(".panel")?.querySelector(".scrollable-panel");
    if (scrollContainer) {
      fadeOnScroll(sticky, scrollContainer);
    }
  });
}
