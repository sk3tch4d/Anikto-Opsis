// ==============================
// THEME.JS
// ==============================


// ==============================
// HANDLE THEME TOGGLE
// ==============================
export function initThemeToggle() {
  const THEME_KEY = "preferred-theme";

  function setTheme(theme) {
    console.log(`[theme] Applying theme: ${theme}`);
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
    console.log(`[theme] Toggling to: ${next}`);
    setTheme(next);
  }

  function runThemeInit() {
    const title = document.getElementById("site-title");

    if (!title) {
      console.warn("[theme] #site-title not found – theme toggle skipped");
      return;
    }

    console.log("[theme] #site-title found, initializing theme toggle");

    setTheme(getSavedOrSystemTheme());
    title.style.cursor = "pointer";
    title.title = "Tap to toggle theme";

    let recentlyTouched = false;

    title.addEventListener("touchstart", () => {
      toggleTheme();
      recentlyTouched = true;

      setTimeout(() => {
        recentlyTouched = false;
      }, 400);
    });

    title.addEventListener("click", () => {
      if (recentlyTouched) return;
      toggleTheme();
    });
  }

  // Ensure it runs after DOM is loaded
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", runThemeInit);
  } else {
    runThemeInit();
  }
}

