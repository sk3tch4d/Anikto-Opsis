// ==============================
// UI-UTILS.JS
// ==============================

let toastTimeout;

// ==============================
// HAPTIC FEEDBACK
// ==============================
export function hapticFeedback(timer = 100) {
  const duration = Math.max(0, Number(timer));

  const hasHaptics = "vibrate" in navigator && typeof navigator.vibrate === "function";
  const didVibrate = hasHaptics ? navigator.vibrate(duration) : false;

  if (!didVibrate) {
    soundFeedback();
  }
}

// ==============================
// SOUND FEEDBACK
// ==============================
export function soundFeedback() {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();

  // Required for some browsers that suspend AudioContext until user gesture
  if (ctx.state === "suspended") {
    ctx.resume();
  }

  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();

  oscillator.type = "triangle"; // Try 'sawtooth' or 'impulse' for variation
  oscillator.frequency.setValueAtTime(60, ctx.currentTime); // Low frequency click
  gain.gain.setValueAtTime(0.3, ctx.currentTime); // Higher for a solid click
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.02); // Quick fade-out

  oscillator.connect(gain);
  gain.connect(ctx.destination);

  oscillator.start(ctx.currentTime);
  oscillator.stop(ctx.currentTime + 0.03); // Very short for a sharp feel
}

// ==============================
// SHOW TOAST
// ==============================
export function showToast(message, timer = 2000) {
  const toast = document.getElementById("toast");
  if (!toast) {
    console.warn("Toast element not found in the DOM.");
    return;
  }

  toast.textContent = message;

  if (toast.classList.contains("show")) {
    toast.classList.remove("show");
    void toast.offsetWidth;
  }
  toast.classList.add("show");

  const duration = Number(timer);
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.classList.remove("show");
  }, Number.isFinite(duration) ? duration : 2000); // Fallback to default
}

// ==============================
// CHEVRON TOGGLE
// ==============================
export function attachChevron({
  root = document,
  triggerSelector = ".clickable-toggle",
  wrapperClass = "toggle-wrapper",
  toggleClass = "show",
  openClass = "toggle-open",
  debounceTime = 250
} = {}) {
  const toggles = root.querySelectorAll(triggerSelector);

  toggles.forEach(toggle => {
    // Avoid rebinding
    if (toggle.dataset.toggleBound) return;
    toggle.dataset.toggleBound = "true";

    const targetSelector = toggle.dataset.toggleTarget;
    const wrapper = targetSelector
      ? root.querySelector(targetSelector)
      : toggle.nextElementSibling;

    if (!wrapper || !wrapper.classList.contains(wrapperClass)) {
      console.warn(`[attachChevron] No matching .${wrapperClass} found for:`, toggle);
      return;
    }

    let lastClick = 0;

    toggle.addEventListener("click", () => {
      const now = Date.now();
      if (now - lastClick < debounceTime) return;
      lastClick = now;

      wrapper.classList.toggle(toggleClass);
      toggle.classList.toggle(openClass);
    });
  });
}
