// ==============================
// ADMIN.JS
// ==============================

import { collapseAllPanels, scrollPanel } from './panels.js';

// ==============================
// DEBUG MODE
// ==============================
const DEBUG_MODE = localStorage.getItem("DEBUG_MODE") === "true";
if (DEBUG_MODE) console.log("[DEBUG] Admin Module Loaded");

// ==============================
// ADMIN GATE
// ==============================
export function initAdminLogin() {
  const form = document.getElementById("admin-login-form");
  const input = document.getElementById("adpw");
  const errorMsg = document.getElementById("login-error");
  const loginPanel = document.getElementById("login-panel");
  const adminPanels = document.getElementById("admin-panels");

  if (!form || !input || !errorMsg || !loginPanel || !adminPanels) {
    if (DEBUG_MODE) console.warn("[DEBUG] Missing admin login element(s).");
    return;
  }

  if (DEBUG_MODE) console.log("[DEBUG] Admin login initialized.");
  collapseAllPanels({ excludeSelector: "#login-panel" });

  requestAnimationFrame(() => {
    input.focus();
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (DEBUG_MODE) console.log("[DEBUG] Login form submitted.");
    attemptLogin();
  });

  function attemptLogin() {
    const value = input.value.trim();
    const correct = "getElementById";

    if (DEBUG_MODE) console.log(`[DEBUG] Password entered: "${value}"`);

    if (value === correct) {
      loginPanel.style.display = "none";
      adminPanels.style.display = "block";
      if (DEBUG_MODE) console.log("[DEBUG] Login successful. Admin panel shown.");
    } else {
      errorMsg.style.display = "block";
      if (DEBUG_MODE) console.warn("[DEBUG] Incorrect password.");
    }
  }
}

// ==============================
// CUSTOM JSON UPLOAD FORM
// ==============================
export function initJsonUploadForm() {
  const form = document.getElementById('json-import-form');
  const fileInput = document.getElementById('json-upload');
  if (!form || !fileInput) {
    if (DEBUG_MODE) console.warn("[DEBUG] JSON form or input not found.");
    return;
  }

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    const file = fileInput.files[0];

    if (!file) {
      alert("Please select a JSON file.");
      if (DEBUG_MODE) console.warn("[DEBUG] JSON file submission blocked: No file selected.");
      return;
    }

    const reader = new FileReader();
    reader.onload = function () {
      if (DEBUG_MODE) console.log("[DEBUG] Uploading JSON:", file.name);

      fetch("/import/shifts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: reader.result
      })
        .then(res => res.json())
        .then(data => {
          alert("Import successful:\n" + JSON.stringify(data));
          fileInput.value = "";
          if (DEBUG_MODE) console.log("[DEBUG] JSON import response:", data);
        })
        .catch(err => {
          alert("Error: " + err.message);
          if (DEBUG_MODE) console.error("[DEBUG] JSON import error:", err);
        });
    };

    reader.readAsText(file);
  });
}

// ==============================
// AUTO-SUBMIT + LABEL DISPLAY FOR FILE INPUTS
// ==============================
export function initFileUploadDisplay() {
  const jsonInput = document.getElementById("json-upload");
  const csvInput = document.getElementById("csv-upload");

  if (jsonInput) {
    jsonInput.addEventListener("change", function () {
      this.parentElement.textContent = this.files[0]?.name || "Choose JSON File";
      this.form.requestSubmit();
      if (DEBUG_MODE) console.log(`[DEBUG] JSON file auto-submitted: ${this.files[0]?.name}`);
    });
  }

  if (csvInput) {
    csvInput.addEventListener("change", function () {
      this.parentElement.textContent = this.files[0]?.name || "Choose CSV File";
      this.form.submit();
      if (DEBUG_MODE) console.log(`[DEBUG] CSV file auto-submitted: ${this.files[0]?.name}`);
    });
  }

  if (!jsonInput && !csvInput && DEBUG_MODE) {
    console.warn("[DEBUG] No file upload inputs found for auto-submit.");
  }
}

// ==============================
// LOAD ADMIN PAGE
// ==============================
export function loadAdminPage() {
  const title = document.querySelector("h1");
  if (!title) return;

  const pressHold = (targetElement, action, holdTime = 2000) => {
    let pressTimer = null;

    const start = () => {
      if (!pressTimer) {
        pressTimer = setTimeout(() => {
          action();
          pressTimer = null;
        }, holdTime);
      }
    };

    const cancel = () => {
      clearTimeout(pressTimer);
      pressTimer = null;
    };

    targetElement.addEventListener("touchstart", start);
    targetElement.addEventListener("touchend", cancel);
    targetElement.addEventListener("touchcancel", cancel);
    targetElement.addEventListener("mousedown", start);
    targetElement.addEventListener("mouseup", cancel);
    targetElement.addEventListener("mouseleave", cancel);
  };

  pressHold(title, () => {
    window.location.href = "/1902";
  });
}

// ==============================
// LOG VIEWER PANEL
// ==============================
export function initLogViewer() {
  const select = document.getElementById("logTypeSelect");
  const output = document.getElementById("logOutput");

  if (!select || !output) {
    if (DEBUG_MODE) console.warn("[DEBUG] Log viewer elements missing.");
    return;
  }

  async function loadLog() {
    const type = select.value;
    output.textContent = "Loading...";

    try {
      const res = await fetch(`/view-log?type=${type}`);
      if (!res.ok) {
        output.textContent = "❌ Failed to load log file.";
        return;
      }
      const text = await res.text();
      output.textContent = text || "[No content in log file]";
      if (DEBUG_MODE) console.log(`[DEBUG] Loaded ${type} log.`);
    } catch (err) {
      output.textContent = "⚠️ Error loading log file.";
      console.error("[DEBUG] Error loading log:", err);
    }
  }

  // Load on select change & page init
  select.addEventListener("change", loadLog);
  loadLog();

  // Adjust Log Window
  const header = document.querySelector('#log-viewer-panel .panel-header');
    scrollPanel(header);
  }, DEBOUNCE_DELAY);

  // Double-click to toggle text wrapping
  output.addEventListener("dblclick", () => {
    const isWrapped = output.style.whiteSpace === "pre-wrap";
    output.style.whiteSpace = isWrapped ? "pre" : "pre-wrap";
    if (DEBUG_MODE) console.log(`[DEBUG] Wrapping toggled: ${!isWrapped}`);
  });
}
