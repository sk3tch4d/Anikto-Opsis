// ==============================
// NAV-BUTTONS.JS
// ==============================


// ==============================
// UPDATE NAVIGATION BUTTONS
// ==============================
/**
 * Smart nav button state manager
 * @param {HTMLSelectElement} select - The <select> element being controlled
 * @param {string} prevBtnId - ID of the previous nav button
 * @param {string} nextBtnId - ID of the next nav button
 * @param {"hide"|"fade"} mode - Visual style when disabled
 */
export function updateNavButtons(select, prevBtnId, nextBtnId, mode = "hide") {
  const prevBtn = document.getElementById(prevBtnId);
  const nextBtn = document.getElementById(nextBtnId);
  if (!select || !prevBtn || !nextBtn) return;

  const isFirst = select.selectedIndex <= 1;
  const isLast = select.selectedIndex >= select.options.length - 1;

  if (mode === "fade") {
    prevBtn.style.opacity = isFirst ? "0.3" : "1";
    nextBtn.style.opacity = isLast ? "0.3" : "1";
    prevBtn.style.pointerEvents = isFirst ? "none" : "auto";
    nextBtn.style.pointerEvents = isLast ? "none" : "auto";
  } else {
    prevBtn.style.visibility = isFirst ? "hidden" : "visible";
    nextBtn.style.visibility = isLast ? "hidden" : "visible";
  }
}
