// ==============================
// LOADING TOGGLER
// ==============================
export function toggleLoadingState(isLoading, { show, hide } = {}) {
  if (!show || !hide) return;

  show.forEach(el => {
    if (el) el.style.display = isLoading ? "block" : "none";
  });

  hide.forEach(el => {
    if (el) el.style.display = isLoading ? "none" : "block";
  });
}

// ==============================
// LOADING WRAPPER
// ==============================
export function withLoadingToggle({ show, hide }, task = () => {}) {
  const run = () => {
    toggleLoadingState(true, { show, hide });

    Promise.resolve(task()).finally(() => {
      toggleLoadingState(false, { show, hide });
    });
  };

  if (document.readyState === "complete" || document.readyState === "interactive") {
    run();
  } else {
    document.addEventListener("DOMContentLoaded", run);
  }
}
