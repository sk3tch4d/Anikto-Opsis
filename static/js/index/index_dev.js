// ==============================
// INDEX_DEV.JS
// ==============================


// ==============================
// ENABLE DEV MODE
// ==============================
export function enableDevModeTrigger() {
  const dropZone = document.getElementById("drop-zone");
  if (!dropZone) return;

  let pressTimer;

  const injectDevForm = () => {
    if (document.getElementById("dev-form")) return;

    const form = document.createElement("form");
    form.id = "dev-form";
    form.action = "/dev-mode";
    form.method = "post";
    form.classList.add("dev-popup-form");

    const closeBtn = document.createElement("div");
    closeBtn.textContent = "×";
    closeBtn.classList.add("close-btn");
    closeBtn.onclick = () => form.remove();

    const label = document.createElement("label");
    label.textContent = "Enter Access Token";
    label.style.fontSize = "1.2rem";

    const input = document.createElement("input");
    input.classList.add("input", "full-width");
    input.type = "password";
    input.name = "token";
    input.required = true;
    input.minLength = 1;

    const submit = document.createElement("button");
    submit.type = "submit";
    submit.textContent = "Developer Mode";
    submit.classList.add("button", "full-width-on", "panel-animate");
    submit.disabled = true;

    // Enable button if input is not empty
    input.addEventListener("input", () => {
      submit.disabled = input.value.trim().length === 0;
    });

  form.appendChild(label);
  form.appendChild(document.createElement("br"));
  form.appendChild(document.createElement("br"));
  form.appendChild(input);
  form.appendChild(submit);
  form.appendChild(closeBtn);

  document.body.appendChild(form);
  requestAnimationFrame(() => input.focus());

  form.addEventListener("submit", (e) => {
      e.preventDefault(); // prevent reload
    
      const token = input.value.trim();
      if (!token) return;
    
      fetch("/dev-mode", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ token })
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            form.remove();
            renderDevPanel();
          } else {
            alert("Invalid access token.");
          }
        })
        .catch(() => alert("Something went wrong. Please try again."));
    });
  
  };

  const startPress = () => {
    pressTimer = setTimeout(injectDevForm, 3000);
  };

  const cancelPress = () => clearTimeout(pressTimer);

  dropZone.addEventListener("mousedown", startPress);
  dropZone.addEventListener("mouseup", cancelPress);
  dropZone.addEventListener("mouseleave", cancelPress);
  dropZone.addEventListener("touchstart", startPress);
  dropZone.addEventListener("touchend", cancelPress);
  dropZone.addEventListener("touchcancel", cancelPress);
}

// ==============================
// INIT DROPZONE IF NOT IN DEV
// ==============================
export function initDropzoneIfNotDev() {
  const form = document.querySelector("form");
  if (!form) return;

  renderDevPanel().then(isDev => {
    if (!isDev) {
      renderDropzoneUI();
      enableDevModeTrigger();
    }
  });
}
