import { API_BASE_URL, DASHBOARD_URL, STORAGE_KEYS } from "../lib/constants";
import type { ApiKey, Vault, VaultWithKeys } from "../types";

// ---- Context Menu Setup ----

chrome.runtime.onInstalled.addListener(() => {
  // Create root context menu
  chrome.contextMenus.create({
    id: "lockbox-root",
    title: "Lockbox: Paste API Key",
    contexts: ["editable"],
  });

  // Set up alarm for periodic checks
  chrome.alarms.create("lockbox-check-expiring", { periodInMinutes: 60 });
  chrome.alarms.create("lockbox-cache-refresh", { periodInMinutes: 5 });
});

// ---- Context Menu Click Handler ----

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (!tab?.id) return;

  if (info.menuItemId === "lockbox-root") {
    // Show submenu would require dynamic menus, so we send a message
    // to the content script to show a picker
    chrome.tabs.sendMessage(tab.id, {
      type: "LOCKBOX_SHOW_PICKER",
    });
    return;
  }

  // Handle key paste from submenu
  const menuId = String(info.menuItemId);
  if (menuId.startsWith("lockbox-key-")) {
    const [vaultId, keyId] = menuId.replace("lockbox-key-", "").split(":");
    try {
      const token = await getToken();
      if (!token) return;

      const response = await fetch(
        `${API_BASE_URL}/vaults/${vaultId}/keys/${keyId}/reveal`,
        { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } },
      );

      if (response.ok) {
        const data = await response.json();
        // Send the value to the content script to paste
        chrome.tabs.sendMessage(tab.id!, {
          type: "LOCKBOX_PASTE_KEY",
          value: data.value,
        });
      }
    } catch (err) {
      console.error("Failed to paste key:", err);
    }
  }
});

// ---- Update Context Menu with Keys ----

async function updateContextMenu() {
  try {
    const token = await getToken();
    if (!token) return;

    // Fetch vaults and keys
    const vaultsRes = await fetch(`${API_BASE_URL}/vaults`, {
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    });

    if (!vaultsRes.ok) return;
    const vaults: Vault[] = await vaultsRes.json();

    // Remove old submenu items
    const existingMenuIds = await getMenuIds();
    for (const id of existingMenuIds) {
      try {
        chrome.contextMenus.remove(id);
      } catch { /* ignore */ }
    }

    const newMenuIds: string[] = [];

    for (const vault of vaults.slice(0, 5)) {
      // Vault separator
      const vaultMenuId = `lockbox-vault-${vault.id}`;
      chrome.contextMenus.create({
        id: vaultMenuId,
        parentId: "lockbox-root",
        title: vault.name,
        enabled: false,
        contexts: ["editable"],
      });
      newMenuIds.push(vaultMenuId);

      // Fetch keys for this vault
      try {
        const keysRes = await fetch(`${API_BASE_URL}/vaults/${vault.id}/keys`, {
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        });

        if (keysRes.ok) {
          const keys: ApiKey[] = await keysRes.json();
          for (const key of keys.slice(0, 10)) {
            const keyMenuId = `lockbox-key-${vault.id}:${key.id}`;
            chrome.contextMenus.create({
              id: keyMenuId,
              parentId: "lockbox-root",
              title: `${key.service} — ${key.name}`,
              contexts: ["editable"],
            });
            newMenuIds.push(keyMenuId);
          }
        }
      } catch { /* ignore individual vault failures */ }
    }

    await chrome.storage.local.set({ lockbox_menu_ids: newMenuIds });
  } catch (err) {
    console.error("Failed to update context menu:", err);
  }
}

async function getMenuIds(): Promise<string[]> {
  const result = await chrome.storage.local.get("lockbox_menu_ids");
  return result.lockbox_menu_ids ?? [];
}

// ---- Omnibox Integration ----

chrome.omnibox.onInputStarted.addListener(() => {
  chrome.omnibox.setDefaultSuggestion({
    description: "Search Lockbox keys...",
  });
});

chrome.omnibox.onInputChanged.addListener(async (text, suggest) => {
  try {
    const token = await getToken();
    if (!token) {
      suggest([]);
      return;
    }

    const cache = await getCachedVaults();
    if (!cache) {
      suggest([]);
      return;
    }

    const lower = text.toLowerCase().trim();
    const suggestions: chrome.omnibox.SuggestResult[] = [];

    for (const vault of cache) {
      for (const key of vault.keys) {
        if (
          key.name.toLowerCase().includes(lower) ||
          key.service.toLowerCase().includes(lower) ||
          vault.name.toLowerCase().includes(lower)
        ) {
          suggestions.push({
            content: `${vault.id}:${key.id}`,
            description: `${key.service} — ${key.name} (${vault.name})`,
          });
        }
      }
    }

    suggest(suggestions.slice(0, 8));
  } catch {
    suggest([]);
  }
});

