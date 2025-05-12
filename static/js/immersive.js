// ==============================
// IMMERSIVE.JS
// ==============================


// =============================
// MOBILE ONLY DEVICE TEST
// ==============================
function isMobileDevice() {
  return /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|Mobile/i.test(navigator.userAgent);
}

// =============================
// IMMERSIVE MODE
// ==============================
const Immersive = {
  // Enter immersive
  enter(element = document.documentElement) {
    if (!isMobileDevice()) return;
    if (element.requestFullscreen) {
      element.requestFullscreen();
    } else if (element.webkitRequestFullscreen) {
      element.webkitRequestFullscreen(); // Safari
    } else if (element.msRequestFullscreen) {
      element.msRequestFullscreen(); // IE11
    }
  },

  // Exit immersive
  exit() {
    if (!isMobileDevice()) return;
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen(); // Safari
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen(); // IE11
    }
  },

  // Universal — is fullscreen active
  isActive() {
    return Boolean(
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.msFullscreenElement
    );
  },

  // Still fires globally, even if desktop — useful for debugging/logging
  onChange(callback) {
    document.addEventListener("fullscreenchange", callback);
    document.addEventListener("webkitfullscreenchange", callback);
    document.addEventListener("msfullscreenchange", callback);
  }
};

export default Immersive;
