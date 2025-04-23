export function fadeOnScroll(stickyBar, scrollContainer, fadeOpacity = 0.4, timeout = 150) {
  let scrollTimeout;

  scrollContainer.addEventListener("scroll", () => {
    stickyBar.style.opacity = fadeOpacity;

    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      stickyBar.style.opacity = "1";
    }, timeout);
  });
}

export function initStickyBars() {
  document.querySelectorAll(".sticky-bar").forEach(sticky => {
    const scrollContainer = sticky.closest(".panel").querySelector(".scrollable-panel");
    if (scrollContainer) {
      fadeOnScroll(sticky, scrollContainer);
    }
  });
}
