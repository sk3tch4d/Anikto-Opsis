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

// ==============================
// SHOW PANEL LOADING
// ==============================
function showPanelSpinner() {
  const openPanel = document.querySelector('.panel.open');
  if (!openPanel) return;
  const spinner = openPanel.querySelector('.panel-loading');
  if (spinner) {
    spinner.classList.add('show');
    spinner.style.display = 'block';
  }
}

// ==============================
// HIDE PANEL LOADING
// ==============================
function hidePanelSpinner() {
  const openPanel = document.querySelector('.panel.open');
  if (!openPanel) return;
  const spinner = openPanel.querySelector('.panel-loading');
  if (spinner) {
    spinner.classList.remove('show');
    spinner.style.display = 'none';
  }
}
