// Lockbox v2 Background Service Worker
// Manages: auto-lock timer, context menus, omnibox, badges, messaging

const STORAGE_KEYS = {
  VAULT: "lockbox_vault",
  CONFIG: "lockbox_config",
  STATUS: "lockbox_status",
  ACCOUNT: "lockbox_account",
  DERIVED_KEY: "lockbox_derived_key",
  RECENT_KEYS: "lockbox_recent_keys",
};

// ── State ──
let lastActivity = Date.now();
let autoLockMinutes = 15;

// ── Auto-Lock Timer ──
// Create alarms inside onInstalled so they're only set once, not every wake
chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create("lockbox-autolock-check", { periodInMinutes: 1 });
  chrome.alarms.create("lockbox-badge-update", { periodInMinutes: 60 });

  // Enable side panel to open on action click (user can pin it)
  if (chrome.sidePanel) {
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: false }).catch(() => {});
  }

  // Context menu to open in side panel
  chrome.contextMenus.create({
    id: "lockbox-sidepanel",
    title: "Open Lockbox in Side Panel",
    contexts: ["action"],
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "lockbox-sidepanel" && chrome.sidePanel && tab?.windowId) {
    chrome.sidePanel.open({ windowId: tab.windowId }).catch(() => {});
  }
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === "lockbox-autolock-check") {
    await checkAutoLock();
  } else if (alarm.name === "lockbox-badge-update") {
    await updateBadge();
  }
});

async function checkAutoLock() {
  try {
    const config = await chrome.storage.local.get(STORAGE_KEYS.CONFIG);
    const walletConfig = config[STORAGE_KEYS.CONFIG];
    autoLockMinutes = walletConfig?.autoLockMinutes ?? 15;

    if (autoLockMinutes === 0) return; // Never auto-lock

    const elapsed = (Date.now() - lastActivity) / 60_000;
    if (elapsed >= autoLockMinutes) {
      const session = await chrome.storage.session.get(STORAGE_KEYS.DERIVED_KEY);
      if (session[STORAGE_KEYS.DERIVED_KEY]) {
        await chrome.storage.session.remove(STORAGE_KEYS.DERIVED_KEY);
        await chrome.storage.local.set({ [STORAGE_KEYS.STATUS]: "locked" });
        await updateBadge();
      }
    }
  } catch {}
}

// ── Context Menus ──
chrome.runtime.onInstalled.addListener(function setupContextMenus() {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: "lockbox-root",
      title: "Lockbox: Paste API Key",
      contexts: ["editable"],
    });

    chrome.contextMenus.create({
      id: "lockbox-search",
      parentId: "lockbox-root",
      title: "Search all keys...",
      contexts: ["editable"],
    });

    chrome.contextMenus.create({
      id: "lockbox-separator",
      parentId: "lockbox-root",
      type: "separator",
      contexts: ["editable"],
    });

    chrome.contextMenus.create({
      id: "lockbox-open",
      parentId: "lockbox-root",
      title: "Open Lockbox",
      contexts: ["editable"],
    });
  });

  updateBadge();
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "lockbox-open" || info.menuItemId === "lockbox-search") {
    try {
      await (chrome.action as any).openPopup();
    } catch {}
    return;
  }
});

// ── Omnibox ──
chrome.omnibox.onInputStarted.addListener(() => {
  chrome.omnibox.setDefaultSuggestion({
    description: "Search Lockbox keys... Type a service or key name",
  });
});

chrome.omnibox.onInputChanged.addListener(async (text, suggest) => {
  if (!text.trim()) return;
  suggest([
    {
      content: `search:${text}`,
      description: `Search for "<match>${text}</match>" in Lockbox`,
    },
  ]);
});

chrome.omnibox.onInputEntered.addListener(async (text) => {
  try {
    await (chrome.action as any).openPopup();
  } catch {
    // Fallback: open extension page
    const url = chrome.runtime.getURL("popup.html");
    chrome.tabs.create({ url });
  }
});

