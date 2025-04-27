// ==============================
// LOADING.JS — Loading Spinner Control
// ==============================


// ==============================
// SHOW LOADING
// ==============================
export function showLoading(spinnerId = 'loading') {
  const spinnerTarget = document.getElementById(spinnerId);
  if (!spinnerTarget) return;

  spinnerTarget.style.display = 'block';

  // Ensure spinner element exists
  if (!spinnerTarget.querySelector('.spinner')) {
    const spinner = document.createElement('div');
    spinner.className = 'spinner';
    spinnerTarget.appendChild(spinner);
  }
}

// ==============================
// HIDE LOADING
// ==============================
export function hideLoading(spinnerId = 'loading') {
  const spinnerTarget = document.getElementById(spinnerId);
  if (!spinnerTarget) return;

  spinnerTarget.style.display = 'none';

  const spinner = spinnerTarget.querySelector('.spinner');
  if (spinner) {
    spinner.remove();
  }
}
