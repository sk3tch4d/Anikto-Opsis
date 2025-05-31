// ==============================
// THEME.JS
// ==============================


// ==============================
// HANDLE THEME TOGGLE
// ==============================
export function initThemeToggle() {
  const THEME_KEY = "preferred-theme";

  function setTheme(theme) {
    if (getTheme() === theme) return; // Avoid redundant set
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
  
    let pressStartTime = 0;
    const THRESHOLD_MS = 300;
  
    function triggerHapticFeedback() {
      if ("vibrate" in navigator) {
        navigator.vibrate(50); // nice short buzz
      }
    }
  
    function handlePressEnd() {
      const pressDuration = Date.now() - pressStartTime;
      if (pressDuration < THRESHOLD_MS) {
        triggerHapticFeedback();
        toggleTheme();
      } else {
        console.log("[theme] Ignored long press");
      }
    }
  
    title.addEventListener("pointerdown", () => {
      pressStartTime = Date.now();
    });
    
    title.addEventListener("pointerup", handlePressEnd);
    
    // Optionally prevent context menu from long presses
    title.addEventListener("contextmenu", e => e.preventDefault());

    // Handle edge cases from scroll + mid tap
    title.addEventListener("pointercancel", () => {
      pressStartTime = 0;
    });

  }

  // Ensure it runs after DOM is loaded
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", runThemeInit);
  } else {
    runThemeInit();
  }
}

