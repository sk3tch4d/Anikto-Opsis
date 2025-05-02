// ==============================
// LOADING.JS - Loading Animation
// ==============================


// ==============================
// SPINNER: LOADING TOGGLER
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
// SPINNER: LOADING WRAPPER
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


// ==============================
// BOUNCE: LOADING GENERATOR
// ==============================
export function createBounceLoader(container) {
  if (!container) return;

  const bounceWrap = document.createElement("div");
  bounceWrap.className = "loading bounce";

  ["one", "two", "three"].forEach(cls => {
    const ball = document.createElement("div");
    ball.className = `bounce-ball ${cls}`;
    bounceWrap.appendChild(ball);
  });

  container.appendChild(bounceWrap);
  return bounceWrap;
}

// ==============================
// BOUNCE: LOADING (MANUAL)
// ==============================
export function toggleBounceLoading(isLoading, bounceEl) {
  if (!bounceEl) return;
  bounceEl.style.display = isLoading ? "block" : "none";
}
