import { STORAGE_KEYS, CACHE_TTL_MS, RECENT_KEYS_COUNT } from "./constants";
import { api } from "./api";
import type { CacheData, Vault, ApiKey, VaultWithKeys } from "../types";

async function getCacheData(): Promise<CacheData | null> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.CACHE_DATA);
  return result[STORAGE_KEYS.CACHE_DATA] ?? null;
}

async function setCacheData(data: CacheData): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEYS.CACHE_DATA]: data });
}

function isCacheValid(cache: CacheData | null): boolean {
  if (!cache) return false;
  return Date.now() - cache.lastFetched < CACHE_TTL_MS;
}

export async function getVaultsWithKeys(
  forceRefresh = false,
): Promise<VaultWithKeys[]> {
  const cache = await getCacheData();

  if (!forceRefresh && isCacheValid(cache) && cache) {
    return cache.vaults.map((vault) => ({
      ...vault,
      keys: cache.keys[vault.id] ?? [],
    }));
  }

  // Fetch fresh data
  const vaults = await api.getVaults();
  const keys: Record<string, ApiKey[]> = {};

  // Fetch keys for all vaults in parallel
  const keyResults = await Promise.allSettled(
    vaults.map((vault) => api.getKeys(vault.id)),
  );

  vaults.forEach((vault, index) => {
    const result = keyResults[index];
    keys[vault.id] = result.status === "fulfilled" ? result.value : [];
  });

  // Update cache
  await setCacheData({
    vaults,
    keys,
    lastFetched: Date.now(),
  });

  return vaults.map((vault) => ({
    ...vault,
    keys: keys[vault.id] ?? [],
  }));
}

export async function addRecentKey(
  keyId: string,
  vaultId: string,
): Promise<void> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.RECENT_KEYS);
  const recent: Array<{ keyId: string; vaultId: string; timestamp: number }> =
    result[STORAGE_KEYS.RECENT_KEYS] ?? [];

  // Remove existing entry for this key
  const filtered = recent.filter((r) => r.keyId !== keyId);

  // Add to front
  filtered.unshift({ keyId, vaultId, timestamp: Date.now() });

  // Keep only recent N
  const trimmed = filtered.slice(0, RECENT_KEYS_COUNT);

  await chrome.storage.local.set({ [STORAGE_KEYS.RECENT_KEYS]: trimmed });
}

export async function getRecentKeys(): Promise<
  Array<{ keyId: string; vaultId: string; timestamp: number }>
> {
  const result = await chrome.storage.local.get(STORAGE_KEYS.RECENT_KEYS);
  return result[STORAGE_KEYS.RECENT_KEYS] ?? [];
}

export async function invalidateCache(): Promise<void> {
  await chrome.storage.local.remove(STORAGE_KEYS.CACHE_DATA);
}
