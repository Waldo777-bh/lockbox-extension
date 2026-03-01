// Lockbox icon injection and key picker for detected API key fields

import { detectApiKeyFields, type DetectedField } from "./detector";

/** Guard: returns true if the extension context is still alive (not reloaded/uninstalled). */
function isExtensionContextValid(): boolean {
  try {
    return !!chrome.runtime?.id;
  } catch {
    return false;
  }
}

const ICON_CLASS = "lockbox-field-icon";
const PICKER_CLASS = "lockbox-key-picker";
const PROCESSED_ATTR = "data-lockbox-processed";

// Known platforms for filtering keys
const PLATFORM_MAP: Record<string, string> = {
  "platform.openai.com": "openai",
  "console.anthropic.com": "anthropic",
  "dashboard.stripe.com": "stripe",
  "console.aws.amazon.com": "aws",
  "github.com": "github",
  "vercel.com": "vercel",
  "supabase.com": "supabase",
  "console.firebase.google.com": "firebase",
  "dashboard.clerk.com": "clerk",
  "railway.app": "railway",
  "console.cloud.google.com": "google_cloud",
  "dash.cloudflare.com": "cloudflare",
  "console.twilio.com": "twilio",
  "app.sendgrid.com": "sendgrid",
  "app.netlify.com": "netlify",
  "cloud.digitalocean.com": "digitalocean",
  "dashboard.heroku.com": "heroku",
  "resend.com": "resend",
  "console.neon.tech": "neon",
  "app.planetscale.com": "planetscale",
};

function getCurrentPlatform(): string | null {
  const hostname = window.location.hostname;
  for (const [domain, service] of Object.entries(PLATFORM_MAP)) {
    if (hostname === domain || hostname.endsWith("." + domain)) {
      return service;
    }
  }
  return null;
}

