// Key capture detection — detects when a new API key is displayed on a page
// Shows a notification bar to save the key to Lockbox

/** Guard: returns true if the extension context is still alive (not reloaded/uninstalled). */
function isExtensionContextValid(): boolean {
  try {
    return !!chrome.runtime?.id;
  } catch {
    return false;
  }
}

const KEY_PATTERNS = [
  { pattern: /sk-proj-[a-zA-Z0-9_-]{20,}/, service: "openai", name: "API_KEY" },
  { pattern: /sk-ant-[a-zA-Z0-9_-]{20,}/, service: "anthropic", name: "API_KEY" },
  { pattern: /sk_test_[a-zA-Z0-9]{20,}/, service: "stripe", name: "SECRET_KEY" },
  { pattern: /sk_live_[a-zA-Z0-9]{20,}/, service: "stripe", name: "SECRET_KEY" },
  { pattern: /pk_test_[a-zA-Z0-9]{20,}/, service: "stripe", name: "PUBLISHABLE_KEY" },
  { pattern: /pk_live_[a-zA-Z0-9]{20,}/, service: "stripe", name: "PUBLISHABLE_KEY" },
  { pattern: /AKIA[A-Z0-9]{16}/, service: "aws", name: "ACCESS_KEY" },
  { pattern: /ghp_[a-zA-Z0-9]{36}/, service: "github", name: "PERSONAL_ACCESS_TOKEN" },
  { pattern: /gho_[a-zA-Z0-9]{36}/, service: "github", name: "OAUTH_TOKEN" },
  { pattern: /SG\.[a-zA-Z0-9_-]{22}\.[a-zA-Z0-9_-]{43}/, service: "sendgrid", name: "API_KEY" },
  { pattern: /re_[a-zA-Z0-9]{20,}/, service: "resend", name: "API_KEY" },
  { pattern: /dop_v1_[a-f0-9]{64}/, service: "digitalocean", name: "TOKEN" },
  { pattern: /pscale_tkn_[a-zA-Z0-9_-]{20,}/, service: "planetscale", name: "TOKEN" },
];

const CAPTURE_BAR_CLASS = "lockbox-capture-bar";
let capturedKeys = new Set<string>();

function scanForKeys(): { value: string; service: string; name: string } | null {
  // Look for key values in code blocks, pre elements, and specific containers
  const selectors = [
    "code",
    "pre",
    ".api-key",
    "[data-testid*='key']",
    "[data-testid*='token']",
    "[data-testid*='secret']",
    ".secret-key",
    ".token-value",
    "input[type='text'][readonly]",
    "input[readonly][value]",
    ".copy-text",
    "[data-clipboard-text]",
  ];

  for (const selector of selectors) {
    try {
      const elements = document.querySelectorAll(selector);
      for (const el of elements) {
        let text = "";
        if (el instanceof HTMLInputElement) {
          text = el.value;
        } else {
          text = el.textContent || "";
        }

        // Also check data-clipboard-text attribute
        const clipboardText = el.getAttribute("data-clipboard-text");
        if (clipboardText) text = clipboardText;

        for (const { pattern, service, name } of KEY_PATTERNS) {
          const match = text.match(pattern);
          if (match && !capturedKeys.has(match[0])) {
            return { value: match[0], service, name };
          }
        }
      }
    } catch {}
  }

  return null;
}

function showCaptureBar(keyInfo: { value: string; service: string; name: string }) {
  // Don't show again for same key
  if (capturedKeys.has(keyInfo.value)) return;
  capturedKeys.add(keyInfo.value);

  // Remove existing bar
  document.querySelectorAll(`.${CAPTURE_BAR_CLASS}`).forEach((el) => el.remove());

  const serviceName = keyInfo.service.charAt(0).toUpperCase() + keyInfo.service.slice(1);

  const bar = document.createElement("div");
  bar.className = CAPTURE_BAR_CLASS;
  bar.innerHTML = `
    <div class="lockbox-capture-content">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00d87a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
      </svg>
      <div class="lockbox-capture-text">
        <strong>Save this API key to Lockbox?</strong>
        <span>${serviceName} ${keyInfo.name} detected</span>
      </div>
      <button class="lockbox-capture-save">Save to Lockbox</button>
      <button class="lockbox-capture-dismiss">&times;</button>
    </div>
  `;

  document.body.appendChild(bar);

  // Save button — stores key data as a pending capture and opens the popup
  bar.querySelector(".lockbox-capture-save")?.addEventListener("click", () => {
    if (!isExtensionContextValid()) {
      bar.remove();
      return;
    }

    // Send message to service worker to store the pending key and open the popup
    chrome.runtime.sendMessage(
      {
        type: "LOCKBOX_OPEN_WITH_KEY",
        payload: {
          service: keyInfo.service,
          name: keyInfo.name,
          value: keyInfo.value,
        },
      },
      () => {
        // Consume lastError to prevent "Unchecked runtime.lastError"
        if (chrome.runtime.lastError) {
          console.debug("Lockbox: could not open popup", chrome.runtime.lastError.message);
        }
      }
    );

    bar.innerHTML = `
      <div class="lockbox-capture-content">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00d87a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
        <span style="color: #00d87a; font-weight: 500;">Opening Lockbox...</span>
      </div>
    `;
    setTimeout(() => bar.remove(), 3000);
  });

  // Dismiss button
  bar.querySelector(".lockbox-capture-dismiss")?.addEventListener("click", () => {
    bar.remove();
  });

  // Auto-dismiss after 30 seconds
  setTimeout(() => {
    if (document.contains(bar)) bar.remove();
  }, 30000);
}

// ── Watch for new key displays ──
function initCapture() {
  // Guard against restricted pages where document.body may be null
  if (!document.body) return;

  // Scan on load
  const found = scanForKeys();
  if (found) showCaptureBar(found);

  // Watch for DOM changes (keys often appear after page load)
  const observer = new MutationObserver(() => {
    if (!isExtensionContextValid()) {
      observer.disconnect();
      return;
    }
    const found = scanForKeys();
    if (found) showCaptureBar(found);
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true,
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initCapture);
} else {
  // Small delay to let page render
  setTimeout(initCapture, 1000);
}
