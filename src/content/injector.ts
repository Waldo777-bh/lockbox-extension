import { detectApiKeyFields, type DetectedField } from "./detector";

const LOCKBOX_ICON_CLASS = "lockbox-field-icon";
const LOCKBOX_PICKER_CLASS = "lockbox-key-picker";

interface KeyOption {
  vaultId: string;
  vaultName: string;
  keyId: string;
  keyName: string;
  service: string;
}

// Track injected icons to avoid duplicates
const injectedFields = new WeakSet();

function createLockboxIcon(field: DetectedField): HTMLButtonElement {
  const btn = document.createElement("button");
  btn.className = LOCKBOX_ICON_CLASS;
  btn.title = "Fill with Lockbox key";
  btn.type = "button";

  // Lock SVG icon
  btn.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="7" width="10" height="7" rx="1.5" fill="#22c55e"/>
      <path d="M5.5 7V5a2.5 2.5 0 015 0v2" stroke="#22c55e" stroke-width="1.5" stroke-linecap="round" fill="none"/>
      <circle cx="8" cy="10.5" r="1" fill="#0a0a0f"/>
    </svg>
  `;

  btn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    showKeyPicker(field.element, btn);
  });

  return btn;
}

function positionIcon(
  icon: HTMLButtonElement,
  field: HTMLInputElement | HTMLTextAreaElement,
) {
  const rect = field.getBoundingClientRect();
  icon.style.position = "absolute";
  icon.style.top = `${window.scrollY + rect.top + (rect.height - 24) / 2}px`;
  icon.style.left = `${window.scrollX + rect.right - 28}px`;
  icon.style.zIndex = "999999";
}

async function showKeyPicker(
  field: HTMLInputElement | HTMLTextAreaElement,
  iconBtn: HTMLButtonElement,
) {
  // Remove existing picker
  document.querySelectorAll(`.${LOCKBOX_PICKER_CLASS}`).forEach((el) => el.remove());

  const picker = document.createElement("div");
  picker.className = LOCKBOX_PICKER_CLASS;

  // Position below the icon
  const iconRect = iconBtn.getBoundingClientRect();
  picker.style.position = "fixed";
  picker.style.top = `${iconRect.bottom + 4}px`;
  picker.style.left = `${Math.max(8, iconRect.left - 200)}px`;
  picker.style.zIndex = "9999999";

  picker.innerHTML = `
    <div class="lockbox-picker-header">
      <span class="lockbox-picker-title">Select a key</span>
    </div>
    <div class="lockbox-picker-loading">
      <div class="lockbox-spinner"></div>
      <span>Loading keys...</span>
    </div>
  `;

  document.body.appendChild(picker);

  // Close on outside click
  const closeHandler = (e: MouseEvent) => {
    if (!picker.contains(e.target as Node) && e.target !== iconBtn) {
      picker.remove();
      document.removeEventListener("click", closeHandler);
    }
  };
  setTimeout(() => document.addEventListener("click", closeHandler), 10);

  // Fetch keys from background
  try {
    const response = await chrome.runtime.sendMessage({ type: "LOCKBOX_GET_KEYS" });
    const vaults = response?.vaults;

    if (!vaults || vaults.length === 0) {
      picker.innerHTML = `
        <div class="lockbox-picker-header">
          <span class="lockbox-picker-title">Lockbox</span>
        </div>
        <div class="lockbox-picker-empty">No keys available. Open Lockbox to add keys.</div>
      `;
      return;
    }

    const options: KeyOption[] = [];
    for (const vault of vaults) {
      for (const key of vault.keys) {
        options.push({
          vaultId: vault.id,
          vaultName: vault.name,
          keyId: key.id,
          keyName: key.name,
          service: key.service,
        });
      }
    }

    let html = `
      <div class="lockbox-picker-header">
        <span class="lockbox-picker-title">Select a key</span>
      </div>
      <div class="lockbox-picker-list">
    `;

    for (const opt of options.slice(0, 15)) {
      html += `
        <button class="lockbox-picker-item" data-vault-id="${opt.vaultId}" data-key-id="${opt.keyId}">
          <span class="lockbox-picker-service">${escapeHtml(opt.service)}</span>
          <span class="lockbox-picker-name">${escapeHtml(opt.keyName)}</span>
          <span class="lockbox-picker-vault">${escapeHtml(opt.vaultName)}</span>
        </button>
      `;
    }

    html += "</div>";
    picker.innerHTML = html;

    // Handle key selection
    picker.querySelectorAll(".lockbox-picker-item").forEach((item) => {
      item.addEventListener("click", async () => {
        const vaultId = item.getAttribute("data-vault-id")!;
        const keyId = item.getAttribute("data-key-id")!;

        try {
          const result = await chrome.runtime.sendMessage({
            type: "LOCKBOX_REVEAL_KEY",
            vaultId,
            keyId,
          });

          if (result?.value) {
            // Set the field value
            const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
              window.HTMLInputElement.prototype,
              "value",
            )?.set;

            if (nativeInputValueSetter) {
              nativeInputValueSetter.call(field, result.value);
            } else {
              field.value = result.value;
            }

            // Trigger input events for React/Vue/Angular
            field.dispatchEvent(new Event("input", { bubbles: true }));
            field.dispatchEvent(new Event("change", { bubbles: true }));
            field.dispatchEvent(
              new KeyboardEvent("keydown", { bubbles: true }),
            );
            field.dispatchEvent(new KeyboardEvent("keyup", { bubbles: true }));
          }
        } catch (err) {
          console.error("Lockbox: Failed to fill key", err);
        }

        picker.remove();
        document.removeEventListener("click", closeHandler);
      });
    });
  } catch (err) {
    picker.innerHTML = `
      <div class="lockbox-picker-header">
        <span class="lockbox-picker-title">Lockbox</span>
      </div>
      <div class="lockbox-picker-empty">Sign in to Lockbox to use auto-fill.</div>
    `;
  }
}

function escapeHtml(str: string): string {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function injectIcons() {
  const fields = detectApiKeyFields();

  for (const field of fields) {
    if (injectedFields.has(field.element)) continue;
    injectedFields.add(field.element);

    const icon = createLockboxIcon(field);
    document.body.appendChild(icon);
    positionIcon(icon, field.element);

    // Reposition on scroll/resize
    const reposition = () => positionIcon(icon, field.element);
    window.addEventListener("scroll", reposition, { passive: true });
    window.addEventListener("resize", reposition, { passive: true });

    // Watch for element removal
    const observer = new MutationObserver(() => {
      if (!document.contains(field.element)) {
        icon.remove();
        observer.disconnect();
        window.removeEventListener("scroll", reposition);
        window.removeEventListener("resize", reposition);
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }
}

// ---- Message Handlers ----

chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "LOCKBOX_PASTE_KEY" && message.value) {
    const activeEl = document.activeElement as HTMLInputElement | null;
    if (activeEl && (activeEl.tagName === "INPUT" || activeEl.tagName === "TEXTAREA")) {
      const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        "value",
      )?.set;

      if (nativeInputValueSetter) {
        nativeInputValueSetter.call(activeEl, message.value);
      } else {
        activeEl.value = message.value;
      }
      activeEl.dispatchEvent(new Event("input", { bubbles: true }));
      activeEl.dispatchEvent(new Event("change", { bubbles: true }));
    }
  }

  if (message.type === "LOCKBOX_COPY_TO_CLIPBOARD" && message.value) {
    navigator.clipboard.writeText(message.value).catch(console.error);
  }

  if (message.type === "LOCKBOX_SHOW_PICKER") {
    const activeEl = document.activeElement as HTMLInputElement | null;
    if (activeEl && (activeEl.tagName === "INPUT" || activeEl.tagName === "TEXTAREA")) {
      // Create a temporary button near the active element
      const tempBtn = document.createElement("button");
      tempBtn.style.position = "fixed";
      const rect = activeEl.getBoundingClientRect();
      tempBtn.style.top = `${rect.bottom}px`;
      tempBtn.style.left = `${rect.left}px`;
      tempBtn.style.display = "none";
      document.body.appendChild(tempBtn);
      showKeyPicker(activeEl, tempBtn).finally(() => tempBtn.remove());
    }
  }
});

// ---- Init ----

// Run initial detection
injectIcons();

// Re-scan periodically for dynamically loaded fields
const scanInterval = setInterval(injectIcons, 3000);

// Also observe DOM changes
const domObserver = new MutationObserver(() => {
  injectIcons();
});
domObserver.observe(document.body, {
  childList: true,
  subtree: true,
});

// Clean up on unload
window.addEventListener("unload", () => {
  clearInterval(scanInterval);
  domObserver.disconnect();
});