// ── Badge ──
async function updateBadge() {
  try {
    const session = await chrome.storage.session.get(STORAGE_KEYS.DERIVED_KEY);
    const isUnlocked = !!session[STORAGE_KEYS.DERIVED_KEY];

    if (!isUnlocked) {
      await chrome.action.setBadgeText({ text: "" });
      await chrome.action.setTitle({ title: "Lockbox — Locked" });
      return;
    }

    await chrome.action.setBadgeBackgroundColor({ color: "#00d87a" });
    await chrome.action.setBadgeText({ text: "" });
    await chrome.action.setTitle({ title: "Lockbox — Unlocked" });
  } catch {}
}

// ── AES/HMAC helpers for service worker (inline, no imports) ──
function base64ToBuffer(b64: string): ArrayBuffer {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

function bufferToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

async function decryptVault(vault: any, derivedKeyB64: string): Promise<any> {
  const keyMaterial = base64ToBuffer(derivedKeyB64);

  // Verify HMAC
  const hmacKey = await crypto.subtle.importKey(
    "raw", keyMaterial, { name: "HMAC", hash: "SHA-256" }, false, ["verify"]
  );
  const signatureBuf = base64ToBuffer(vault.hmac);
  const dataBuf = new TextEncoder().encode(vault.ciphertext);
  const valid = await crypto.subtle.verify("HMAC", hmacKey, signatureBuf, dataBuf);
  if (!valid) throw new Error("Invalid key");

  // Decrypt
  const ivBuf = new Uint8Array(base64ToBuffer(vault.iv));
  const ciphertextBuf = new Uint8Array(base64ToBuffer(vault.ciphertext));
  const tagBuf = new Uint8Array(base64ToBuffer(vault.tag));
  const combined = new Uint8Array(ciphertextBuf.length + tagBuf.length);
  combined.set(ciphertextBuf);
  combined.set(tagBuf, ciphertextBuf.length);

  const aesKey = await crypto.subtle.importKey(
    "raw", keyMaterial, { name: "AES-GCM" }, false, ["decrypt"]
  );
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: ivBuf, tagLength: 128 }, aesKey, combined
  );
  return JSON.parse(new TextDecoder().decode(decrypted));
}

