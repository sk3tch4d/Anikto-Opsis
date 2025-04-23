// ==============================
// LOADING UI TOGGLER
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
