const STORAGE_KEY = "mickcodex-checklist";
const deployCommand = "wrangler pages deploy public --project-name mickcodex";

const savedState = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");

document.querySelectorAll("[data-task]").forEach((checkbox) => {
  const task = checkbox.dataset.task;
  if (Object.prototype.hasOwnProperty.call(savedState, task)) {
    checkbox.checked = savedState[task];
  }

  checkbox.addEventListener("change", () => {
    savedState[task] = checkbox.checked;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(savedState));
  });
});

const copyButton = document.querySelector("#copy-command");
const copyStatus = document.querySelector("#copy-status");

copyButton?.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(deployCommand);
    copyStatus.textContent = "Deploy command copied.";
  } catch {
    copyStatus.textContent = deployCommand;
  }
});

