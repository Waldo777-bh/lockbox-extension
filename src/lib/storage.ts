// Chrome storage wrapper

import type { EncryptedVault, WalletConfig, WalletStatus, AccountInfo } from "@/types";
import { STORAGE_KEYS, DEFAULT_CONFIG } from "./constants";

type StorageArea = "local" | "session";

async function get<T>(key: string, area: StorageArea = "local"): Promise<T | null> {
  const storage = area === "session" ? chrome.storage.session : chrome.storage.local;
  const result = await storage.get(key);
  return (result[key] as T) ?? null;
}

async function set(key: string, value: any, area: StorageArea = "local"): Promise<void> {
  const storage = area === "session" ? chrome.storage.session : chrome.storage.local;
  await storage.set({ [key]: value });
}

async function remove(key: string, area: StorageArea = "local"): Promise<void> {
  const storage = area === "session" ? chrome.storage.session : chrome.storage.local;
  await storage.remove(key);
}

// ── Vault ──
export async function getEncryptedVault(): Promise<EncryptedVault | null> {
  return get<EncryptedVault>(STORAGE_KEYS.VAULT);
}

export async function setEncryptedVault(vault: EncryptedVault): Promise<void> {
  return set(STORAGE_KEYS.VAULT, vault);
}

// ── Config ──
export async function getConfig(): Promise<WalletConfig> {
  const config = await get<WalletConfig>(STORAGE_KEYS.CONFIG);
  return config ?? { ...DEFAULT_CONFIG };
}

export async function setConfig(config: Partial<WalletConfig>): Promise<void> {
  const current = await getConfig();
  return set(STORAGE_KEYS.CONFIG, { ...current, ...config });
}

// ── Status ──
export async function getStatus(): Promise<WalletStatus> {
  const status = await get<WalletStatus>(STORAGE_KEYS.STATUS);
  return status ?? "uninitialized";
}

export async function setStatus(status: WalletStatus): Promise<void> {
  return set(STORAGE_KEYS.STATUS, status);
}

// ── Account ──
export async function getAccount(): Promise<AccountInfo | null> {
  return get<AccountInfo>(STORAGE_KEYS.ACCOUNT);
}

export async function setAccount(account: AccountInfo): Promise<void> {
  return set(STORAGE_KEYS.ACCOUNT, account);
}

// ── Derived Key (session storage — cleared when browser closes) ──
export async function getDerivedKey(): Promise<string | null> {
  return get<string>(STORAGE_KEYS.DERIVED_KEY, "session");
}

export async function setDerivedKey(key: string): Promise<void> {
  return set(STORAGE_KEYS.DERIVED_KEY, key, "session");
}

export async function clearDerivedKey(): Promise<void> {
  return remove(STORAGE_KEYS.DERIVED_KEY, "session");
}

// ── Site Permissions ──
export async function getSitePermissions(): Promise<Record<string, boolean>> {
  const perms = await get<Record<string, boolean>>(STORAGE_KEYS.SITE_PERMISSIONS);
  return perms ?? {};
}

export async function setSitePermission(domain: string, allowed: boolean): Promise<void> {
  const perms = await getSitePermissions();
  perms[domain] = allowed;
  return set(STORAGE_KEYS.SITE_PERMISSIONS, perms);
}

// ── Recent Keys ──
export async function getRecentKeys(): Promise<string[]> {
  const keys = await get<string[]>(STORAGE_KEYS.RECENT_KEYS);
  return keys ?? [];
}

export async function addRecentKey(keyId: string): Promise<void> {
  const keys = await getRecentKeys();
  const updated = [keyId, ...keys.filter((k) => k !== keyId)].slice(0, 5);
  return set(STORAGE_KEYS.RECENT_KEYS, updated);
}

// ── Clear All ──
export async function clearAllData(): Promise<void> {
  await chrome.storage.local.clear();
  await chrome.storage.session.clear();
}