function createLockboxIcon(): HTMLButtonElement {
  const btn = document.createElement("button");
  btn.className = ICON_CLASS;
  btn.title = "Fill from Lockbox";
  btn.setAttribute("type", "button");
  btn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00d87a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`;
  return btn;
}

function positionIcon(icon: HTMLElement, field: HTMLElement) {
  const rect = field.getBoundingClientRect();
  icon.style.position = "absolute";
  icon.style.zIndex = "2147483647";
  icon.style.top = `${rect.top + window.scrollY + (rect.height - 24) / 2}px`;
  icon.style.left = `${rect.right + window.scrollX - 30}px`;
}

function fillField(field: HTMLInputElement | HTMLTextAreaElement, value: string) {
  // Use native setter to trigger React/Angular/Vue change detection
  const nativeSetter = Object.getOwnPropertyDescriptor(
    field.tagName === "TEXTAREA"
      ? HTMLTextAreaElement.prototype
      : HTMLInputElement.prototype,
    "value"
  )?.set;

  if (nativeSetter) {
    nativeSetter.call(field, value);
  } else {
    field.value = value;
  }

  field.dispatchEvent(new Event("input", { bubbles: true }));
  field.dispatchEvent(new Event("change", { bubbles: true }));
  field.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true }));
  field.dispatchEvent(new KeyboardEvent("keyup", { bubbles: true }));
}

function showKeyPicker(field: DetectedField, icon: HTMLElement) {
  // Remove any existing picker
  document.querySelectorAll(`.${PICKER_CLASS}`).forEach((el) => el.remove());

  const picker = document.createElement("div");
  picker.className = PICKER_CLASS;

  const rect = icon.getBoundingClientRect();
  picker.style.position = "fixed";
  picker.style.zIndex = "2147483647";
  picker.style.top = `${rect.bottom + 4}px`;
  picker.style.left = `${Math.max(10, rect.right - 280)}px`;

  picker.innerHTML = `
    <div class="lockbox-picker-header">
      <span>Select a key</span>
      <button class="lockbox-picker-close">&times;</button>
    </div>
    <div class="lockbox-picker-loading">
      <div class="lockbox-spinner"></div>
      <span>Loading keys...</span>
    </div>
    <div class="lockbox-picker-list" style="display:none"></div>
    <div class="lockbox-picker-empty" style="display:none">
      <span>No keys found</span>
    </div>
    <div class="lockbox-picker-locked" style="display:none">
      <span>Wallet is locked. Click the Lockbox icon to unlock.</span>
    </div>
  `;

  document.body.appendChild(picker);

  // Close button
  picker.querySelector(".lockbox-picker-close")?.addEventListener("click", () => {
    picker.remove();
  });

  // Close on click outside
  const onClickOutside = (e: MouseEvent) => {
    if (!picker.contains(e.target as Node) && e.target !== icon) {
      picker.remove();
      document.removeEventListener("click", onClickOutside);
    }
  };
  setTimeout(() => document.addEventListener("click", onClickOutside), 100);

  // Request keys from background
  if (!isExtensionContextValid()) {
    picker.remove();
    return;
  }
  chrome.runtime.sendMessage({ type: "LOCKBOX_GET_ALL_KEYS" }, (response) => {
    // Consume lastError to prevent "Unchecked runtime.lastError" in console
    if (chrome.runtime.lastError) {
      console.debug("Lockbox: could not reach background", chrome.runtime.lastError.message);
    }

    const loading = picker.querySelector(".lockbox-picker-loading") as HTMLElement;
    const list = picker.querySelector(".lockbox-picker-list") as HTMLElement;
    const empty = picker.querySelector(".lockbox-picker-empty") as HTMLElement;
    const locked = picker.querySelector(".lockbox-picker-locked") as HTMLElement;

    if (!response || response.locked) {
      loading.style.display = "none";
      locked.style.display = "flex";
      return;
    }

    let keys = response.keys || [];
    const platform = getCurrentPlatform();

    // Filter by platform if on a known site
    if (platform) {
      const platformKeys = keys.filter((k: any) => k.service === platform);
      if (platformKeys.length > 0) keys = platformKeys;
    }

    if (keys.length === 0) {
      loading.style.display = "none";
      empty.style.display = "flex";
      return;
    }

    loading.style.display = "none";
    list.style.display = "block";

    // Render keys (max 15)
    keys.slice(0, 15).forEach((key: any) => {
      const row = document.createElement("button");
      row.className = "lockbox-picker-row";
      row.type = "button";

      const initial = (key.service || "?")[0].toUpperCase();
      row.innerHTML = `
        <div class="lockbox-picker-icon">${initial}</div>
        <div class="lockbox-picker-info">
          <div class="lockbox-picker-name">${escapeHtml(key.name)}</div>
          <div class="lockbox-picker-service">${escapeHtml(key.service)} · ${escapeHtml(key.vaultName || "")}</div>
        </div>
      `;

      row.addEventListener("click", () => {
        fillField(field.element, key.value);
        picker.remove();
        showFillConfirmation(field.element);
      });

      list.appendChild(row);
    });
  });
}

function showFillConfirmation(field: HTMLElement) {
  const toast = document.createElement("div");
  toast.className = "lockbox-fill-toast";
  toast.textContent = "Filled from Lockbox";

  const rect = field.getBoundingClientRect();
  toast.style.position = "fixed";
  toast.style.zIndex = "2147483647";
  toast.style.top = `${rect.top - 30}px`;
  toast.style.left = `${rect.left}px`;

  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2000);
}

function escapeHtml(str: string): string {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// ── Main injection logic ──
function injectIcons() {
  const fields = detectApiKeyFields();

  for (const field of fields) {
    if (field.element.hasAttribute(PROCESSED_ATTR)) continue;
    field.element.setAttribute(PROCESSED_ATTR, "true");

    const icon = createLockboxIcon();
    document.body.appendChild(icon);
    positionIcon(icon, field.element);

    icon.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      showKeyPicker(field, icon);
    });

    // Reposition on scroll/resize
    const reposition = () => positionIcon(icon, field.element);
    window.addEventListener("scroll", reposition, { passive: true });
    window.addEventListener("resize", reposition, { passive: true });

    // Clean up if field is removed
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

// ── Message handlers from background ──
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "LOCKBOX_PASTE_KEY" && message.payload?.value) {
    const active = document.activeElement;
    if (
      active instanceof HTMLInputElement ||
      active instanceof HTMLTextAreaElement
    ) {
      fillField(active, message.payload.value);
      showFillConfirmation(active);
    }
  }

  if (message.type === "LOCKBOX_COPY_TO_CLIPBOARD" && message.payload?.value) {
    navigator.clipboard.writeText(message.payload.value).catch(() => {});
  }
});

// ── Init ──
function init() {
  // Guard against restricted pages where document.body may be null
  if (!document.body) return;

  // Initial scan
  injectIcons();

  // Re-scan periodically for dynamically added fields
  const scanInterval = setInterval(() => {
    if (!isExtensionContextValid()) {
      clearInterval(scanInterval);
      return;
    }
    injectIcons();
  }, 3000);

  // Also watch for DOM changes
  const observer = new MutationObserver(() => {
    if (!isExtensionContextValid()) {
      observer.disconnect();
      return;
    }
    injectIcons();
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
