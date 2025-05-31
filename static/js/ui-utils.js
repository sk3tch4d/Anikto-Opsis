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

  oscillator.type = "square";
  oscillator.frequency.setValueAtTime(1000, ctx.currentTime); // Frequency in Hz
  gain.gain.setValueAtTime(0.1, ctx.currentTime); // Volume

  oscillator.connect(gain);
  gain.connect(ctx.destination);

  oscillator.start();
  oscillator.stop(ctx.currentTime + 0.05); // 50ms blip
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
