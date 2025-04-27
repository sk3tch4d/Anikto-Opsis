// ==============================
// LOADING.JS — Loading Spinner Control
// ==============================


// ==============================
// SHOW LOADING
// ==============================
export function showLoading(spinnerTarget = document.getElementById('loading')) {
  if (!spinnerTarget) return;

  spinnerTarget.style.display = 'block';

  // Create a spinner if not already inside
  if (!spinnerTarget.querySelector('.spinner')) {
    const spinner = document.createElement('div');
    spinner.className = 'spinner';
    spinnerTarget.appendChild(spinner);
  }
}

// ==============================
// HIDE LOADING
// ==============================
export function hideLoading(spinnerTarget = document.getElementById('loading')) {
  if (!spinnerTarget) return;

  spinnerTarget.style.display = 'none';

  const spinner = spinnerTarget.querySelector('.spinner');
  if (spinner) {
    spinner.remove();
  }
}