// ── Message Handling ──
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message?.type) return;

  switch (message.type) {
    case "LOCKBOX_ACTIVITY":
      lastActivity = Date.now();
      break;

    case "LOCKBOX_LOCK":
      (async () => {
        await chrome.storage.session.remove(STORAGE_KEYS.DERIVED_KEY);
        await chrome.storage.local.set({ [STORAGE_KEYS.STATUS]: "locked" });
        await updateBadge();
      })();
      break;

    case "LOCKBOX_GET_STATUS":
      (async () => {
        try {
          const [status, session] = await Promise.all([
            chrome.storage.local.get(STORAGE_KEYS.STATUS),
            chrome.storage.session.get(STORAGE_KEYS.DERIVED_KEY),
          ]);
          sendResponse({
            status: status[STORAGE_KEYS.STATUS] || "uninitialized",
            isUnlocked: !!session[STORAGE_KEYS.DERIVED_KEY],
          });
        } catch {
          sendResponse({ status: "uninitialized", isUnlocked: false });
        }
      })();
      return true;

    case "LOCKBOX_GET_ALL_KEYS":
      (async () => {
        try {
          const session = await chrome.storage.session.get(STORAGE_KEYS.DERIVED_KEY);
          const derivedKey = session[STORAGE_KEYS.DERIVED_KEY];
          if (!derivedKey) {
            sendResponse({ keys: [], locked: true });
            return;
          }

          const stored = await chrome.storage.local.get(STORAGE_KEYS.VAULT);
          const vault = stored[STORAGE_KEYS.VAULT];
          if (!vault) {
            sendResponse({ keys: [], locked: false });
            return;
          }

          const wallet = await decryptVault(vault, derivedKey);
          const allKeys = wallet.vaults.flatMap((v: any) =>
            v.keys.map((k: any) => ({
              id: k.id,
              service: k.service,
              name: k.name,
              value: k.value,
              vaultName: v.name,
            }))
          );

          sendResponse({ keys: allKeys, locked: false });
          lastActivity = Date.now();
        } catch {
          sendResponse({ keys: [], locked: true });
        }
      })();
      return true;

    case "LOCKBOX_COPY_TO_CLIPBOARD":
      if (message.payload?.value) {
        (async () => {
          try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tab?.id) {
              chrome.tabs.sendMessage(
                tab.id,
                { type: "LOCKBOX_COPY_TO_CLIPBOARD", payload: { value: message.payload.value } },
                () => { if (chrome.runtime.lastError) { /* tab has no content script */ } }
              );
            }
          } catch {}
        })();
      }
      break;

    case "LOCKBOX_PASTE_KEY":
      if (message.payload?.value) {
        (async () => {
          try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tab?.id) {
              chrome.tabs.sendMessage(
                tab.id,
                { type: "LOCKBOX_PASTE_KEY", payload: { value: message.payload.value } },
                () => { if (chrome.runtime.lastError) { /* tab has no content script */ } }
              );
            }
          } catch {}
        })();
      }
      break;

    case "LOCKBOX_KEY_CAPTURED":
      (async () => {
        try {
          const session = await chrome.storage.session.get(STORAGE_KEYS.DERIVED_KEY);
          const derivedKey = session[STORAGE_KEYS.DERIVED_KEY];
          if (!derivedKey || !message.payload) {
            sendResponse?.({ success: false, reason: "locked" });
            return;
          }

          const stored = await chrome.storage.local.get(STORAGE_KEYS.VAULT);
          const vault = stored[STORAGE_KEYS.VAULT];
          if (!vault) return;

          const wallet = await decryptVault(vault, derivedKey);
          const defaultVault = wallet.vaults[0];
          if (!defaultVault) return;

          // Add the captured key
          const newKey = {
            id: crypto.randomUUID(),
            service: message.payload.service || "unknown",
            name: message.payload.name || "Captured Key",
            value: message.payload.value,
            notes: "Auto-captured from page",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isFavourite: false,
          };
          defaultVault.keys.push(newKey);
          wallet.updatedAt = new Date().toISOString();

          // Re-encrypt and save
          const keyMaterial = base64ToBuffer(derivedKey);
          const iv = crypto.getRandomValues(new Uint8Array(12));
          const aesKey = await crypto.subtle.importKey(
            "raw", keyMaterial, { name: "AES-GCM" }, false, ["encrypt"]
          );
          const encoded = new TextEncoder().encode(JSON.stringify(wallet));
          const encrypted = await crypto.subtle.encrypt(
            { name: "AES-GCM", iv, tagLength: 128 }, aesKey, encoded
          );
          const encBytes = new Uint8Array(encrypted);
          const ct = encBytes.slice(0, encBytes.length - 16);
          const tag = encBytes.slice(encBytes.length - 16);

          const hmacKey = await crypto.subtle.importKey(
            "raw", keyMaterial, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
          );
          const ctB64 = bufferToBase64(ct.buffer as ArrayBuffer);
          const sig = await crypto.subtle.sign("HMAC", hmacKey, new TextEncoder().encode(ctB64));

          await chrome.storage.local.set({
            [STORAGE_KEYS.VAULT]: {
              ...vault,
              ciphertext: ctB64,
              iv: bufferToBase64(iv.buffer as ArrayBuffer),
              tag: bufferToBase64(tag.buffer as ArrayBuffer),
              hmac: bufferToBase64(sig),
              updatedAt: new Date().toISOString(),
            },
          });

          lastActivity = Date.now();
        } catch (e) {
          console.error("Lockbox: failed to save captured key", e);
        }
      })();
      return true;

    case "LOCKBOX_OPEN_WITH_KEY":
      // Content script detected a key and user clicked "Save to Lockbox"
      // Store the captured key data in session storage so the popup can read it
      if (message.payload) {
        (async () => {
          try {
            await chrome.storage.session.set({
              lockbox_pending_capture: {
                service: message.payload.service,
                name: message.payload.name,
                value: message.payload.value,
                capturedAt: Date.now(),
              },
            });
            // Open the popup
            await (chrome.action as any).openPopup();
          } catch {
            // Fallback: open popup.html in a new tab
            const url = chrome.runtime.getURL("popup.html");
            chrome.tabs.create({ url });
          }
          lastActivity = Date.now();
        })();
      }
      return true;

    case "LOCKBOX_AUTH_TOKEN":
      if (message.payload?.user) {
        (async () => {
          await chrome.storage.local.set({
            [STORAGE_KEYS.ACCOUNT]: message.payload.user,
          });
          // Immediately sync to dashboard now that we have a token
          triggerSyncPush();
        })();
      }
      break;
  }
});

