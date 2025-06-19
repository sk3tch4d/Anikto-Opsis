// ==============================
// PANELS_UTILS.JS
// ==============================


// ==============================
// BODY SCROLL LOCK
// ==============================
function setBodyLock(lock = true) {
  const value = lock ? 'hidden' : '';
  document.documentElement.style.overflow = value;
  document.body.style.overflow = value;
}
