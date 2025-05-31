// ==============================
// UI-UTILS.JS
// ==============================


// ==============================
// HAPTIC FEEDBACK
// ==============================
function hapticFeedback(timer = 100) {
  const duration = Math.max(0, Number(timer)); // Prevent Negative Values
  if ("vibrate" in navigator && typeof navigator.vibrate === "function") {
    navigator.vibrate(duration);
  }
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
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, Number(timer)); // Ensure timer is number
}
