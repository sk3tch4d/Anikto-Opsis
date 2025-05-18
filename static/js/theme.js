// ==============================
// THEME.JS
// ==============================

// ==============================
// HANDLE THEME TOGGLE
// ==============================
export function initThemeToggle() {
  const THEME_KEY = "preferred-theme";

  function setTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem(THEME_KEY, theme);
  }

  function getTheme() {
    return document.documentElement.getAttribute("data-theme");
  }

  function getSavedOrSystemTheme() {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved) return saved;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  function toggleTheme() {
    const next = getTheme() === "dark" ? "light" : "dark";
    setTheme(next);
  }

  // Run only after the DOM is ready
  document.addEventListener("DOMContentLoaded", () => {
    setTheme(getSavedOrSystemTheme());

    const title = document.getElementById("site-title");
    if (title) {
      title.style.cursor = "pointer";
      title.title = "Tap to toggle theme";
      title.addEventListener("click", toggleTheme);
      title.addEventListener("touchstart", toggleTheme);
    }
  });
}

