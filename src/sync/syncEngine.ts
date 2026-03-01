// Sync engine — push/pull encrypted vault to/from dashboard

import type { DecryptedWallet } from "@/types";
import { getEncryptedVault, setEncryptedVault, getConfig, setConfig } from "@/lib/storage";
import { pushVault, pullVault, getSyncStatus, type SyncPushPayload } from "./api";

export type SyncStatus = "synced" | "syncing" | "offline" | "error";

let syncStatus: SyncStatus = "offline";
let listeners: ((status: SyncStatus) => void)[] = [];

export function getSyncState(): SyncStatus {
  return syncStatus;
}

export function onSyncStatusChange(fn: (status: SyncStatus) => void) {
  listeners.push(fn);
  return () => {
    listeners = listeners.filter((l) => l !== fn);
  };
}

function setSyncStatus(status: SyncStatus) {
  syncStatus = status;
  listeners.forEach((fn) => fn(status));
}

/** Compute a SHA-256 hex checksum of the encrypted vault string */
async function computeChecksum(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const buffer = await crypto.subtle.digest("SHA-256", encoder.encode(data));
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Extract metadata from the decrypted wallet for dashboard display */
function extractMetadata(wallet: DecryptedWallet): SyncPushPayload["metadata"] {
  const now = new Date().toISOString();

  // Build per-service aggregation
  const serviceMap = new Map<string, { keyCount: number }>();
  let totalKeys = 0;

  const vaults = wallet.vaults.map((v) => {
    const vaultServices = new Set<string>();
    for (const key of v.keys) {
      vaultServices.add(key.service);
      const existing = serviceMap.get(key.service);
      if (existing) {
        existing.keyCount++;
      } else {
        serviceMap.set(key.service, { keyCount: 1 });
      }
    }
    totalKeys += v.keys.length;

    return {
      id: v.id,
      name: v.name,
      keyCount: v.keys.length,
      services: Array.from(vaultServices),
      lastModified: v.updatedAt || now,
    };
  });

  const services = Array.from(serviceMap.entries()).map(([name, data]) => ({
    name,
    keyCount: data.keyCount,
    keyNames: [] as string[], // Never send key names to server
  }));

  return {
    vaultCount: wallet.vaults.length,
    totalKeys,
    vaults,
    services,
    lastModified: now,
  };
}

export async function syncPush(wallet?: DecryptedWallet): Promise<void> {
  try {
    // Check if user has a dashboard account linked before attempting sync
    const account = await chrome.storage.local.get("lockbox_account");
    const token = account.lockbox_account?.token;
    if (!token) {
      // Not connected to dashboard — silently skip sync
      setSyncStatus("offline");
      return;
    }

    setSyncStatus("syncing");
    const encryptedVault = await getEncryptedVault();
    if (!encryptedVault) {
      setSyncStatus("synced");
      return;
    }

    const encryptedString = JSON.stringify(encryptedVault);
    const checksum = await computeChecksum(encryptedString);

    // Build metadata from decrypted wallet if available
    const metadata = wallet
      ? extractMetadata(wallet)
      : {
          vaultCount: 0,
          totalKeys: 0,
          vaults: [],
          services: [],
          lastModified: new Date().toISOString(),
        };

    await pushVault({
      encryptedVault: encryptedString,
      metadata,
      checksum,
    });

    await setConfig({ lastSynced: new Date().toISOString() });
    setSyncStatus("synced");
  } catch (err) {
    console.error("Sync push failed:", err);
    setSyncStatus("error");
  }
}

export async function syncPull(): Promise<void> {
  try {
    setSyncStatus("syncing");
    const response = await pullVault();

    if (response?.encryptedVault) {
      const vault = JSON.parse(response.encryptedVault);
      await setEncryptedVault(vault);
      await setConfig({ lastSynced: new Date().toISOString() });
    }

    setSyncStatus("synced");
  } catch (err) {
    console.error("Sync pull failed:", err);
    setSyncStatus("error");
  }
}

export async function checkSync(): Promise<boolean> {
  try {
    const status = await getSyncStatus();
    return status.hasChanges;
  } catch {
    return false;
  }
}