// ── External Message Handling (from dashboard) ──
chrome.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
  if (sender.url?.startsWith("https://dashboard.yourlockbox.dev")) {
    if (message.type === "LOCKBOX_AUTH_TOKEN") {
      (async () => {
        await chrome.storage.local.set({
          [STORAGE_KEYS.ACCOUNT]: message.payload?.user,
        });
        sendResponse({ success: true });
        // Immediately sync to dashboard now that we have a token
        triggerSyncPush();
      })();
      return true; // Keep sendResponse channel open for async
    }
  }
});

// ── Keyboard Command Handling ──
chrome.commands.onCommand.addListener(async (command) => {
  if (command === "quick-copy") {
    try {
      await (chrome.action as any).openPopup();
    } catch {}
  }
});

// ── Immediate Sync Push ──
// Lightweight sync push that can run in the service worker without imports.
// Decrypts the vault, extracts metadata, and pushes to the dashboard API.
const DASHBOARD_API = "https://dashboard.yourlockbox.dev/api";

async function triggerSyncPush() {
  try {
    const [accountData, sessionData, vaultData] = await Promise.all([
      chrome.storage.local.get(STORAGE_KEYS.ACCOUNT),
      chrome.storage.session.get(STORAGE_KEYS.DERIVED_KEY),
      chrome.storage.local.get(STORAGE_KEYS.VAULT),
    ]);

    const token = accountData[STORAGE_KEYS.ACCOUNT]?.token;
    const derivedKey = sessionData[STORAGE_KEYS.DERIVED_KEY];
    const vault = vaultData[STORAGE_KEYS.VAULT];

    if (!token || !vault) return; // Can't sync without token or vault

    const encryptedString = JSON.stringify(vault);

    // Compute checksum
    const checksumBuf = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(encryptedString)
    );
    const checksum = Array.from(new Uint8Array(checksumBuf))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    // Extract metadata from decrypted wallet if possible
    let metadata = {
      vaultCount: 0,
      totalKeys: 0,
      vaults: [] as any[],
      services: [] as any[],
      lastModified: new Date().toISOString(),
    };

    if (derivedKey) {
      try {
        const wallet = await decryptVault(vault, derivedKey);
        const serviceMap = new Map<string, number>();
        let totalKeys = 0;

        const vaults = (wallet.vaults || []).map((v: any) => {
          const svcSet = new Set<string>();
          for (const k of v.keys || []) {
            svcSet.add(k.service);
            serviceMap.set(k.service, (serviceMap.get(k.service) || 0) + 1);
          }
          totalKeys += (v.keys || []).length;
          return {
            id: v.id,
            name: v.name,
            keyCount: (v.keys || []).length,
            services: Array.from(svcSet),
            lastModified: v.updatedAt || new Date().toISOString(),
          };
        });

        metadata = {
          vaultCount: wallet.vaults?.length || 0,
          totalKeys,
          vaults,
          services: Array.from(serviceMap.entries()).map(([name, keyCount]) => ({
            name,
            keyCount,
            keyNames: [],
          })),
          lastModified: new Date().toISOString(),
        };
      } catch {
        // Decryption failed (wallet locked) — push with empty metadata
      }
    }

    await fetch(`${DASHBOARD_API}/sync/push`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ encryptedVault: encryptedString, metadata, checksum }),
    });
  } catch {
    // Sync failed silently — will retry on next trigger
  }
}

// ── Startup ──
chrome.runtime.onStartup.addListener(() => {
  lastActivity = Date.now();
  updateBadge();
});