chrome.omnibox.onInputEntered.addListener(async (text) => {
  // text is the content from the suggestion, formatted as vaultId:keyId
  const parts = text.split(":");
  if (parts.length === 2) {
    const [vaultId, keyId] = parts;
    try {
      const token = await getToken();
      if (!token) return;

      const response = await fetch(
        `${API_BASE_URL}/vaults/${vaultId}/keys/${keyId}/reveal`,
        { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } },
      );

      if (response.ok) {
        const data = await response.json();
        // Copy to clipboard via offscreen document or notification
        // Since service workers can't directly access clipboard, we'll use a workaround
        await chrome.storage.local.set({ lockbox_clipboard_pending: data.value });

        // Open a temporary tab or use the active tab to copy
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab?.id) {
          chrome.tabs.sendMessage(tab.id, {
            type: "LOCKBOX_COPY_TO_CLIPBOARD",
            value: data.value,
          });
        }

        // Show notification
        chrome.notifications.create({
          type: "basic",
          iconUrl: "icons/icon-128.png",
          title: "Lockbox",
          message: "API key copied to clipboard!",
        });
      }
    } catch (err) {
      console.error("Failed to copy key from omnibox:", err);
    }
  }
});

// ---- Badge & Notifications ----

async function checkExpiringKeys() {
  try {
    const token = await getToken();
    if (!token) {
      chrome.action.setBadgeText({ text: "" });
      return;
    }

    const cache = await getCachedVaults();
    if (!cache) return;

    const now = Date.now();
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    let expiringCount = 0;

    for (const vault of cache) {
      for (const key of vault.keys) {
        if (key.expiresAt) {
          const expiresAt = new Date(key.expiresAt).getTime();
          if (expiresAt - now < sevenDays && expiresAt > now) {
            expiringCount++;
          }
        }
      }
    }

    if (expiringCount > 0) {
      chrome.action.setBadgeText({ text: String(expiringCount) });
      chrome.action.setBadgeBackgroundColor({ color: "#f59e0b" });
    } else {
      chrome.action.setBadgeText({ text: "" });
    }
  } catch {
    // Silently fail badge updates
  }
}

// ---- Alarms ----

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "lockbox-check-expiring") {
    checkExpiringKeys();
  }
  if (alarm.name === "lockbox-cache-refresh") {
    updateContextMenu();
  }
});

// ---- Message Handling ----

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "LOCKBOX_AUTH_TOKEN") {
    // Forward auth token to popup
    chrome.runtime.sendMessage(message);
    sendResponse({ success: true });
  }

  if (message.type === "LOCKBOX_GET_KEYS") {
    getCachedVaults().then((vaults) => {
      sendResponse({ vaults });
    });
    return true; // async response
  }

  if (message.type === "LOCKBOX_REVEAL_KEY") {
    const { vaultId, keyId } = message;
    getToken().then(async (token) => {
      if (!token) {
        sendResponse({ error: "Not authenticated" });
        return;
      }
      try {
        const response = await fetch(
          `${API_BASE_URL}/vaults/${vaultId}/keys/${keyId}/reveal`,
          { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } },
        );
        if (response.ok) {
          const data = await response.json();
          sendResponse({ value: data.value });
        } else {
          sendResponse({ error: "Failed to reveal key" });
        }
      } catch (err) {
        sendResponse({ error: "Network error" });
      }
    });
    return true;
  }
});

// ---- Listen for auth from dashboard page ----

chrome.runtime.onMessageExternal?.addListener((message, sender, sendResponse) => {
  if (
    sender.url?.startsWith(DASHBOARD_URL) &&
    message.type === "LOCKBOX_AUTH_TOKEN"
  ) {
    chrome.storage.local.set({
      [STORAGE_KEYS.AUTH_TOKEN]: message.token,
      [STORAGE_KEYS.USER_DATA]: message.user,
    });
    sendResponse({ success: true });
    updateContextMenu();
    checkExpiringKeys();
  }
});

// ---- Helpers ----

async function getToken(): Promise<string | null> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.AUTH_TOKEN);
  const token = result[STORAGE_KEYS.AUTH_TOKEN];
  if (token) return token;

  // Try cookies as fallback
  try {
    const cookie = await chrome.cookies.get({
      url: DASHBOARD_URL,
      name: "__session",
    });
    return cookie?.value ?? null;
  } catch {
    return null;
  }
}

async function getCachedVaults(): Promise<VaultWithKeys[] | null> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.CACHE_DATA);
  const cache = result[STORAGE_KEYS.CACHE_DATA];
  if (!cache) return null;

  return cache.vaults.map((vault: Vault) => ({
    ...vault,
    keys: cache.keys[vault.id] ?? [],
  }));
}

// ---- Startup ----

updateContextMenu();
checkExpiringKeys();
